import React, { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from './ui/skeleton';
import { useResearchCost } from '@/hooks/useResearchCost';
import { cn } from '@/lib/utils';
import CreditTransferDialog from './CreditTransferDialog';

interface CreditsDisplayProps {
  userId: string | null;
  isAdmin?: boolean;
}

const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ userId, isAdmin = false }) => {
  const [credits, setCredits] = useState<number | null>(null);
  const [prevCredits, setPrevCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { researchCost } = useResearchCost();
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();

  const fetchCredits = async () => {
    if (!userId) {
      setLoading(false);
      setCredits(null);
      return;
    }
    
    try {
      console.log("Fetching credits for user:", userId, isAdmin ? "(admin)" : "");
      
      if (isAdmin) {
        console.log("Admin user detected, setting unlimited credits");
        setCredits(999999);
        setLoading(false);
        return;
      }
      
      // Use direct query to user_credits table
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance') 
        .eq('user_id', userId)
        .maybeSingle();

      console.log("Credits fetch response:", { data, error });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('Results contain 0 rows') || error.message.includes('No data')) {
          console.log("No credits record found, creating new record with 0 credits");
          setCredits(0);
          createUserCredits(userId);
        } else {
          console.error('Error fetching user credits:', error);
          setCredits(0);
        }
      } else {
        console.log("Successfully fetched credits:", data?.balance || 0);
        setPrevCredits(credits);
        setCredits(data?.balance || 0);
        
        if (credits !== null && (data?.balance || 0) !== credits) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1500);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setCredits(0);
    } finally {
      setLoading(false);
    }
  };

  const createUserCredits = async (userId: string) => {
    try {
      const { error: insertError } = await supabase
        .from('user_credits')
        .insert({ user_id: userId, balance: 0 });
        
      if (insertError) {
        console.error('Error creating user credits:', insertError);
        setTimeout(async () => {
          const { error: retryError } = await supabase
            .from('user_credits')
            .insert({ user_id: userId, balance: 0 });
          
          if (retryError) {
            console.error('Error on retry creating user credits:', retryError);
          } else {
            console.log("Successfully created user credits on retry");
            setCredits(0);
          }
        }, 1000);
      } else {
        console.log("Successfully created user credits");
        setCredits(0);
      }
    } catch (insertCatchError) {
      console.error('Exception when creating credits:', insertCatchError);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCredits();
    } else {
      setLoading(false);
      setCredits(0);
    }

    const setupSubscriptions = async () => {
      if (!userId) return;
      
      // User credits changes
      const creditsSubscription = supabase
        .channel('user_credits_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'user_credits',
            filter: `user_id=eq.${userId}` 
          }, 
          (payload) => {
            console.log("Credits changed:", payload);
            if (payload.new) {
              setPrevCredits(credits);
              setCredits((payload.new as any).balance || 0);
              setIsAnimating(true);
              setTimeout(() => setIsAnimating(false), 1500);
            }
          }
        )
        .subscribe();
        
      // Transactions
      const transactionSubscription = supabase
        .channel('user_transactions')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'transactions_rows',
            filter: `user_id=eq.${userId}` 
          }, 
          async (payload) => {
            console.log("New transaction:", payload);
            await fetchCredits();
          }
        )
        .subscribe();
        
      // Credit transactions (admin gifts)
      const creditTransactionSubscription = supabase
        .channel('credit_transactions')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'credit_transactions',
            filter: `to_user_id=eq.${userId}` 
          }, 
          async (payload) => {
            console.log("New credit transaction:", payload);
            await fetchCredits();
            
            if ((payload.new as any).type === 'admin_gift') {
              toast({
                title: "تم إضافة رصيد لحسابك!",
                description: `تم إهداءك ${(payload.new as any).amount} رصيد من قبل الإدارة`,
              });
            }
          }
        )
        .subscribe();

      // Credit transfers
      const transferSubscription = supabase
        .channel('credit_transfers')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'credit_transfers',
            filter: `to_user_id=eq.${userId}` 
          }, 
          async (payload) => {
            console.log("New credit transfer received:", payload);
            await fetchCredits();
            
            toast({
              title: "تم استلام رصيد!",
              description: `تم تحويل ${(payload.new as any).amount} رصيد إليك من مستخدم آخر`,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(creditsSubscription);
        supabase.removeChannel(transactionSubscription);
        supabase.removeChannel(creditTransactionSubscription);
        supabase.removeChannel(transferSubscription);
      };
    };
    
    const cleanup = setupSubscriptions();

    // Credits updated event listener
    const handleCreditsUpdated = () => {
      console.log("Credits updated event received");
      if (userId) {
        fetchCredits();
      }
    };
    
    document.addEventListener('creditsUpdated', handleCreditsUpdated);
    
    return () => {
      cleanup.then(fn => fn && fn());
      document.removeEventListener('creditsUpdated', handleCreditsUpdated);
    };
  }, [userId, toast]);

  const refreshCredits = () => {
    if (userId) {
      fetchCredits();
    }
  };

  const getDisplayText = () => {
    if (!userId) return "0 ريال";
    if (isAdmin) return "∞";
    if (researchCost === 0) return "∞";
    return credits !== null ? `${credits} ريال` : "0 ريال";
  };

  const hasIncreased = prevCredits !== null && credits !== null && credits > prevCredits;
  const hasDecreased = prevCredits !== null && credits !== null && credits < prevCredits;

  if (!userId || (isAdmin && !loading && credits === null)) return null;

  const creditsDisplay = (
    <div 
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm border transition-all duration-300 cursor-pointer hover:shadow-md",
        isAnimating && hasIncreased && "bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-700",
        isAnimating && hasDecreased && "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 text-amber-700",
        !isAnimating && "bg-gradient-to-r from-bahthali-50 to-bahthali-100 border-bahthali-200 text-bahthali-700 hover:bg-gradient-to-r hover:from-bahthali-100 hover:to-bahthali-150"
      )}
      title={researchCost === 0 ? "البحث مجاني حاليًا" : `رصيدك: ${credits !== null ? credits : 0} ريال - انقر للتحويل`}
    >
      <Coins className={cn(
        "h-4 w-4 transition-all duration-300",
        isAnimating && hasIncreased && "text-green-500 animate-pulse scale-110",
        isAnimating && hasDecreased && "text-amber-500",
        !isAnimating && "text-bahthali-500"
      )} />
      {loading ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <>
          <span className={cn(
            "transition-all duration-300",
            isAnimating && hasIncreased && "text-green-600",
            isAnimating && hasDecreased && "text-amber-600",
            !isAnimating && "text-bahthali-600"
          )}>
            رصيدك:
          </span>
          <span className={cn(
            "font-semibold transition-all duration-500",
            isAnimating && hasIncreased && "text-green-700 animate-bounce",
            isAnimating && hasDecreased && "text-amber-700",
            !isAnimating && ""
          )}>
            <span className={cn(
              "transition-all transform inline-block",
              isAnimating ? "scale-110" : "scale-100"
            )}>
              {getDisplayText()}
            </span>
          </span>
        </>
      )}
    </div>
  );

  if (!isAdmin && credits !== null && !loading) {
    return (
      <CreditTransferDialog 
        currentCredits={credits} 
        onTransferComplete={refreshCredits}
      >
        {creditsDisplay}
      </CreditTransferDialog>
    );
  }

  return creditsDisplay;
};

export default CreditsDisplay;