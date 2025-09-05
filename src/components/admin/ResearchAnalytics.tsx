import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Download, Eye, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/formatters';

interface ResearchData {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface ResearchStats {
  totalResearches: number;
  researchesToday: number;
  researchesThisWeek: number;
  researchesThisMonth: number;
  topUsers: Array<{
    user_name: string;
    research_count: number;
  }>;
}

const ResearchAnalytics: React.FC = () => {
  const [researches, setResearches] = useState<ResearchData[]>([]);
  const [filteredResearches, setFilteredResearches] = useState<ResearchData[]>([]);
  const [stats, setStats] = useState<ResearchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchResearchData();
  }, []);

  useEffect(() => {
    filterResearches();
  }, [researches, searchTerm]);

  const fetchResearchData = async () => {
    try {
      setLoading(true);
      
      // Get all research data
      const { data: researchData, error } = await supabase
        .from('research_history')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails
      const { data: usersData } = await supabase.rpc('get_all_users_with_profiles');

      const researchesWithUserInfo = researchData?.map(research => {
        const userInfo = usersData?.find(u => u.id === research.user_id);
        return {
          ...research,
          user_name: research.profiles?.full_name || 'مستخدم بدون اسم',
          user_email: userInfo?.email || 'غير متوفر'
        };
      }) || [];

      setResearches(researchesWithUserInfo);

      // Calculate statistics
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

      const researchesToday = researchesWithUserInfo.filter(r => 
        new Date(r.created_at) >= today
      ).length;

      const researchesThisWeek = researchesWithUserInfo.filter(r => 
        new Date(r.created_at) >= weekAgo
      ).length;

      const researchesThisMonth = researchesWithUserInfo.filter(r => 
        new Date(r.created_at) >= monthAgo
      ).length;

      // Calculate top users
      const userResearchCounts = researchesWithUserInfo.reduce((acc, research) => {
        const userName = research.user_name || 'مستخدم بدون اسم';
        acc[userName] = (acc[userName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topUsers = Object.entries(userResearchCounts)
        .map(([user_name, research_count]) => ({ user_name, research_count }))
        .sort((a, b) => b.research_count - a.research_count)
        .slice(0, 5);

      setStats({
        totalResearches: researchesWithUserInfo.length,
        researchesToday,
        researchesThisWeek,
        researchesThisMonth,
        topUsers
      });

    } catch (error) {
      console.error('Error fetching research data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات الأبحاث",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterResearches = () => {
    let filtered = researches;

    if (searchTerm) {
      filtered = filtered.filter(research =>
        research.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        research.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        research.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResearches(filtered);
  };

  const exportResearches = () => {
    const csvContent = [
      ['ID', 'العنوان', 'المستخدم', 'البريد الإلكتروني', 'التاريخ'].join(','),
      ...filteredResearches.map(r => [
        r.id,
        r.title,
        r.user_name,
        r.user_email,
        formatDate(r.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `researches_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const StatCard = ({ title, value, description, icon: Icon, color }: {
    title: string;
    value: string | number;
    description: string;
    icon: any;
    color: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? <Skeleton className="h-8 w-16" /> : value}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الأبحاث"
          value={stats?.totalResearches || 0}
          description="العدد الكلي للأبحاث المنشأة"
          icon={FileText}
          color="text-blue-600"
        />
        
        <StatCard
          title="أبحاث اليوم"
          value={stats?.researchesToday || 0}
          description="الأبحاث المنشأة اليوم"
          icon={Calendar}
          color="text-green-600"
        />
        
        <StatCard
          title="أبحاث هذا الأسبوع"
          value={stats?.researchesThisWeek || 0}
          description="الأبحاث المنشأة خلال 7 أيام"
          icon={TrendingUp}
          color="text-purple-600"
        />
        
        <StatCard
          title="أبحاث هذا الشهر"
          value={stats?.researchesThisMonth || 0}
          description="الأبحاث المنشأة خلال 30 يوم"
          icon={TrendingUp}
          color="text-orange-600"
        />
      </div>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-bahthali-600">أكثر المستخدمين نشاطاً</CardTitle>
          <CardDescription>المستخدمون الذين أنشأوا أكبر عدد من الأبحاث</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.topUsers.map((user, index) => (
                <div key={user.user_name} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium">{user.user_name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{user.research_count} بحث</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Research List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-bahthali-600">
            <FileText className="h-5 w-5" />
            سجل الأبحاث
          </CardTitle>
          <CardDescription>
            عرض وإدارة جميع الأبحاث المنشأة في المنصة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Export */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في الأبحاث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-3 pr-10 text-right"
                />
              </div>
              
              <Button onClick={exportResearches} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                تصدير CSV
              </Button>
            </div>

            {/* Research Table */}
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">عنوان البحث</TableHead>
                      <TableHead className="text-right">المستخدم</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResearches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          لم يتم العثور على أبحاث
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredResearches.map((research) => (
                        <TableRow key={research.id}>
                          <TableCell className="max-w-xs">
                            <p className="font-medium truncate">{research.title}</p>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{research.user_name}</p>
                              <p className="text-xs text-gray-500">{research.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(research.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
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
    </div>
  );
};

export default ResearchAnalytics;