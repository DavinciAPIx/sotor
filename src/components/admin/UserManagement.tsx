import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, Search, User, Mail, CreditCard, Shield, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserAvatar from './UserAvatar';
import UserCreditsDisplay from './UserCreditsDisplay';

interface UserData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  credits: number;
  isAdmin: boolean;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching all users with profiles...');
      
      // Use the admin RPC function to get all users
      const { data: usersData, error: usersError } = await supabase.rpc('get_all_users_with_profiles');
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }
      
      if (!usersData) {
        console.log('No users found');
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      // Get credits for all users
      const usersWithCredits = await Promise.all(
        usersData.map(async (user: any) => {
          try {
            const { data: credits } = await supabase.rpc('get_user_credits', {
              user_id_param: user.id
            });
            
            return {
              id: user.id,
              full_name: user.full_name || 'مستخدم بدون اسم',
              avatar_url: user.avatar_url,
              email: user.email || 'غير متوفر',
              credits: credits || 0,
              isAdmin: user.is_admin || false
            };
          } catch (error) {
            console.error(`Error fetching credits for user ${user.id}:`, error);
            return {
              id: user.id,
              full_name: user.full_name || 'مستخدم بدون اسم',
              avatar_url: user.avatar_url,
              email: user.email || 'غير متوفر',
              credits: 0,
              isAdmin: user.is_admin || false
            };
          }
        })
      );
      
      console.log('Users fetched successfully:', usersWithCredits.length);
      setUsers(usersWithCredits);
      setFilteredUsers(usersWithCredits);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات المستخدمين. تأكد من صلاحيات الإدارة.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGiftCredits = (userId: string) => {
    // Set the selected user in the GiftCreditsPanel
    // This would typically be handled through context or state management
    // For now, we'll just navigate to the credits tab
    const event = new CustomEvent('selectUserForCredits', { detail: { userId } });
    document.dispatchEvent(event);
    
    // Find the credits tab and click it
    const creditsTab = document.querySelector('[value="credits"]');
    if (creditsTab) {
      (creditsTab as HTMLElement).click();
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['ID', 'الاسم', 'البريد الإلكتروني', 'الرصيد', 'نوع المستخدم'].join(','),
      ...filteredUsers.map(user => [
        user.id,
        user.full_name,
        user.email,
        user.credits,
        user.isAdmin ? 'مسؤول' : 'مستخدم عادي'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-bahthali-600">
          <User className="h-5 w-5" />
          إدارة المستخدمين
        </CardTitle>
        <CardDescription>
          عرض وإدارة جميع المستخدمين المسجلين في المنصة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Export */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث عن مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-10 text-right"
              />
            </div>
            
            <Button onClick={exportUsers} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              تصدير CSV
            </Button>
          </div>
          
          {/* Users Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin text-bahthali-500" />
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">الرصيد</TableHead>
                    <TableHead className="text-right">الصلاحيات</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">لم يتم العثور على مستخدمين</TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="flex items-center gap-2">
                          <UserAvatar avatarUrl={user.avatar_url} />
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-xs text-gray-500">{user.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{user.email || 'لا يوجد بريد إلكتروني'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <UserCreditsDisplay credits={user.credits} isUnlimited={user.isAdmin} />
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Shield className="h-4 w-4" />
                              <span>مسؤول</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">مستخدم عادي</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleGiftCredits(user.id)}
                            className="text-xs"
                          >
                            <CreditCard className="h-3 w-3 ml-1" />
                            إهداء رصيد
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;