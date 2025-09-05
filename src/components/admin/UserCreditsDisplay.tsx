
import React from 'react';
import { CreditCard, Infinity } from 'lucide-react';

interface UserCreditsDisplayProps {
  credits: number;
  isUnlimited?: boolean;
}

const UserCreditsDisplay: React.FC<UserCreditsDisplayProps> = ({ credits, isUnlimited }) => {
  return (
    <div className="flex items-center gap-1">
      {isUnlimited ? (
        <>
          <Infinity className="w-4 h-4 text-bahthali-500" />
          <span>غير محدود</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 text-bahthali-500" />
          <span>{credits}</span>
        </>
      )}
    </div>
  );
};

export default UserCreditsDisplay;
