/**
 * Sogni Authentication Service for Makeover
 *
 * Manages authentication state using the real Sogni Client SDK with
 * cookie-based sessions. Provides a React hook for components to
 * observe auth state.
 */

import React from 'react';
import { SogniClient } from '@sogni-ai/sogni-client';
import { getOrCreateAppId } from '@/utils/appId';
import { tabSync } from '@/services/tabSync';

// --- Types ---

export interface SogniAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    username?: string;
    email?: string;
  } | null;
  authMode: 'frontend' | 'demo' | null;
  error: string | null;
  sessionTransferred?: boolean;
}

export interface SogniAuthService {
  getAuthState(): SogniAuthState;
  login(username: string, password: string): Promise<boolean>;
  logout(): Promise<boolean>;
  switchToDemoMode(): Promise<boolean>;
  checkExistingSession(): Promise<boolean>;
  onAuthStateChange(callback: (state: SogniAuthState) => void): () => void;
  getSogniClient(): SogniClient | null;
}

// --- SogniAuthManager (singleton) ---

class SogniAuthManager implements SogniAuthService {
  private authState: SogniAuthState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    authMode: null,
    error: null,
  };

  private sogniClient: SogniClient | null = null;
  private authStateListeners: ((state: SogniAuthState) => void)[] = [];
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initialize();

    // Listen for other tabs taking over the session
    tabSync.onNewTabDetected((newTabDetected) => {
      if (newTabDetected && this.authState.isAuthenticated) {
        console.log('New authenticated tab detected, setting session transfer flag');
        this.setAuthState({
          sessionTransferred: true,
          error: 'Your Makeover session has been transferred to a new tab. Please refresh the browser to resume in this tab.',
        });
      }
    });
  }

  // --- Private helpers ---

  private async initialize(): Promise<void> {
    try {
      this.setAuthState({ isLoading: true, error: null });
      await this.checkExistingSession();
    } catch (error) {
      console.error('Failed to initialize auth manager:', error);
      this.setAuthState({
        error: error instanceof Error ? error.message : 'Failed to initialize authentication',
        isLoading: false,
      });
    }
  }

  private setAuthState(updates: Partial<SogniAuthState>): void {
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.authStateListeners.forEach(listener => listener(this.authState));
  }

  /**
   * Determine environment-aware Sogni API / socket URLs
   */
  getSogniUrls(): { rest: string; socket: string } {
    const hostname = window.location.hostname;
    const isStaging = hostname.includes('staging');

    if (isStaging) {
      return {
        rest: 'https://api-staging.sogni.ai',
        socket: 'wss://socket-staging.sogni.ai',
      };
    }

    // Production (also used for local development)
    return {
      rest: 'https://api.sogni.ai',
      socket: 'wss://socket.sogni.ai',
    };
  }

  // --- Public API ---

  /**
   * Attempt to restore an existing session from cookies
   */
  async checkExistingSession(): Promise<boolean> {
    try {
      this.setAuthState({ isLoading: true, error: null });

      const sogniUrls = this.getSogniUrls();
      const hostname = window.location.hostname;
      const isStaging = hostname.includes('staging');

      // If the client is already authenticated, just confirm state
      /* eslint-disable @typescript-eslint/no-explicit-any */
      if (this.sogniClient) {
        const currentAccount = this.sogniClient.account.currentAccount;
        const isAlready = (currentAccount as any)?.isAuthenticated;

        if (isAlready) {
          console.log('Client already authenticated');
          this.setAuthState({
            isAuthenticated: true,
            authMode: 'frontend',
            user: { username: currentAccount?.username, email: currentAccount?.email },
            isLoading: false,
            error: null,
            sessionTransferred: false,
          });
          tabSync.notifyNewAuthenticatedTab();
          return true;
        }
      }

      // Create a client if needed
      if (!this.sogniClient) {
        const appId = getOrCreateAppId();
        this.sogniClient = await SogniClient.createInstance({
          appId,
          network: 'fast',
          restEndpoint: sogniUrls.rest,
          socketEndpoint: sogniUrls.socket,
          testnet: isStaging,
          authType: 'cookies',
        });
      }

      // Try to resume via checkAuth
      console.log('Calling checkAuth to resume session...');
      const isAuthenticated = await this.sogniClient.checkAuth().catch((error: any) => {
        console.log('checkAuth failed:', error);

        if (error?.code === 4052 || error?.message?.includes('verify your email')) {
          this.setAuthState({
            isAuthenticated: false,
            authMode: null,
            user: null,
            isLoading: false,
            error: 'Email verification required. Please verify your email at app.sogni.ai and try again.',
          });

          window.dispatchEvent(new CustomEvent('sogni-email-verification-required', {
            detail: {
              error,
              message: 'Your Sogni account email needs to be verified to generate images.',
            },
          }));
        }

        return false;
      });

      if (isAuthenticated) {
        // Set up socket error handling
        if (this.sogniClient.apiClient) {
          (this.sogniClient.apiClient as any).on('error', (error: any) => {
            console.error('Frontend client socket error:', error);
            if (error?.code === 4052 || error?.reason?.includes('verify your email')) {
              window.dispatchEvent(new CustomEvent('sogni-email-verification-required', {
                detail: { error, message: 'Your Sogni account email needs to be verified to generate images.' },
              }));
            }
          });
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */

        this.setAuthState({
          isAuthenticated: true,
          authMode: 'frontend',
          user: {
            username: this.sogniClient.account.currentAccount?.username,
            email: this.sogniClient.account.currentAccount?.email,
          },
          isLoading: false,
          error: null,
          sessionTransferred: false,
        });

        tabSync.notifyNewAuthenticatedTab();
        console.log('Existing Sogni session found and restored');
        return true;
      }

      // No session
      this.setAuthState({
        isAuthenticated: false,
        authMode: null,
        user: null,
        isLoading: false,
        error: null,
        sessionTransferred: false,
      });
      console.log('No existing Sogni session found');
      return false;
    } catch (error) {
      console.error('Error checking existing session:', error);
      this.setAuthState({
        isAuthenticated: false,
        authMode: null,
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check existing session',
        sessionTransferred: false,
      });
      return false;
    }
  }

  /**
   * Log in with Sogni credentials
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      this.setAuthState({ isLoading: true, error: null });

      const client = await this.ensureClient();
      await client.account.login(username, password);

      const currentAccount = client.account.currentAccount;

      this.setAuthState({
        isAuthenticated: true,
        authMode: 'frontend',
        user: {
          username: currentAccount?.username || username,
          email: currentAccount?.email,
        },
        isLoading: false,
        error: null,
        sessionTransferred: false,
      });

      tabSync.notifyNewAuthenticatedTab();
      console.log('Successfully logged in to Sogni');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      this.setAuthState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      return false;
    }
  }

  /**
   * Log out and tear down the client
   */
  async logout(): Promise<boolean> {
    try {
      this.setAuthState({ isLoading: true, error: null });

      if (this.sogniClient) {
        await this.sogniClient.account.logout();
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if ((this.sogniClient as any).disconnect) {
          await (this.sogniClient as any).disconnect();
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */
        this.sogniClient = null;
      }

      tabSync.clearSession();

      this.setAuthState({
        isAuthenticated: false,
        authMode: null,
        user: null,
        isLoading: false,
        error: null,
        sessionTransferred: false,
      });

      console.log('Successfully logged out from Sogni');
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      this.sogniClient = null;
      tabSync.clearSession();

      this.setAuthState({
        isAuthenticated: false,
        authMode: null,
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
        sessionTransferred: false,
      });
      return false;
    }
  }

  /**
   * Switch to demo (backend-proxied) mode
   */
  async switchToDemoMode(): Promise<boolean> {
    try {
      this.setAuthState({ isLoading: true, error: null });

      /* eslint-disable @typescript-eslint/no-explicit-any */
      if (this.sogniClient) {
        if ((this.sogniClient as any).disconnect) {
          await (this.sogniClient as any).disconnect();
        }
        this.sogniClient = null;
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */

      this.setAuthState({
        isAuthenticated: true,
        authMode: 'demo',
        user: null,
        isLoading: false,
        error: null,
        sessionTransferred: false,
      });

      console.log('Switched to demo mode');
      return true;
    } catch (error) {
      console.error('Failed to switch to demo mode:', error);
      this.setAuthState({
        isAuthenticated: false,
        authMode: null,
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to switch to demo mode',
        sessionTransferred: false,
      });
      return false;
    }
  }

  getState(): SogniAuthState {
    return { ...this.authState };
  }

  getAuthState(): SogniAuthState {
    return this.getState();
  }

  getSogniClient(): SogniClient | null {
    return this.sogniClient;
  }

  /**
   * Create or return an existing SogniClient instance
   */
  async ensureClient(): Promise<SogniClient> {
    if (this.sogniClient) {
      return this.sogniClient;
    }

    const sogniUrls = this.getSogniUrls();
    const hostname = window.location.hostname;
    const isStaging = hostname.includes('staging');
    const appId = getOrCreateAppId();

    this.sogniClient = await SogniClient.createInstance({
      appId,
      network: 'fast',
      restEndpoint: sogniUrls.rest,
      socketEndpoint: sogniUrls.socket,
      testnet: isStaging,
      authType: 'cookies',
    });

    if (!this.sogniClient) {
      throw new Error('Failed to create Sogni client');
    }

    return this.sogniClient;
  }

  /**
   * Subscribe to auth state changes. Returns an unsubscribe function.
   */
  subscribe(callback: (state: SogniAuthState) => void): () => void {
    return this.onAuthStateChange(callback);
  }

  onAuthStateChange(callback: (state: SogniAuthState) => void): () => void {
    this.authStateListeners.push(callback);
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Directly set authenticated state (e.g. after signup flow)
   */
  setAuthenticatedState(username: string, email?: string): void {
    if (!this.sogniClient) {
      console.error('Cannot set authenticated state: no client available');
      return;
    }

    this.setAuthState({
      isAuthenticated: true,
      authMode: 'frontend',
      user: { username, email },
      isLoading: false,
      error: null,
      sessionTransferred: false,
    });

    tabSync.notifyNewAuthenticatedTab();
    console.log('Auth state set to authenticated');
  }

  /**
   * Wait until the initial session check is done
   */
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }
}

// --- Singleton ---

export const sogniAuth = new SogniAuthManager();

// --- React hook ---

export function useSogniAuth() {
  const [authState, setAuthState] = React.useState<SogniAuthState>(sogniAuth.getAuthState());

  React.useEffect(() => {
    sogniAuth.waitForInitialization().then(() => {
      setAuthState(sogniAuth.getAuthState());
    });

    const unsubscribe = sogniAuth.onAuthStateChange(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: sogniAuth.login.bind(sogniAuth),
    logout: sogniAuth.logout.bind(sogniAuth),
    switchToDemoMode: sogniAuth.switchToDemoMode.bind(sogniAuth),
    checkExistingSession: sogniAuth.checkExistingSession.bind(sogniAuth),
    getSogniClient: sogniAuth.getSogniClient.bind(sogniAuth),
    ensureClient: sogniAuth.ensureClient.bind(sogniAuth),
    setAuthenticatedState: sogniAuth.setAuthenticatedState.bind(sogniAuth),
    waitForInitialization: sogniAuth.waitForInitialization.bind(sogniAuth),
  };
}
