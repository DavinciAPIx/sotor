import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, FileText, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface AdminStatsProps {}

interface StatsData {
  totalUsers: number;
  totalCredits: number;
  totalResearches: number;
  totalRevenue: number;
  newUsersToday: number;
  researchesToday: number;
}

const AdminStats: React.FC<AdminStatsProps> = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log('Fetching admin stats...');

      // Get all users first
      const { data: usersData, error: usersError } = await supabase.rpc('get_all_users_with_profiles');
      
      if (usersError) {
        console.error('Error fetching users for stats:', usersError);
        throw usersError;
      }

      const totalUsers = usersData?.length || 0;
      
      // Calculate total credits by fetching each user's credits
      let totalCredits = 0;
      if (usersData) {
        for (const user of usersData) {
          try {
            const { data: userCredits } = await supabase.rpc('get_user_credits', {
              user_id_param: user.id
            });
            totalCredits += userCredits || 0;
          } catch (error) {
            console.error(`Error fetching credits for user ${user.id}:`, error);
          }
        }
      }
      
      // Fetch other stats with proper error handling
      const [researchesResult, transactionsResult] = await Promise.all([
        supabase.from('research_history').select('*', { count: 'exact', head: true }).then(
          result => result,
          error => {
            console.error('Error fetching research stats:', error);
            return { count: 0, error };
          }
        ),
        supabase.from('transactions_rows').select('amount').eq('status', 'paid').then(
          result => result,
          error => {
            console.error('Error fetching transaction stats:', error);
            return { data: [], error };
          }
        )
      ]);

      const totalResearches = researchesResult.count || 0;
      const totalRevenue = transactionsResult.data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;
      
      // Get today's data
      const today = new Date().toISOString().split('T')[0];
      
      // Count new users today
      const newUsersToday = usersData?.filter(user => 
        user.created_at && new Date(user.created_at).toISOString().split('T')[0] === today
      ).length || 0;
      
      // Get researches today
      const { data: researchesTodayData, error: researchesTodayError } = await supabase
        .from('research_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
        
      const researchesToday = researchesTodayError ? 0 : (researchesTodayData?.length || 0);

      setStats({
        totalUsers,
        totalCredits,
        totalResearches,
        totalRevenue,
        newUsersToday,
        researchesToday,
      });

      console.log('Stats fetched successfully:', {
        totalUsers,
        totalCredits,
        totalResearches,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "خطأ في جلب الإحصائيات",
        description: "حدث خطأ أثناء جلب إحصائيات المنصة. تأكد من صلاحيات الإدارة.",
        variant: "destructive",
      });
      
      // Set default values to prevent UI errors
      setStats({
        totalUsers: 0,
        totalCredits: 0,
        totalResearches: 0,
        totalRevenue: 0,
        newUsersToday: 0,
        researchesToday: 0,
      });
    } finally {
      setLoading(false);
    }
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="إجمالي المستخدمين"
        value={stats?.totalUsers || 0}
        description="العدد الكلي للمستخدمين المسجلين"
        icon={Users}
        color="text-blue-600"
      />
      
      <StatCard
        title="إجمالي الرصيد"
        value={`${stats?.totalCredits || 0} ريال`}
        description="مجموع رصيد جميع المستخدمين"
        icon={CreditCard}
        color="text-green-600"
      />
      
      <StatCard
        title="إجمالي الأبحاث"
        value={stats?.totalResearches || 0}
        description="العدد الكلي للأبحاث المنشأة"
        icon={FileText}
        color="text-purple-600"
      />
      
      <StatCard
        title="إجمالي الإيرادات"
        value={`${stats?.totalRevenue || 0} ريال`}
        description="مجموع الإيرادات من المعاملات"
        icon={DollarSign}
        color="text-yellow-600"
      />
      
      <StatCard
        title="مستخدمون جدد اليوم"
        value={stats?.newUsersToday || 0}
        description="المستخدمون الذين انضموا اليوم"
        icon={TrendingUp}
        color="text-indigo-600"
      />
      
      <StatCard
        title="أبحاث اليوم"
        value={stats?.researchesToday || 0}
        description="الأبحاث المنشأة اليوم"
        icon={Activity}
        color="text-red-600"
      />
    </div>
  );
};

export default AdminStats;