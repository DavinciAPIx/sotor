import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { UserWithCredits } from '@/hooks/useUserListData';

interface SelectedUserDisplayProps {
  selectedUser: UserWithCredits;
  creditAmount: number;
  setCreditAmount: (amount: number) => void;
}

const SelectedUserDisplay = ({ selectedUser, creditAmount, setCreditAmount }: SelectedUserDisplayProps) => {
  return (
    <div className="border rounded-md p-4 bg-bahthali-50 mt-4">
      <p className="text-sm font-medium mb-2">المستخدم المحدد:</p>
      <div className="flex items-center gap-2 mb-4">
        {selectedUser.avatar_url ? (
          <img 
            src={selectedUser.avatar_url} 
            alt="Avatar" 
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
        )}
        <div>
          <p className="font-medium">{selectedUser.full_name || 'مستخدم بدون اسم'}</p>
          <p className="text-xs text-gray-500">الرصيد الحالي: {selectedUser.credits} ريال</p>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="creditAmount">مبلغ الرصيد المراد إهداؤه (ريال)</Label>
        <Input 
          id="creditAmount"
          type="number"
          min="100"
          step="100"
          value={creditAmount}
          onChange={(e) => setCreditAmount(parseInt(e.target.value) || 100)}
          placeholder="مبلغ الرصيد"
          className="text-right"
          dir="rtl"
        />
        <p className="text-xs text-gray-500">
          الحد الأدنى: 100 ريال (يجب أن يكون من مضاعفات 100)
        </p>
      </div>
    </div>
  );
};

export default SelectedUserDisplay;
