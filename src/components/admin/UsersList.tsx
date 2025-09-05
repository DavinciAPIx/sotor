import React from 'react';
import { Loader } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { useUserListData, UserWithCredits } from '@/hooks/useUserListData';
import UserListItem from './UserListItem';

interface UsersListProps {
  onSelectUser: (user: UserWithCredits) => void;
}

const UsersList = ({ onSelectUser }: UsersListProps) => {
  const { users, isLoading } = useUserListData();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="h-8 w-8 animate-spin text-bahthali-500" />
        <span className="mr-2 text-bahthali-600">جاري تحميل المستخدمين...</span>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">المستخدم</TableHead>
            <TableHead className="text-right">الرصيد</TableHead>
            <TableHead className="text-right">إجراء</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4">لم يتم العثور على مستخدمين</TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <UserListItem 
                key={user.id} 
                user={user} 
                onSelect={onSelectUser} 
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersList;
