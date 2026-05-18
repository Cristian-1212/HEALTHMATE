'use client';

import React, { useState } from 'react';
import { Brain, Sparkles, Loader2, CheckCircle2, AlertCircle, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useMeals } from '@/context/MealContext';

interface ParsedMeal {
  food_name: string;
  estimated_calories: number;
  estimated_grams: number;
  meal_type: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
}

const exampleInputs = [
  '2 fried eggs and a bowl of oatmeal with honey',
  'grilled salmon fillet with steamed broccoli',
  'large cappuccino and a blueberry muffin',
  '100g almonds and an apple',
];

const mealTypeColors: Record<string, string> = {
  Breakfast: 'bg-warning-light text-warning',
  Lunch: 'bg-success-light text-success',
  Dinner: 'bg-cyan-light text-cyan',
  Snack: 'bg-muted text-muted-foreground',
};

// Mock AI parse function
function mockAIParse(input: string): ParsedMeal {
  const lower = input.toLowerCase();
  if (lower.includes('egg') || lower.includes('oatmeal')) {
    return { food_name: 'Fried Eggs with Oatmeal & Honey', estimated_calories: 418, estimated_grams: 285, meal_type: 'Breakfast', protein_g: 18, carbs_g: 52, fat_g: 14, confidence: 0.93 };
  }
  if (lower.includes('salmon') || lower.includes('broccoli')) {
    return { food_name: 'Grilled Salmon with Steamed Broccoli', estimated_calories: 365, estimated_grams: 320, meal_type: 'Dinner', protein_g: 42, carbs_g: 12, fat_g: 16, confidence: 0.96 };
  }
  if (lower.includes('cappuccino') || lower.includes('muffin')) {
    return { food_name: 'Large Cappuccino & Blueberry Muffin', estimated_calories: 385, estimated_grams: 210, meal_type: 'Snack', protein_g: 8, carbs_g: 58, fat_g: 12, confidence: 0.88 };
  }
  if (lower.includes('almond') || lower.includes('apple')) {
    return { food_name: 'Almonds & Apple', estimated_calories: 258, estimated_grams: 180, meal_type: 'Snack', protein_g: 6, carbs_g: 28, fat_g: 14, confidence: 0.97 };
  }
  return {
    food_name: input.slice(0, 50),
    estimated_calories: Math.floor(200 + (input.length * 3)),
    estimated_grams: Math.floor(150 + (input.length * 2)),
    meal_type: 'Lunch',
    protein_g: 18,
    carbs_g: 35,
    fat_g: 10,
    confidence: 0.82,
  };
}

interface AIMealInputPanelProps {
  onMealAdded?: (meal: ParsedMeal) => void;
}

export default function AIMealInputPanel({ onMealAdded }: AIMealInputPanelProps) {
  const { addMeal } = useMeals();
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedMeal, setParsedMeal] = useState<ParsedMeal | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    setParseError(null);
    setParsedMeal(null);
    // BACKEND INTEGRATION: POST /api/ai/parse-meal { text: inputText, userId } → returns ParsedMeal JSON
    await new Promise((r) => setTimeout(r, 1600));
    try {
      const result = mockAIParse(inputText);
      setParsedMeal(result);
    } catch {
      setParseError('AI parsing failed. Please try rephrasing your input.');
    }
    setIsParsing(false);
  };

  const handleAddToLog = async () => {
    if (!parsedMeal) return;
    setIsAdding(true);
    
    await new Promise((r) => setTimeout(r, 800));
    
    addMeal({
      name: parsedMeal.food_name,
      mealType: parsedMeal.meal_type as any,
      calories: parsedMeal.estimated_calories,
      grams: parsedMeal.estimated_grams,
      protein: parsedMeal.protein_g,
      carbs: parsedMeal.carbs_g,
      fat: parsedMeal.fat_g,
      aiConfidence: parsedMeal.confidence,
      source: 'ai' as const,
    });

    toast.success(`${parsedMeal.food_name} added to today's log (+${parsedMeal.estimated_calories} kcal)`);
    onMealAdded?.(parsedMeal);
    setParsedMeal(null);
    setInputText('');
    setIsAdding(false);
  };

  const handleReset = () => {
    setParsedMeal(null);
    setParseError(null);
    setInputText('');
  };

  return (
    <div className="card-base p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">AI Meal Logger</h2>
          <p className="text-xs text-muted-foreground">Describe what you ate in plain language — AI handles the rest</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full font-semibold">
          <Sparkles className="w-3 h-3" />
          AI-Powered
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input area */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="meal-input">
              What did you eat?
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Be specific about portions and preparation methods for best accuracy
            </p>
            <textarea
              id="meal-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. 2 scrambled eggs with whole wheat toast and a glass of orange juice..."
              className="input-field resize-none h-28 leading-relaxed"
              disabled={isParsing}
            />
          </div>

          {/* Example chips */}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {exampleInputs.map((ex, i) => (
                <button
                  key={`example-chip-${i}`}
                  type="button"
                  onClick={() => setInputText(ex)}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:bg-primary-light hover:text-primary transition-colors font-medium"
                >
                  {ex.length > 30 ? ex.slice(0, 28) + '…' : ex}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleParse}
              disabled={!inputText.trim() || isParsing}
              className="btn-primary flex items-center gap-2 flex-1"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Parse with AI
                </>
              )}
            </button>
            {(parsedMeal || parseError) && (
              <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Parse result */}
        <div className="flex flex-col">
          {isParsing && (
            <div className="flex-1 rounded-xl border border-dashed border-primary/30 bg-primary-light/30 flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <p className="text-sm font-medium text-primary">Analyzing your meal...</p>
              <p className="text-xs text-muted-foreground">Estimating calories, macros & portion sizes</p>
            </div>
          )}

          {parseError && !isParsing && (
            <div className="flex-1 rounded-xl border border-danger/30 bg-danger-light/30 flex flex-col items-center justify-center py-8 gap-2">
              <AlertCircle className="w-8 h-8 text-danger" />
              <p className="text-sm font-semibold text-danger">Parse Failed</p>
              <p className="text-xs text-muted-foreground text-center max-w-xs">{parseError}</p>
            </div>
          )}

          {!isParsing && !parseError && !parsedMeal && (
            <div className="flex-1 rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center py-8 gap-2 text-center px-4">
              <Sparkles className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">AI parse result will appear here</p>
              <p className="text-xs text-muted-foreground">Describe your meal and click "Parse with AI"</p>
            </div>
          )}

          {parsedMeal && !isParsing && (
            <div className="flex-1 rounded-xl border border-success/30 bg-success-light/20 p-4 flex flex-col gap-4 slide-up">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <p className="text-sm font-bold text-foreground truncate">{parsedMeal.food_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${mealTypeColors[parsedMeal.meal_type] ?? 'bg-muted text-muted-foreground'}`}>
                      {parsedMeal.meal_type}
                    </span>
                    <span className="text-xs text-muted-foreground">~{parsedMeal.estimated_grams}g serving</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-foreground font-tabular">{parsedMeal.estimated_calories}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
              </div>

              {/* Macros grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Protein', value: parsedMeal.protein_g, color: 'text-secondary' },
                  { label: 'Carbs', value: parsedMeal.carbs_g, color: 'text-primary' },
                  { label: 'Fat', value: parsedMeal.fat_g, color: 'text-warning' },
                ].map((m) => (
                  <div key={`parsed-macro-${m.label}`} className="bg-card rounded-lg px-2.5 py-2 text-center border border-border">
                    <p className={`text-base font-bold font-tabular ${m.color}`}>{m.value}g</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Confidence */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">AI Confidence</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${parsedMeal.confidence * 100}%` }}
                    />
                  </div>
                  <span className={`font-bold font-tabular ${parsedMeal.confidence >= 0.9 ? 'text-success' : 'text-warning'}`}>
                    {Math.round(parsedMeal.confidence * 100)}%
                  </span>
                </div>
              </div>

              {parsedMeal.confidence < 0.85 && (
                <div className="flex items-start gap-2 bg-warning-light/50 border border-warning/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                  <p className="text-xs text-warning font-medium">
                    Low confidence — consider adding portion sizes or cooking method for better accuracy.
                  </p>
                </div>
              )}

              {/* Add button */}
              <button
                onClick={handleAddToLog}
                disabled={isAdding}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding to log...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add {parsedMeal.estimated_calories} kcal to Today&apos;s Log
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}