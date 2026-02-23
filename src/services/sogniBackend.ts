/**
 * Sogni Backend Service
 *
 * Handles all communication with the Sogni API through the Makeover backend
 * instead of directly using the Sogni SDK in the frontend.
 *
 * Simplified from the photobooth version: image-only, no video/audio/enhancement/controlNet.
 */

import {
  createProject as apiCreateProject,
  checkSogniStatus,
  cancelProject,
  clientAppId,
  disconnectSession,
  type CancelProjectResult,
  type CreateProjectParams,
} from '@/services/api';
import {
  getCancellationState,
  recordCancelAttempt,
  notifyCancelStateChange,
} from '@/services/cancellationService';
import urls from '@/config/urls';

const API_BASE_URL = urls.apiUrl;

// --- Event emitter ---

interface SogniEventEmitter {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
}

/**
 * Simple browser-compatible event emitter
 */
export class BrowserEventEmitter implements SogniEventEmitter {
  private listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  on(event: string, callback: (...args: unknown[]) => void): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  off(event: string, callback: (...args: unknown[]) => void): this {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }

  emit(event: string, ...args: unknown[]): this {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
    return this;
  }
}

// --- BackendProject ---

/**
 * Represents a single generation project proxied through the backend.
 *
 * Events emitted:
 *  - uploadProgress (progress: number)
 *  - uploadComplete ()
 *  - job ({ type, jobId, progress?, workerName?, ... })
 *  - jobCompleted (job)
 *  - jobFailed ({ ...job, error })
 *  - completed (data)
 *  - failed (error: Error)
 *  - cancelled ({ completedJobs, totalJobs, projectId })
 */
export class BackendProject extends BrowserEventEmitter {
  public id: string;
  public status: string = 'pending';
  public jobs: {
    id: string;
    resultUrl?: string;
    previewUrl?: string;
    workerName?: string;
    realJobId?: string;
    index?: number;
    positivePrompt?: string;
    negativePrompt?: string;
    jobIndex?: number;
    on: (event: string, callback: (progress: number) => void) => void;
    progressCallback?: (progress: number) => void;
    error?: string;
  }[] = [];

  constructor(id: string) {
    super();
    this.id = id;
  }

  /**
   * Add a job placeholder to the project
   */
  addJob(jobId: string, resultUrl?: string, index?: number, workerName?: string) {
    const job: BackendProject['jobs'][number] = {
      id: jobId,
      resultUrl,
      workerName: workerName || '',
      index,
      realJobId: undefined,
      positivePrompt: undefined,
      negativePrompt: undefined,
      jobIndex: undefined,
      on: (event: string, callback: (progress: number) => void) => {
        if (event === 'progress') {
          job.progressCallback = callback;
        }
      },
      progressCallback: undefined,
      error: undefined,
    };
    this.jobs.push(job);
    return job;
  }

  /**
   * Update progress for a specific job
   */
  updateJobProgress(jobId: string, progress: number | null | undefined, workerName?: string) {
    const job = this.jobs.find(j => j.id === jobId);

    if (workerName && job && (!job.workerName || job.workerName !== workerName)) {
      job.workerName = workerName;
    }

    if (progress === null || progress === undefined) {
      return;
    }

    // Normalise to 0-1 range
    const normalizedProgress = typeof progress === 'number' && progress > 1 ? progress / 100 : progress;

    if (job && job.progressCallback) {
      job.progressCallback(normalizedProgress);
    }

    this.emit('job', {
      type: 'progress',
      jobId,
      progress: normalizedProgress,
      projectId: this.id,
      workerName: job ? job.workerName : workerName,
    });
  }

  /**
   * Mark a job as completed with a result URL
   */
  completeJob(jobId: string, resultUrl: string) {
    const job = this.jobs.find(j => j.id === jobId);
    if (job) {
      job.resultUrl = resultUrl;
      this.emit('jobCompleted', job);
    } else {
      console.warn(`BackendProject: Could not find job ${jobId} to complete`);
    }
  }

  /**
   * Mark a job as failed
   */
  failJob(jobId: string, error: string) {
    const job = this.jobs.find(j => j.id === jobId);
    if (job) {
      job.error = error;
      this.emit('jobFailed', { ...job, error });
    }
  }

  /**
   * Cancel this project
   */
  async cancel(): Promise<CancelProjectResult> {
    return cancelProject(this.id);
  }

  /**
   * Wait until the project emits "completed" or "failed"
   */
  waitForCompletion(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const onComplete = () => {
        this.off('completed', onComplete);
        this.off('failed', onFail);
        resolve();
      };
      const onFail = (err: unknown) => {
        this.off('completed', onComplete);
        this.off('failed', onFail);
        reject(err instanceof Error ? err : new Error(String(err)));
      };
      this.on('completed', onComplete);
      this.on('failed', onFail);
    });
  }
}

// --- BackendSogniClient ---

export interface BackendAccount {
  isLoggedInValue: boolean;
  readonly isLoggedIn: boolean;
  login: () => Promise<boolean>;
  logout: () => Promise<boolean>;
}

export class BackendSogniClient {
  public appId: string;
  public network: string;
  public account: BackendAccount;
  public projects: {
    create: (params: CreateProjectParams) => Promise<BackendProject>;
    estimateCost: (params: Record<string, unknown>) => Promise<{ token: number } | null>;
    on: (event: string, callback: (...args: unknown[]) => void) => void;
  };

  private activeProjects: Map<string, BackendProject> = new Map();
  private isDisconnecting: boolean = false;

  private static instances: Map<string, BackendSogniClient> = new Map();
  private static isGlobalCleanup: boolean = false;

  constructor(appId: string) {
    this.appId = appId;
    this.network = 'fast';

    this.account = {
      get isLoggedIn() {
        return this.isLoggedInValue;
      },
      isLoggedInValue: false,
      login: () => {
        this.account.isLoggedInValue = true;
        return Promise.resolve(true);
      },
      logout: () => {
        this.account.isLoggedInValue = false;
        void this.disconnect();
        return Promise.resolve(true);
      }
    };

    this.projects = {
      create: this.createProject.bind(this),
      estimateCost: this.estimateCostInternal.bind(this),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      on: (_event: string, _handler: (...args: unknown[]) => void) => { /* noop */ },
    };

    if (this.appId) {
      BackendSogniClient.instances.set(this.appId, this);
      console.log(`Registered BackendSogniClient instance with appId: ${this.appId}`);
    }
  }

  // --- Lifecycle ---

  async disconnect(): Promise<boolean> {
    if (this.isDisconnecting) {
      return true;
    }
    this.isDisconnecting = true;

    try {
      const activeProjectIds = Array.from(this.activeProjects.keys());
      if (activeProjectIds.length > 0) {
        console.log(`Cancelling ${activeProjectIds.length} active projects before disconnecting`);
        await Promise.allSettled(
          activeProjectIds.map(pid => this.cancelProject(pid))
        );
        this.activeProjects.clear();
      }

      if (!BackendSogniClient.isGlobalCleanup) {
        await disconnectSession();
      }

      this.account.isLoggedInValue = false;
      if (this.appId) {
        BackendSogniClient.instances.delete(this.appId);
      }
      return true;
    } catch (error) {
      console.error(`Error during BackendSogniClient disconnect for ${this.appId}:`, error);
      if (this.appId) {
        BackendSogniClient.instances.delete(this.appId);
      }
      return false;
    }
  }

  static createInstance(config: Record<string, unknown>): BackendSogniClient {
    const appId = typeof config.appId === 'string' ? config.appId : undefined;
    if (appId && BackendSogniClient.instances.has(appId)) {
      console.log(`Reusing existing Sogni client with appId: ${appId}`);
      return BackendSogniClient.instances.get(appId)!;
    }

    const client = new BackendSogniClient(appId ?? '');
    if (appId) {
      BackendSogniClient.instances.set(appId, client);
    }
    return client;
  }

  static async disconnectAll(): Promise<void> {
    BackendSogniClient.isGlobalCleanup = true;
    console.log(`Disconnecting all ${BackendSogniClient.instances.size} BackendSogniClient instances`);

    try {
      await disconnectSession();
    } catch (error) {
      console.warn('Error in global disconnect request:', error);
    }

    const promises = Array.from(BackendSogniClient.instances.values()).map(client => {
      try {
        return client.disconnect().catch(err => {
          console.warn(`Error disconnecting client ${client.appId}:`, err);
          return false;
        });
      } catch (err) {
        console.warn(`Error in disconnect call for client ${client.appId}:`, err);
        return Promise.resolve(false);
      }
    });

    await Promise.allSettled(promises);
    BackendSogniClient.instances.clear();
    BackendSogniClient.isGlobalCleanup = false;
    console.log('All BackendSogniClient instances disconnected');
  }

  // --- Cancel ---

  async cancelProject(projectId: string): Promise<CancelProjectResult> {
    const project = this.activeProjects.get(projectId);

    const cancelState = getCancellationState();
    if (!cancelState.canCancel) {
      return {
        success: false,
        didCancel: false,
        projectId,
        rateLimited: true,
        cooldownRemaining: cancelState.cooldownRemaining,
        errorMessage: `Please wait ${cancelState.cooldownRemaining} seconds before cancelling again`
      };
    }

    if (!project) {
      return {
        success: false,
        didCancel: false,
        projectId,
        errorMessage: 'Project not found'
      };
    }

    try {
      const result = await cancelProject(projectId);

      if (result.rateLimited) {
        return result;
      }

      recordCancelAttempt();
      notifyCancelStateChange();

      if (result.didCancel) {
        const completedJobs = project.jobs.filter(j => j.resultUrl).length;
        const totalJobs = project.jobs.length;

        project.emit('cancelled', { completedJobs, totalJobs, projectId });

        if (completedJobs > 0) {
          project.emit('completed', { type: 'completed', partial: true, completedJobs, totalJobs });
        } else {
          project.emit('failed', new Error('Project cancelled by user'));
        }

        project.jobs.forEach(job => {
          if (!job.resultUrl && !job.error) {
            job.error = 'Cancelled';
          }
        });

        this.activeProjects.delete(projectId);
        return { ...result, completedJobs, totalJobs };
      }

      return result;
    } catch (error: unknown) {
      console.error(`Error cancelling project ${projectId}:`, error);
      return {
        success: false,
        didCancel: false,
        projectId,
        errorMessage: `Project cancellation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // --- Create ---

  private createProject(params: CreateProjectParams): Promise<BackendProject> {
    // Clean up previous active projects
    if (this.activeProjects.size > 0) {
      console.log(`Cleaning up ${this.activeProjects.size} old projects before starting new one`);
      for (const [oldId, oldProject] of this.activeProjects.entries()) {
        try {
          oldProject.emit('cancelled');
          oldProject.emit('failed', new Error('Replaced by new project'));
          console.log(`Cleaned up old project ${oldId}`);
        } catch (error) {
          console.warn(`Error cleaning up old project ${oldId}:`, error);
        }
      }
      this.activeProjects.clear();
    }

    const projectId = `backend-project-${Date.now()}`;
    const project = new BackendProject(projectId);
    this.activeProjects.set(projectId, project);

    // Create placeholder jobs
    const numImages = params.numberOfMedia || 1;
    for (let i = 0; i < numImages; i++) {
      const placeholderId = `placeholder-${projectId}-${i}`;
      project.addJob(placeholderId, undefined, i);
    }

    // Fire-and-forget the backend generation
    try {
      apiCreateProject(params, (progressEvent: unknown) => {
        if (!progressEvent || typeof progressEvent !== 'object') return;

        const event = progressEvent as Record<string, unknown>;
        const eventType = event.type as string;

        // Upload progress events
        if (eventType === 'uploadProgress') {
          project.emit('uploadProgress', event.progress);
          return;
        }
        if (eventType === 'uploadComplete') {
          setTimeout(() => project.emit('uploadComplete'), 2000);
          return;
        }

        // Simple numeric progress
        if (typeof progressEvent === 'number') {
          project.jobs.forEach(job => project.updateJobProgress(job.id, progressEvent as number));
          return;
        }

        const jobId = event.jobId as string | undefined;
        const workerName = typeof event.workerName === 'string' ? event.workerName : undefined;

        // --- Project-level terminal events ---
        if (eventType === 'completed') {
          project.status = 'completed';
          project.emit('completed', event);
          return;
        }
        if (eventType === 'failed' || eventType === 'error') {
          project.status = 'failed';
          const errorMsg = (event.error as string) || (event.message as string) || 'Generation failed';
          const err = new Error(errorMsg) as Error & { projectId: string };
          err.projectId = project.id;
          project.emit('failed', err);
          project.jobs.forEach(job => {
            if (!job.resultUrl && !job.error) {
              project.failJob(job.id, errorMsg);
            }
          });
          return;
        }

        // --- Job-level events ---
        let targetJob = project.jobs.find(j => j.realJobId === jobId) ?? null;
        if (!targetJob) {
          targetJob = project.jobs.find(j => !j.realJobId) ?? null;
        }

        if (eventType === 'queued') {
          if (targetJob) {
            project.emit('job', {
              type: 'queued',
              jobId: targetJob.id,
              realJobId: jobId,
              projectId: project.id,
              queuePosition: event.queuePosition,
            });
          }
          return;
        }

        if (!targetJob) {
          console.warn(`Event ${eventType} received for unknown job ID: ${jobId ?? 'N/A'}`);
          return;
        }

        // Assign real job ID
        if (jobId && !targetJob.realJobId) {
          targetJob.realJobId = jobId;
        }
        if (workerName && !targetJob.workerName) {
          targetJob.workerName = workerName;
        }

        switch (eventType) {
          case 'initiating':
          case 'started':
            targetJob.jobIndex = event.index as number;
            targetJob.positivePrompt = event.positivePrompt as string;
            project.status = 'generating';
            project.emit('job', {
              type: eventType,
              jobId: targetJob.id,
              realJobId: jobId,
              projectId: project.id,
              workerName,
              positivePrompt: event.positivePrompt,
              jobIndex: event.index,
            });
            break;

          case 'progress':
            if (event.progress !== undefined) {
              project.updateJobProgress(targetJob.id, event.progress as number, targetJob.workerName);
            }
            break;

          case 'preview': {
            const previewUrl = (event.previewUrl as string) || (event.resultUrl as string);
            if (previewUrl) {
              targetJob.previewUrl = previewUrl;
              project.emit('jobCompleted', {
                ...targetJob,
                resultUrl: previewUrl,
                previewUrl,
                isPreview: true,
              });
            }
            break;
          }

          case 'jobCompleted': {
            const resultUrl = event.resultUrl as string;
            const isNSFW = event.nsfwFiltered as boolean;

            if (resultUrl) {
              if (!targetJob.resultUrl) {
                project.completeJob(targetJob.id, resultUrl);
              }
            } else if (isNSFW) {
              project.failJob(targetJob.id, 'CONTENT FILTERED: NSFW detected');
            } else {
              project.failJob(targetJob.id, 'No result URL provided');
            }
            break;
          }

          case 'jobFailed': {
            const errMsg = (event.error as string) || 'Generation failed';
            project.failJob(targetJob.id, errMsg);
            break;
          }

          default:
            console.warn(`Unhandled event type: ${eventType}`);
        }
      }).catch((error: unknown) => {
        if (!this.activeProjects.has(projectId)) {
          return;
        }
        console.error('Backend generation process failed:', error);
        project.emit('uploadComplete');

        if (error && typeof error === 'object' && (error as { name?: string }).name === 'NetworkError') {
          project.emit('failed', error);
        } else {
          const msg = error instanceof Error ? error.message : String(error);
          project.emit('failed', new Error(msg));
        }
        this.activeProjects.delete(projectId);
      });
    } catch (error) {
      if (!this.activeProjects.has(projectId)) {
        return Promise.resolve(project);
      }
      console.error('Error starting generation:', error);
      project.emit('uploadComplete');
      const msg = error instanceof Error ? error.message : String(error);
      project.emit('failed', new Error(msg));
      this.activeProjects.delete(projectId);
    }

    return Promise.resolve(project);
  }

  // --- Cost estimation ---

  private async estimateCostInternal(params: Record<string, unknown>): Promise<{ token: number } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sogni/estimate-cost`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-App-ID': this.appId,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Cost estimation failed: ${response.statusText}`);
      }

      return (await response.json()) as { token: number };
    } catch (error) {
      console.warn('Cost estimation failed:', error);
      return null;
    }
  }
}

// --- Factory ---

/**
 * Initialize a BackendSogniClient for the Makeover app
 */
export function initializeSogniClient(clientAppIdOverride?: string): Promise<BackendSogniClient> {
  try {
    void checkSogniStatus()
      .then(() => console.log('Initial Sogni connection established'))
      .catch(err => {
        if (err.message === 'Status check throttled') {
          console.log('Sogni status check throttled (normal during initialization)');
        } else {
          console.warn('Failed to establish initial Sogni connection:', err);
        }
      });

    const appIdToUse = clientAppIdOverride || clientAppId || `makeover-frontend-${Date.now()}`;
    const client = BackendSogniClient.createInstance({
      appId: appIdToUse,
      testnet: false,
      network: 'fast',
      logLevel: 'debug',
    });

    void client.account.login();
    return Promise.resolve(client);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error initializing Sogni client:', msg);
    throw new Error(msg);
  }
}
