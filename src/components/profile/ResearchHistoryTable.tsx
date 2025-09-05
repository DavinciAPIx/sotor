import React from 'react';
import { FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';

interface ResearchItem {
  id: string;
  title: string;
  document_url: string;
  created_at: string;
}

interface ResearchHistoryTableProps {
  researchHistory: ResearchItem[];
  loading: boolean;
  loadingProgress: number;
  formatDate: (date: string) => string;
}

const ResearchHistoryTable = ({ 
  researchHistory, 
  loading, 
  loadingProgress,
  formatDate
}: ResearchHistoryTableProps) => {
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">جاري تحميل سجل الأبحاث...</p>
          <Progress value={loadingProgress} className="h-2 w-full max-w-md mx-auto" />
        </div>
        
        {/* Skeleton loading UI */}
        <div className="overflow-x-auto border rounded-lg">
          <div className="p-4 border-b bg-muted/40">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
          
          <div className="p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-3 gap-4 py-3 border-b last:border-0">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (researchHistory.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-bahthali-100/50 transition-all duration-300 hover:shadow-md">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-bahthali-100/50 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-bahthali-200/60 rounded-full flex items-center justify-center">
              <svg 
                viewBox="0 0 24 24" 
                className="w-10 h-10 text-bahthali-400"
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="8" y1="13" x2="16" y2="13"/>
                <line x1="8" y1="17" x2="12" y2="17"/>
              </svg>
            </div>
          </div>
        </div>
        <h3 className="text-xl font-medium text-bahthali-700 mb-2">لم تقم بإنشاء أي أبحاث بعد</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">قم بإنشاء بحثك الأول على منصة بحثلي واحصل على نتائج عالية الجودة</p>
        <Link to="/">
          <Button 
            className="bg-bahthali-500 hover:bg-bahthali-600 text-white px-8 py-2.5 h-auto rounded-full transition-all duration-300 hover:scale-105 hover:shadow-md font-medium"
          >
            إنشاء بحث جديد
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl shadow-lg bg-white transition-all duration-300">
        {/* Horizontal scroll container */}
        <div className="overflow-x-auto">
          {/* Vertical scroll container with fixed height */}
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-gradient-to-l from-bahthali-50 to-bahthali-100 border-b border-bahthali-200 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-right font-bold text-bahthali-700 pr-6 py-5 min-w-[300px]">عنوان البحث</TableHead>
                  <TableHead className="text-right font-bold text-bahthali-700 py-5 min-w-[150px]">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right font-bold text-bahthali-700 py-5 min-w-[120px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {researchHistory.map((research) => (
                  <TableRow key={research.id} className="transition-colors animate-fade-in hover:bg-bahthali-50/30">
                    <TableCell className="font-medium pr-6 py-5 border-b border-bahthali-100/30">
                      <div className="flex items-start">
                        <div className="flex items-center justify-center p-2 rounded-full bg-bahthali-100 ml-3 flex-shrink-0">
                          <FileText className="h-5 w-5 text-bahthali-600" />
                        </div>
                        <span className="line-clamp-2 pt-1">{research.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 border-b border-bahthali-100/30">
                      <Badge variant="outline" className="bg-bahthali-50 hover:bg-bahthali-100 text-bahthali-700 border-bahthali-200 font-semibold px-3 py-1.5 transition-all duration-300">
                        {formatDate(research.created_at)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 border-b border-bahthali-100/30">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(research.document_url, '_blank')}
                          className="text-bahthali-500 border-bahthali-200 hover:bg-bahthali-50 hover:border-bahthali-300 hover:text-bahthali-600 transition-all duration-300 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          عرض
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchHistoryTable;