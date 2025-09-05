import React from 'react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import UserAvatar from './UserAvatar';
import UserCreditsDisplay from './UserCreditsDisplay';
import { UserWithCredits } from '@/hooks/useUserListData';

interface UserListItemProps {
  user: UserWithCredits;
  onSelect: (user: UserWithCredits) => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, onSelect }) => {
  return (
    <TableRow key={user.id}>
      <TableCell className="flex items-center gap-2">
        <UserAvatar avatarUrl={user.avatar_url} />
        <div>
          <p className="font-medium">{user.full_name}</p>
          <p className="text-xs text-gray-500">{user.email || user.id}</p>
        </div>
      </TableCell>
      <TableCell>
        <UserCreditsDisplay credits={user.credits} isUnlimited={user.isUnlimited} />
      </TableCell>
      <TableCell>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onSelect(user)}
          className="text-xs bg-bahthali-50 hover:bg-bahthali-100 border-bahthali-200 text-bahthali-700"
        >
          إهداء رصيد
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default UserListItem;
