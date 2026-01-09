import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  quizQuestions,
  spiritSymbols,
  TOTAL_QUESTIONS,
} from '../data/spiritSymbolQuiz';
import type { QuizOption, SpiritSymbol } from '../data/spiritSymbolQuiz';

// ============================================================================
// Type Definitions
// ============================================================================

/** Accumulated scores from selected answers */
interface ScoreTotals {
  order: number;    // positive = lawful, negative = chaotic
  morality: number; // positive = good, negative = evil
}

/** Bucket classification for each axis */
type OrderBucket = 'lawful' | 'neutral' | 'chaotic';
type MoralityBucket = 'good' | 'neutral' | 'evil';

/** Bucketized scores */
interface BucketizedScores {
  order: OrderBucket;
  morality: MoralityBucket;
}

/** Result with primary symbol and optional runner-up */
interface QuizResult {
  primary: SpiritSymbol;
  runnerUp: SpiritSymbol | null;
  totals: ScoreTotals;
  buckets: BucketizedScores;
}

/** Quiz state shape */
interface QuizState {
  currentQuestionIndex: number;
  answers: Map<string, QuizOption>; // questionId -> selected option
  isComplete: boolean;
}

// ============================================================================
// Pure Scoring Functions
// ============================================================================

/**
 * Computes the total scores from all selected answers.
 * @param answers - Map of questionId to selected QuizOption
 * @returns Accumulated order and morality scores
 */
function computeTotals(answers: Map<string, QuizOption>): ScoreTotals {
  let order = 0;
  let morality = 0;

  for (const option of answers.values()) {
    order += option.score.order;
    morality += option.score.morality;
  }

  return { order, morality };
}

/**
 * Normalizes a score to an average per question.
 * This allows consistent thresholding regardless of quiz length.
 * 
 * @param score - Raw score total
 * @param numQuestions - Number of questions answered
 * @returns Normalized score (average per question)
 */
function normalizeScore(score: number, numQuestions: number): number {
  if (numQuestions === 0) return 0;
  return score / numQuestions;
}

/**
 * Converts a normalized score into a bucket (positive/neutral/negative).
 * Uses ±0.35 as the threshold for the neutral zone.
 * 
 * With scores mostly in -2 to +2 range:
 * - Average of 0.35+ per question = positive tendency
 * - Average of -0.35 to +0.35 = neutral
 * - Average of -0.35 or less = negative tendency
 * 
 * @param normalizedScore - Score normalized to average per question
 * @returns Bucket classification
 */
function bucketizeNormalizedScore(
  normalizedScore: number
): 'positive' | 'neutral' | 'negative' {
  const threshold = 0.35;

  if (normalizedScore > threshold) return 'positive';
  if (normalizedScore < -threshold) return 'negative';
  return 'neutral';
}

/**
 * Bucketizes both order and morality scores using normalized values.
 * @param totals - Raw score totals
 * @param numQuestions - Number of questions answered
 * @returns Bucketized scores with named buckets
 */
function bucketize(totals: ScoreTotals, numQuestions: number): BucketizedScores {
  const normalizedOrder = normalizeScore(totals.order, numQuestions);
  const normalizedMorality = normalizeScore(totals.morality, numQuestions);
  
  const orderRaw = bucketizeNormalizedScore(normalizedOrder);
  const moralityRaw = bucketizeNormalizedScore(normalizedMorality);

  // Convert generic bucket names to axis-specific names
  const orderBucket: OrderBucket =
    orderRaw === 'positive' ? 'lawful' :
    orderRaw === 'negative' ? 'chaotic' : 'neutral';

  const moralityBucket: MoralityBucket =
    moralityRaw === 'positive' ? 'good' :
    moralityRaw === 'negative' ? 'evil' : 'neutral';

  return { order: orderBucket, morality: moralityBucket };
}

/**
 * Finds the spirit symbol matching the given buckets.
 * @param buckets - Bucketized scores
 * @returns The matching SpiritSymbol
 */
function symbolFromBuckets(buckets: BucketizedScores): SpiritSymbol {
  const symbol = spiritSymbols.find(
    s => s.orderBucket === buckets.order && s.moralityBucket === buckets.morality
  );

  // Fallback to Stone (neutral/neutral) if somehow no match
  return symbol || spiritSymbols.find(s => s.id === 'stone')!;
}

/**
 * Ranks all symbols by how close the normalized scores are to each symbol's ideal position.
 * Used for determining runner-up when scores are close to bucket boundaries.
 * 
 * @param totals - Raw score totals
 * @param numQuestions - Number of questions answered
 * @returns Array of symbols sorted by distance (closest first)
 */
function rankSymbols(
  totals: ScoreTotals,
  numQuestions: number
): { symbol: SpiritSymbol; distance: number }[] {
  // Normalize scores to per-question average
  const normalizedOrder = normalizeScore(totals.order, numQuestions);
  const normalizedMorality = normalizeScore(totals.morality, numQuestions);

  // Map buckets to ideal normalized score positions
  // Using 0.7 as "solidly in" a category (about 2x the threshold)
  const bucketToIdealScore = (bucket: 'lawful' | 'neutral' | 'chaotic' | 'good' | 'evil'): number => {
    switch (bucket) {
      case 'lawful':
      case 'good':
        return 0.7; // Solidly in positive territory
      case 'chaotic':
      case 'evil':
        return -0.7; // Solidly in negative territory
      default:
        return 0; // Neutral
    }
  };

  return spiritSymbols
    .map(symbol => {
      const idealOrder = bucketToIdealScore(symbol.orderBucket);
      const idealMorality = bucketToIdealScore(symbol.moralityBucket);

      // Euclidean distance from ideal position using normalized scores
      const distance = Math.sqrt(
        Math.pow(normalizedOrder - idealOrder, 2) +
        Math.pow(normalizedMorality - idealMorality, 2)
      );

      return { symbol, distance };
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Determines the quiz result including primary symbol and potential runner-up.
 * @param answers - All selected answers
 * @returns Complete quiz result
 */
function calculateResult(answers: Map<string, QuizOption>): QuizResult {
  const totals = computeTotals(answers);
  const buckets = bucketize(totals, answers.size);
  const primary = symbolFromBuckets(buckets);
  const ranked = rankSymbols(totals, answers.size);

  // Runner-up if second place is within 20% distance of first place
  const runnerUpMargin = 0.2;
  let runnerUp: SpiritSymbol | null = null;

  if (ranked.length >= 2) {
    const firstDistance = ranked[0].distance;
    const secondDistance = ranked[1].distance;

    // Only show runner-up if it's meaningfully close
    if (firstDistance > 0 && (secondDistance - firstDistance) / firstDistance <= runnerUpMargin) {
      // Make sure runner-up is different from primary
      if (ranked[1].symbol.id !== primary.id) {
        runnerUp = ranked[1].symbol;
      } else if (ranked.length >= 3 && (ranked[2].distance - firstDistance) / firstDistance <= runnerUpMargin) {
        runnerUp = ranked[2].symbol;
      }
    }
  }

  return { primary, runnerUp, totals, buckets };
}

// ============================================================================
// React Component
// ============================================================================

export default function SpiritSymbolQuiz() {
  // Quiz state
  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: new Map(),
    isComplete: false,
  });

  // Current question
  const currentQuestion = quizQuestions[state.currentQuestionIndex];

  // Selected answer for current question
  const selectedOption = state.answers.get(currentQuestion?.id);

  // Calculate result when quiz is complete
  const result = useMemo(() => {
    if (!state.isComplete) return null;
    return calculateResult(state.answers);
  }, [state.isComplete, state.answers]);

  // Handle option selection
  const handleSelectOption = useCallback((option: QuizOption) => {
    setState(prev => {
      const newAnswers = new Map(prev.answers);
      newAnswers.set(currentQuestion.id, option);
      return { ...prev, answers: newAnswers };
    });
  }, [currentQuestion?.id]);

  // Handle next question
  const handleNext = useCallback(() => {
    if (!selectedOption) return;

    setState(prev => {
      if (prev.currentQuestionIndex >= TOTAL_QUESTIONS - 1) {
        // Quiz complete
        return { ...prev, isComplete: true };
      }
      return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 };
    });
  }, [selectedOption]);

  // Handle back
  const handleBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
    }));
  }, []);

  // Handle retake
  const handleRetake = useCallback(() => {
    setState({
      currentQuestionIndex: 0,
      answers: new Map(),
      isComplete: false,
    });
  }, []);

  // ============================================================================
  // Render: Results Screen
  // ============================================================================
  if (state.isComplete && result) {
    return (
      <div className="min-h-screen bg-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Spirit Symbol</h1>
            <p className="text-gray-600">Based on your answers, your spirit symbol is...</p>
          </div>

          {/* Primary Result */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="text-center">
              <img
                src={result.primary.imageUrl}
                alt={result.primary.name}
                className="w-24 h-24 mx-auto mb-4 object-contain"
              />
              <h2 className="text-4xl font-bold text-gray-800 mb-4">{result.primary.name}</h2>
              <p className="text-gray-700 text-lg leading-relaxed">{result.primary.description}</p>
            </div>
          </div>

          {/* Runner-up (if applicable) */}
          {result.runnerUp && (
            <div className="bg-white/70 rounded-lg shadow p-6 mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={result.runnerUp.imageUrl}
                  alt={result.runnerUp.name}
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Runner-up</p>
                  <h3 className="text-xl font-semibold text-gray-700">{result.runnerUp.name}</h3>
                  <p className="text-gray-600 text-sm">{result.runnerUp.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Score Breakdown */}
          <div className="bg-white/50 text-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
            
            {/* Order Axis */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Chaotic</span>
                <span className="font-medium">Order: {(result.totals.order / 17).toFixed(2)} avg</span>
                <span>Lawful</span>
              </div>
              <div className="h-4 bg-gray-300 rounded-full relative overflow-hidden">
                {/* Threshold markers at ±0.35 normalized */}
                <div className="absolute top-0 left-[32.5%] w-px h-full bg-gray-400" />
                <div className="absolute top-0 left-[67.5%] w-px h-full bg-gray-400" />
                <div
                  className="absolute top-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                  style={{
                    left: '50%',
                    width: `${Math.min(50, Math.abs(result.totals.order / 17) * 50)}%`,
                    transform: result.totals.order < 0 ? 'translateX(-100%)' : 'translateX(0)',
                  }}
                />
                <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-500/50" />
              </div>
              <div className="text-center text-sm mt-1">
                <span className="px-2 py-0.5 bg-gray-200 rounded text-xs uppercase">
                  {result.buckets.order}
                </span>
                <span className="text-xs text-gray-400 ml-2">(threshold: ±0.35)</span>
              </div>
            </div>

            {/* Morality Axis */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Evil</span>
                <span className="font-medium">Morality: {(result.totals.morality / 17).toFixed(2)} avg</span>
                <span>Good</span>
              </div>
              <div className="h-4 bg-gray-300 rounded-full relative overflow-hidden">
                {/* Threshold markers at ±0.35 normalized */}
                <div className="absolute top-0 left-[32.5%] w-px h-full bg-gray-400" />
                <div className="absolute top-0 left-[67.5%] w-px h-full bg-gray-400" />
                <div
                  className="absolute top-0 h-full bg-gradient-to-r from-red-500 to-green-500 transition-all"
                  style={{
                    left: '50%',
                    width: `${Math.min(50, Math.abs(result.totals.morality / 17) * 50)}%`,
                    transform: result.totals.morality < 0 ? 'translateX(-100%)' : 'translateX(0)',
                  }}
                />
                <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-500/50" />
              </div>
              <div className="text-center text-sm mt-1">
                <span className="px-2 py-0.5 bg-gray-200 rounded text-xs uppercase">
                  {result.buckets.morality}
                </span>
                <span className="text-xs text-gray-400 ml-2">(threshold: ±0.35)</span>
              </div>
            </div>

            {/* Bucket Grid Reference */}
            <div className="mt-6 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-500 mb-2 text-center">Symbol Grid (Order × Morality)</p>
              <div className="grid grid-cols-4 gap-1 text-xs text-center">
                <div></div>
                <div className="text-green-600">Good</div>
                <div className="text-gray-500">Neutral</div>
                <div className="text-red-600">Evil</div>
                
                <div className="text-blue-600">Lawful</div>
                <div className={`p-1 rounded ${result.primary.id === 'hoof' ? 'bg-yellow-400/50 font-bold' : 'bg-gray-200'}`}>Hoof</div>
                <div className={`p-1 rounded ${result.primary.id === 'eye' ? 'bg-yellow-400/50 font-bold' : 'bg-gray-200'}`}>Eye</div>
                <div className={`p-1 rounded ${result.primary.id === 'antler' ? 'bg-yellow-400/50 font-bold' : 'bg-gray-200'}`}>Antler</div>
                
                <div className="text-gray-500">Neutral</div>
                <div className={`p-1 rounded ${result.primary.id === 'leaf' ? 'bg-yellow-400/50 font-bold' : 'bg-gray-200'}`}>Leaf</div>
                <div className={`p-1 rounded ${result.primary.id === 'stone' ? 'bg-yellow-400/50 font-bold' : 'bg-gray-200'}`}>Stone</div>
                <div className={`p-1 rounded ${result.primary.id === 'bone' ? 'bg-yellow-400/50 font-bold' : 'bg-gray-200'}`}>Bone</div>
                
                <div className="text-purple-600">Chaotic</div>
                <div className={`p-1 rounded ${result.primary.id === 'feather' ? 'bg-yellow-400/50 font-bold' : 'bg-gray-200'}`}>Feather</div>
                <div className={`p-1 rounded ${result.primary.id === 'print' ? 'bg-yellow-400/50 font-bold' : 'bg-gray-200'}`}>Print</div>
                <div className={`p-1 rounded ${result.primary.id === 'fang' ? 'bg-yellow-400/50 font-bold' : 'bg-gray-200'}`}>Fang</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRetake}
              className="px-6 py-3 bg-[#2f3a2f] text-white rounded-lg hover:bg-[#3d4a3d] transition-colors"
            >
              Retake Quiz
            </button>
            <Link
              to="/wiki/spirit-symbols"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Learn About All Symbols
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Question Screen
  // ============================================================================
  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Spirit Symbol Quiz</h1>
          <p className="text-gray-600">In Horizon, each wolf has a Spirit Symbol associated with his/her personality.</p>
          <p className="text-gray-600">Answer the following questions from your wolf's perspective...</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {state.currentQuestionIndex + 1} of {TOTAL_QUESTIONS}</span>
            <span>{Math.round(((state.currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2f3a2f] transition-all duration-300"
              style={{ width: `${((state.currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {currentQuestion.prompt}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedOption?.id === option.id
                    ? 'border-[#2f3a2f] bg-[#2f3a2f]/10'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-gray-700">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={state.currentQuestionIndex === 0}
            className={`px-6 py-3 rounded-lg transition-colors ${
              state.currentQuestionIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!selectedOption}
            className={`px-6 py-3 rounded-lg transition-colors ${
              !selectedOption
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#2f3a2f] text-white hover:bg-[#3d4a3d]'
            }`}
          >
            {state.currentQuestionIndex >= TOTAL_QUESTIONS - 1 ? 'See Results' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
