// useResearchCost.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useResearchCost = () => {
  const [researchCost, setResearchCost] = useState(0);

  useEffect(() => {
    const fetchInitialCost = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('id', 'research_cost')
        .single();
      
      if (data?.value) {
        setResearchCost(data.value.cost || 0);
      }
    };

    fetchInitialCost();

    // Listen for research cost updates
    const handleCostUpdate = (event: CustomEvent) => {
      setResearchCost(event.detail.cost);
    };

    window.addEventListener('researchCostUpdated', handleCostUpdate as EventListener);

    return () => {
      window.removeEventListener('researchCostUpdated', handleCostUpdate as EventListener);
    };
  }, []);

  return { researchCost };
};