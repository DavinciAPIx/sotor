import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserWithCredits } from '@/hooks/useUserListData';

export const useGiftCredits = () => {
  const [selectedUser, setSelectedUser] = useState<UserWithCredits | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(100);
  const [isGiftingCredits, setIsGiftingCredits] = useState(false);
  const { toast } = useToast();

  // Fetch user data with credits
  useEffect(() => {
    const handleSelectUser = async (event: CustomEvent) => {
      const userId = event.detail?.userId;
      if (userId) {
        try {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', userId)
            .single();

          if (profileError) throw profileError;

          // Get user credits
          const { data: credits, error: creditsError } = await supabase
            .from('user_credits')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          setSelectedUser({
            id: profile.id,
            full_name: profile.full_name || 'مستخدم بدون اسم',
            avatar_url: profile.avatar_url,
            credits: Number(credits?.balance) || 0,
          });
        } catch (error) {
          console.error('Error fetching user:', error);
          toast({
            title: 'خطأ',
            description: 'حدث خطأ أثناء جلب بيانات المستخدم',
            variant: 'destructive',
          });
        }
      }
    };

    document.addEventListener('selectUserForCredits', handleSelectUser as EventListener);
    return () =>
      document.removeEventListener('selectUserForCredits', handleSelectUser as EventListener);
  }, [toast]);

  const handleGiftCredits = async () => {
    if (!selectedUser || creditAmount <= 0) return;

    // Validate amount is multiple of 100
    if (creditAmount % 100 !== 0) {
      toast({
        title: 'خطأ في المبلغ',
        description: 'يجب أن يكون المبلغ من مضاعفات 100',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGiftingCredits(true);

      console.log('Gifting credits:', {
        recipient_id: selectedUser.id,
        amount: creditAmount,
      });

      // Call the gift_credits RPC function
      const { data, error } = await supabase.rpc('gift_credits', {
        recipient_id: selectedUser.id,
        amount: creditAmount,
      });

      console.log('Gift credits response:', { data, error });

      if (error) {
        console.error('RPC error:', error);
        throw new Error(error.message || 'فشل في إهداء الرصيد');
      }

      // The function returns a JSON object
      if (!data || data.status !== 'success') {
        throw new Error(data?.message || 'فشل في إهداء الرصيد');
      }

      const newBalance = Number(data?.new_balance ?? 0);

      toast({
        title: 'تم بنجاح ✅',
        description: `تم إهداء ${creditAmount} ريال. الرصيد الجديد: ${newBalance} ريال`,
      });

      // Update local state
      setSelectedUser({
        ...selectedUser,
        credits: newBalance,
      });

      // Reset form
      setCreditAmount(100);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error gifting credits:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إهداء الرصيد',
        variant: 'destructive',
      });
    } finally {
      setIsGiftingCredits(false);
    }
  };

  return {
    selectedUser,
    creditAmount,
    isGiftingCredits,
    handleSelectUser: setSelectedUser,
    setCreditAmount,
    handleGiftCredits,
  };
};