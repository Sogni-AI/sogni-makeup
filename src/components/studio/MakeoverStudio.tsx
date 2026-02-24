import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import type { TransformationCategory, Transformation } from '@/types';
import { CATEGORIES, getSubcategoriesForGender } from '@/constants/transformations';
import CategoryNav from '@/components/studio/CategoryNav';
import TransformationPicker from '@/components/studio/TransformationPicker';
import EditHistoryCarousel from '@/components/studio/EditHistoryCarousel';
import GenerationProgress from '@/components/studio/GenerationProgress';
import DemoBanner from '@/components/auth/DemoBanner';
import { useMakeoverCostEstimate } from '@/hooks/useMakeoverCostEstimate';
import { useWallet } from '@/hooks/useWallet';
import { formatTokenAmount, getTokenLabel } from '@/services/walletService';
import '@/styles/studio.css';

const categoryKeys = Object.keys(CATEGORIES) as TransformationCategory[];

function MakeoverStudio() {
  const {
    originalImageUrl,
    setCurrentView,
    resetPhoto,
    isGenerating,
    generationProgress,
    setGenerationProgress,
    cancelGeneration,
    generateMakeover,
    currentTransformation,
    authState,
    demoGenerationsRemaining,
    history,
    enhanceProgress,
    isEnhancing,
    cancelEnhancement,
    selectedGender,
    editStack,
  } = useApp();

  const { tokenCost, usdCost, isLoading: costLoading } = useMakeoverCostEstimate();
  const { tokenType } = useWallet();

  const [selectedCategory, setSelectedCategory] = useState<TransformationCategory>(categoryKeys[0]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(() => {
    const subs = getSubcategoriesForGender(categoryKeys[0], selectedGender);
    return subs[0]?.id ?? '';
  });

  const handleCategoryChange = useCallback((category: TransformationCategory) => {
    setSelectedCategory(category);
    const subcategories = getSubcategoriesForGender(category, selectedGender);
    if (subcategories.length > 0) {
      setSelectedSubcategory(subcategories[0].id);
    }
  }, [selectedGender]);

  const handleSelectTransformation = useCallback(
    (transformation: Transformation) => {
      generateMakeover(transformation);
    },
    [generateMakeover]
  );

  const handleBack = useCallback(() => {
    resetPhoto();
  }, [resetPhoto]);

  // Redirect to capture if no image is loaded
  useEffect(() => {
    if (!originalImageUrl) {
      setCurrentView('capture');
    }
  }, [originalImageUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!originalImageUrl) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative flex h-full flex-col overflow-hidden"
    >
      {!authState.isAuthenticated && (
        <DemoBanner generationsRemaining={demoGenerationsRemaining} />
      )}

      <div className="studio-layout min-h-0 flex-1">
        {/* Category sidebar */}
        <CategoryNav
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategoryChange}
          gender={selectedGender}
        />

        {/* Main content */}
        <div className="studio-content">
          {/* Photo area */}
          <div className="studio-photo-area">
            <EditHistoryCarousel />

            {/* Enhancement progress overlay */}
            {enhanceProgress &&
              enhanceProgress.status !== 'completed' && (
              <GenerationProgress
                progress={enhanceProgress}
                onCancel={cancelEnhancement}
                onDismiss={() => {/* enhancement progress clears on its own */}}
                transformationName="Auto-Enhance"
              />
            )}

            {/* Generation progress overlay (also shown for error/cancelled so user sees feedback) */}
            {!isEnhancing && generationProgress &&
              generationProgress.status !== 'completed' && (
              <GenerationProgress
                progress={generationProgress}
                onCancel={cancelGeneration}
                onDismiss={() => setGenerationProgress(null)}
                transformationName={currentTransformation?.name}
              />
            )}
          </div>

          {/* Transformation picker */}
          <div className="flex min-h-0 flex-col overflow-hidden border-t border-primary-400/[0.06]">
            {/* Toolbar */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-primary-400/[0.06] px-3 py-1.5">
              {/* Left: navigation and mode controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-xs text-white/35 transition-colors hover:text-white/60"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  New Photo
                </button>
                {authState.isAuthenticated && history.length > 0 && (
                  <>
                    <span className="text-[10px] text-white/10">|</span>
                    <button
                      onClick={() => setCurrentView('history')}
                      className="flex items-center gap-1 text-xs text-white/35 transition-colors hover:text-white/60"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      History
                    </button>
                  </>
                )}
                {editStack.hasSteps && (
                  <>
                    <span className="text-[10px] text-white/10">|</span>
                    <div className="flex items-center rounded-full border border-primary-400/[0.06] bg-surface-900/40">
                      <button
                        onClick={() => editStack.setMode('original')}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                          editStack.mode === 'original'
                            ? 'bg-primary-400/15 text-primary-300'
                            : 'text-white/35 hover:text-white/60'
                        }`}
                      >
                        Original
                      </button>
                      <button
                        onClick={() => editStack.setMode('stacked')}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                          editStack.mode === 'stacked'
                            ? 'bg-primary-400/15 text-primary-300'
                            : 'text-white/35 hover:text-white/60'
                        }`}
                      >
                        Stacked
                      </button>
                    </div>
                  </>
                )}
                {(() => {
                  const displayTransformation = editStack.currentStep?.transformation ?? currentTransformation;
                  if (!displayTransformation) return null;
                  return (
                    <>
                      <span className="text-[10px] text-white/10">|</span>
                      <span className="text-[11px] text-primary-300/70">
                        {displayTransformation.icon} {displayTransformation.name}
                        {editStack.stepCount > 1 && (
                          <span className="ml-1 text-white/25">
                            ({Math.max(0, editStack.currentIndex + 1)} of {editStack.stepCount})
                          </span>
                        )}
                      </span>
                    </>
                  );
                })()}
              </div>

              {/* Right: cost estimate */}
              {authState.isAuthenticated && (
                <div className="hidden items-center gap-1 sm:flex">
                  {costLoading ? (
                    <span className="text-[10px] text-white/25">...</span>
                  ) : tokenCost !== null ? (
                    <>
                      <span className="text-[10px] text-white/30">~</span>
                      <span className="text-[10px] font-medium text-white/50">
                        {formatTokenAmount(tokenCost)} {getTokenLabel(tokenType)}
                      </span>
                      {usdCost !== null && (
                        <span className="text-[10px] text-white/25">
                          ≈ ${usdCost.toFixed(2)}
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>

            <TransformationPicker
              category={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              onSelectSubcategory={setSelectedSubcategory}
              onSelectTransformation={handleSelectTransformation}
              isDisabled={isGenerating || isEnhancing}
              activeTransformationId={currentTransformation?.id ?? null}
              gender={selectedGender}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default MakeoverStudio;
