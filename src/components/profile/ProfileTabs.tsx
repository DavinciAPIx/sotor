
import React from 'react';
import { FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResearchHistoryTable from './ResearchHistoryTable';
import ErrorDisplay from './ErrorDisplay';

interface ResearchItem {
  id: string;
  title: string;
  document_url: string;
  created_at: string;
}

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loadError: string | null;
  loading: boolean;
  loadingProgress: number;
  researchHistory: ResearchItem[];
  formatDate: (date: string) => string;
  handleRefresh: () => void;
}

const ProfileTabs = ({
  activeTab,
  setActiveTab,
  loadError,
  loading,
  loadingProgress,
  researchHistory,
  formatDate,
  handleRefresh
}: ProfileTabsProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-bahthali-700 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          سجل الأبحاث
        </h2>
      </div>
      
      {loadError && (
        <ErrorDisplay errorMessage={loadError} onRetry={handleRefresh} />
      )}
      
      <ResearchHistoryTable 
        researchHistory={researchHistory}
        loading={loading}
        loadingProgress={loadingProgress}
        formatDate={formatDate}
      />
    </div>
  );
};

export default ProfileTabs;
