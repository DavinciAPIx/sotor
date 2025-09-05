import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserWithCredits {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string;
  credits: number;
  isUnlimited?: boolean;
}

export const useUserListData = () => {
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching users for admin gift credits...');
        
        // Use the admin RPC function to get all users
        const { data: usersData, error: usersError } = await supabase.rpc('get_all_users_with_profiles');
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
          throw usersError;
        }

        if (!usersData) {
          console.log('No users found');
          setUsers([]);
          return;
        }

        // Get credits for each user using the safe RPC function
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
                isUnlimited: user.is_admin || false
              };
            } catch (error) {
              console.error(`Error fetching credits for user ${user.id}:`, error);
              return {
                id: user.id,
                full_name: user.full_name || 'مستخدم بدون اسم',
                avatar_url: user.avatar_url,
                email: user.email || 'غير متوفر',
                credits: 0,
                isUnlimited: user.is_admin || false
              };
            }
          })
        );

        console.log('Successfully processed users:', usersWithCredits.length);
        setUsers(usersWithCredits);

      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء جلب بيانات المستخدمين. تأكد من صلاحيات الإدارة.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  return { users, isLoading };
};
