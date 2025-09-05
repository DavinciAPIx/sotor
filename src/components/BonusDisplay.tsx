
import React from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface BonusDisplayProps {
  bonusCount: number;
  color: string;
  savingsAmount: number;
}

const BonusDisplay: React.FC<BonusDisplayProps> = ({ bonusCount, color, savingsAmount }) => {
  const getBonusColors = () => {
    switch (color) {
      case 'copper':
        return {
          gradient: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          icon: 'text-blue-600'
        };
      case 'dark-gold':
        return {
          gradient: 'from-yellow-500 to-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: 'text-yellow-600'
        };
      case 'dark-silver':
      default:
        return {
          gradient: 'from-dark-silver-500 to-dark-silver-600',
          bg: 'bg-dark-silver-50',
          border: 'border-dark-silver-200',
          text: 'text-dark-silver-700',
          icon: 'text-dark-silver-600'
        };
    }
  };

  const colors = getBonusColors();

  return (
    <div className="space-y-3">
      {/* Savings Display */}
      <div className={cn(
        "p-3 rounded-lg border-2 border-dashed transition-all duration-300",
        colors.bg,
        colors.border
      )}>
        <div className="flex items-center justify-center gap-2">
          <div className={cn(
            "p-1.5 rounded-full bg-gradient-to-r shadow-sm",
            colors.gradient
          )}>
            <Gift className="h-3 w-3 text-white" />
          </div>
          <span className={cn("text-sm font-bold", colors.text)}>
           +{savingsAmount} ريال رصيد مجاني
          </span>
        </div>
      </div>
    </div>
  );
};

export default BonusDisplay;
