
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { UserWithCredits } from '@/hooks/useUserListData';

interface GiftCreditsButtonProps {
  onGiftCredits: () => Promise<void>;
  isGiftingCredits: boolean;
  selectedUser: UserWithCredits | null;
  creditAmount: number;
}

const GiftCreditsButton = ({ 
  onGiftCredits, 
  isGiftingCredits, 
  selectedUser, 
  creditAmount 
}: GiftCreditsButtonProps) => {
  return (
    <Button 
      onClick={onGiftCredits}
      disabled={isGiftingCredits || !selectedUser || creditAmount <= 0}
      className="w-full bg-bahthali-500 hover:bg-bahthali-600"
    >
      {isGiftingCredits ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          جاري الإهداء...
        </>
      ) : (
        "إهداء الرصيد"
      )}
    </Button>
  );
};

export default GiftCreditsButton;
