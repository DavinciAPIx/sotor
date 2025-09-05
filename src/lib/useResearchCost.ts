import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useResearchCost = () => {
  const [researchCost, setResearchCost] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchResearchCost = async () => {
    try {
      console.log('Fetching research cost from database...');
      
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('id', 'research_cost')
        .single();
      
      if (error) {
        console.error('Error fetching research cost:', error);
        return 0;
      }
      
      const value = data?.value as { cost?: number } | null;
      const cost = value?.cost ?? 0;
      console.log('Research cost fetched:', cost);
      setResearchCost(cost);
      return cost;
    } catch (error) {
      console.error('Unexpected error fetching research cost:', error);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchResearchCost();

    // Set up real-time subscription
    const subscription = supabase
      .channel('research_cost_updates')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'app_settings',
          filter: `id=eq.research_cost` 
        }, 
        async (payload) => {
          console.log("Research cost changed via real-time:", payload);
          if (payload.new && (payload.new as any).value) {
            const value = (payload.new as any).value as { cost?: number } | null;
            const newCost = value?.cost ?? 0;
            console.log('Setting new research cost:', newCost);
            setResearchCost(newCost);
            
            // Dispatch custom event for components that need it
            window.dispatchEvent(new CustomEvent('researchCostUpdated', { 
              detail: { cost: newCost } 
            }));
          }
        }
      )
      .subscribe();

    // Listen for manual refresh events
    const handleRefresh = () => {
      fetchResearchCost();
    };
    
    // Listen for custom events from admin updates
    const handleCustomUpdate = (event: CustomEvent) => {
      const newCost = event.detail?.cost;
      if (typeof newCost === 'number') {
        console.log('Updating research cost from custom event:', newCost);
        setResearchCost(newCost);
      }
    };
    
    window.addEventListener('refreshResearchCost', handleRefresh);
    window.addEventListener('researchCostUpdated', handleCustomUpdate as EventListener);

    return () => {
      supabase.removeChannel(subscription);
      window.removeEventListener('refreshResearchCost', handleRefresh);
      window.removeEventListener('researchCostUpdated', handleCustomUpdate as EventListener);
    };
  }, []);

  const refreshCost = () => {
    fetchResearchCost();
  };

  return { researchCost, loading, refreshCost };
};