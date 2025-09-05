import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { Label } from '@/components/ui/label';
import UsersList from './UsersList';
import SelectedUserDisplay from './SelectedUserDisplay';
import GiftCreditsButton from './GiftCreditsButton';
import { useGiftCredits } from '@/hooks/useGiftCredits';

const GiftCreditsPanel = () => {
  const {
    selectedUser,
    creditAmount,
    isGiftingCredits,
    handleSelectUser,
    setCreditAmount,
    handleGiftCredits
  } = useGiftCredits();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-bahthali-600">
          <CreditCard className="h-5 w-5" />
          إهداء رصيد للمستخدمين
        </CardTitle>
        <CardDescription>
          إضافة رصيد لحساب مستخدم معين
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List of users with their credits */}
        <div>
          <Label className="mb-2 block">المستخدمين المسجلين</Label>
          <UsersList onSelectUser={handleSelectUser} />
        </div>
        
        {selectedUser && (
          <SelectedUserDisplay 
            selectedUser={selectedUser}
            creditAmount={creditAmount}
            setCreditAmount={setCreditAmount}
          />
        )}
      </CardContent>
      <CardFooter>
        <GiftCreditsButton 
          onGiftCredits={handleGiftCredits}
          isGiftingCredits={isGiftingCredits}
          selectedUser={selectedUser}
          creditAmount={creditAmount}
        />
      </CardFooter>
    </Card>
  );
};

export default GiftCreditsPanel;