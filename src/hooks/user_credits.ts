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
        console.log('Fetching users with corrected queries...');
        
        // 1. Get all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;
        if (!profiles?.length) {
          console.log('No profiles found');
          setUsers([]);
          return;
        }

        // 2. Get all credits - USING user_id INSTEAD OF id
        const { data: credits, error: creditsError } = await supabase
          .from('user_credits')
          .select('user_id, balance'); // Key fix: using user_id

        if (creditsError) {
          console.error('Credits fetch error:', creditsError);
          throw creditsError;
        }

        // 3. Combine data - match profile.id with credit.user_id
        const usersWithCredits = profiles.map(profile => {
          const credit = credits?.find(c => c.user_id === profile.id);
          return {
            id: profile.id,
            full_name: profile.full_name || 'مستخدم بدون اسم',
            avatar_url: profile.avatar_url,
            credits: credit?.balance || 0,
            isUnlimited: false // Default value, update if you have admin logic
          };
        });

        console.log('Successfully fetched users:', usersWithCredits.length);
        setUsers(usersWithCredits);

      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء جلب بيانات المستخدمين",
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