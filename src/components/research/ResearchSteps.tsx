import React from 'react';
import { Loader } from 'lucide-react';
import { useResearchCost } from '@/hooks/useResearchCost';
import { supabase } from '@/integrations/supabase/client';

// Research preparation steps to display during loading with equal duration
export const RESEARCH_STEPS = [{
  title: "إعداد صفحة الغلاف",
  description: "يتم تجهيز غلاف البحث بالمعلومات الأساسية"
}, {
  title: "إعداد خطة البحث",
  description: "يتم وضع خطة متكاملة للبحث وترتيب العناوين"
}, {
  title: "كتابة المحتوى",
  description: "يتم كتابة محتوى البحث بالكامل"
}, {
  title: "تجهيز البحث",
  description: "تجهيز النسخة النهائية للبحث للتحميل"
}];

// Hook to get current research cost
export const useCurrentResearchCost = () => {
  const { researchCost } = useResearchCost();
  return researchCost;
};

// Function to fetch the research cost (for backward compatibility)
export const fetchResearchCost = async () => {
  try {
    console.log('Fetching research cost from database...');
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', 'research_cost')
      .single();
    
    if (error) {
      console.error('Error fetching research cost:', error);
      return 0;
    }
    
    const value = data?.value as { cost?: number } | null;
    const cost = value?.cost ?? 0;
    console.log('Parsed research cost:', cost);
    return cost;
  } catch (error) {
    console.error('Unexpected error fetching research cost:', error);
    return 0;
  }
};

export const STEP_DURATION = 4000; // 4 seconds per step (milliseconds)
export const TOTAL_STEPS = RESEARCH_STEPS.length;
export const PROGRESS_PER_STEP = 100 / TOTAL_STEPS;

interface StepProps {
  step: {
    title: string;
    description: string;
  };
  index: number;
  currentStep: number;
}

export const ResearchStep: React.FC<StepProps> = ({ step, index, currentStep }) => {
  return (
    <div className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-300 ${
      currentStep > index 
        ? 'border-green-300 bg-green-50' 
        : currentStep === index 
          ? 'border-green-300 bg-green-50' 
          : 'border-gray-200 opacity-60'
    }`}>
      {currentStep > index ? (
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.91699 7.00033L5.83366 9.91699L11.667 4.08366" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : currentStep === index ? (
        <div className="w-6 h-6 rounded-full bg-green-500/40 flex items-center justify-center">
          <Loader className="w-3.5 h-3.5 text-green-600 animate-spin" />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
          {index + 1}
        </div>
      )}
      
      <div>
        <h4 className="font-bold text-sm">{step.title}</h4>
        <p className="text-gray-500 text-xs">{step.description}</p>
      </div>
    </div>
  );
};