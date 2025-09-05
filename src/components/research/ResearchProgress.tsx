
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ResearchStep, RESEARCH_STEPS } from './ResearchSteps';

interface ResearchProgressProps {
  showProgress: boolean;
  setShowProgress: (show: boolean) => void;
  currentStep: number;
}

const ResearchProgress: React.FC<ResearchProgressProps> = ({ 
  showProgress, 
  setShowProgress, 
  currentStep 
}) => {
  return (
    <Dialog open={showProgress} onOpenChange={setShowProgress}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-bahthali-700">
            جاري إنشاء البحث
          </DialogTitle>
          <DialogDescription className="text-center">
            يتم الآن إعداد بحثك بشكل احترافي
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {RESEARCH_STEPS.map((step, index) => (
            <ResearchStep 
              key={index}
              step={step}
              index={index}
              currentStep={currentStep}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResearchProgress;
