import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import type { TransformationCategory, Transformation } from '@/types';
import { CATEGORIES, SUBCATEGORIES } from '@/constants/transformations';
import CategoryNav from '@/components/studio/CategoryNav';
import TransformationPicker from '@/components/studio/TransformationPicker';
import OriginalPhoto from '@/components/studio/OriginalPhoto';
import ResultDisplay from '@/components/studio/ResultDisplay';
import GenerationProgress from '@/components/studio/GenerationProgress';
import DemoBanner from '@/components/auth/DemoBanner';
import '@/styles/studio.css';

const categoryKeys = Object.keys(CATEGORIES) as TransformationCategory[];

function MakeoverStudio() {
  const {
    originalImageUrl,
    currentResult,
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
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<TransformationCategory>(categoryKeys[0]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    SUBCATEGORIES[categoryKeys[0]][0].id
  );

  const handleCategoryChange = useCallback((category: TransformationCategory) => {
    setSelectedCategory(category);
    const subcategories = SUBCATEGORIES[category];
    if (subcategories && subcategories.length > 0) {
      setSelectedSubcategory(subcategories[0].id);
    }
  }, []);

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

  const resultUrl = currentResult?.imageUrl ?? null;

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
        />

        {/* Main content */}
        <div className="studio-content">
          {/* Photo area */}
          <div className="studio-photo-area">
            {resultUrl && !isGenerating ? (
              <ResultDisplay resultUrl={resultUrl} />
            ) : (
              <OriginalPhoto imageUrl={originalImageUrl} />
            )}

            {/* Generation progress overlay (also shown for error/cancelled so user sees feedback) */}
            {generationProgress &&
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
            <div className="flex flex-shrink-0 items-center gap-2 border-b border-primary-400/[0.06] px-3 py-1.5">
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
              {currentTransformation && (
                <>
                  <span className="text-[10px] text-white/10">|</span>
                  <span className="text-[11px] text-primary-300/70">
                    {currentTransformation.icon} {currentTransformation.name}
                  </span>
                </>
              )}
            </div>

            <TransformationPicker
              category={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              onSelectSubcategory={setSelectedSubcategory}
              onSelectTransformation={handleSelectTransformation}
              isDisabled={isGenerating}
              activeTransformationId={currentTransformation?.id ?? null}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default MakeoverStudio;
