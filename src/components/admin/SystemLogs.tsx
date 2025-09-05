import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, Filter, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/formatters';

interface SystemLog {
  id: string;
  action: string;
  user_id: string;
  details: string;
  level: 'info' | 'warning' | 'error' | 'success';
  created_at: string;
  user_name?: string;
  user_email?: string;
}

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    // For now, we'll create mock data since we don't have a system_logs table
    // In a real implementation, you would create this table and fetch real logs
    generateMockLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, levelFilter]);

  const generateMockLogs = async () => {
    try {
      setLoading(true);
      
      // Get some real user data for the mock logs
      const { data: usersData } = await supabase.rpc('get_all_users_with_profiles');
      
      const mockLogs: SystemLog[] = [
        {
          id: '1',
          action: 'user_login',
          user_id: usersData?.[0]?.id || 'unknown',
          details: 'تسجيل دخول ناجح من عنوان IP: 192.168.1.1',
          level: 'success',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          user_name: usersData?.[0]?.full_name || 'مستخدم مجهول',
          user_email: usersData?.[0]?.email || 'unknown@example.com'
        },
        {
          id: '2',
          action: 'research_created',
          user_id: usersData?.[1]?.id || 'unknown',
          details: 'تم إنشاء بحث جديد بعنوان: "تأثير التكنولوجيا على التعليم"',
          level: 'info',
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          user_name: usersData?.[1]?.full_name || 'مستخدم مجهول',
          user_email: usersData?.[1]?.email || 'unknown@example.com'
        },
        {
          id: '3',
          action: 'payment_failed',
          user_id: usersData?.[2]?.id || 'unknown',
          details: 'فشل في عملية الدفع - رصيد غير كافي',
          level: 'error',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          user_name: usersData?.[2]?.full_name || 'مستخدم مجهول',
          user_email: usersData?.[2]?.email || 'unknown@example.com'
        },
        {
          id: '4',
          action: 'admin_action',
          user_id: usersData?.[0]?.id || 'unknown',
          details: 'تم تحديث تكلفة البحث إلى 100 ريال',
          level: 'warning',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
          user_name: usersData?.[0]?.full_name || 'مستخدم مجهول',
          user_email: usersData?.[0]?.email || 'unknown@example.com'
        },
        {
          id: '5',
          action: 'credit_transfer',
          user_id: usersData?.[1]?.id || 'unknown',
          details: 'تم تحويل 50 ريال إلى مستخدم آخر',
          level: 'info',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          user_name: usersData?.[1]?.full_name || 'مستخدم مجهول',
          user_email: usersData?.[1]?.email || 'unknown@example.com'
        }
      ];

      setLogs(mockLogs);
    } catch (error) {
      console.error('Error generating mock logs:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب سجل النظام",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    setFilteredLogs(filtered);
  };

  const getLevelBadge = (level: string) => {
    const levelConfig = {
      success: { label: 'نجح', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      info: { label: 'معلومات', icon: Activity, className: 'bg-blue-100 text-blue-800' },
      warning: { label: 'تحذير', icon: AlertCircle, className: 'bg-yellow-100 text-yellow-800' },
      error: { label: 'خطأ', icon: XCircle, className: 'bg-red-100 text-red-800' },
    };

    const config = levelConfig[level] || { label: level, icon: Activity, className: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getActionLabel = (action: string) => {
    const actions = {
      'user_login': 'تسجيل دخول',
      'user_logout': 'تسجيل خروج',
      'research_created': 'إنشاء بحث',
      'payment_success': 'دفع ناجح',
      'payment_failed': 'فشل دفع',
      'credit_transfer': 'تحويل رصيد',
      'admin_action': 'إجراء إداري',
      'user_registered': 'تسجيل مستخدم جديد',
    };
    return actions[action] || action;
  };

  const exportLogs = () => {
    const csvContent = [
      ['ID', 'الإجراء', 'المستخدم', 'التفاصيل', 'المستوى', 'التاريخ'].join(','),
      ...filteredLogs.map(log => [
        log.id,
        getActionLabel(log.action),
        log.user_name,
        log.details,
        log.level,
        formatDate(log.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `system_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-bahthali-600">
          <Activity className="h-5 w-5" />
          سجل النظام
        </CardTitle>
        <CardDescription>
          عرض جميع الأنشطة والأحداث في المنصة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في السجل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-10 text-right"
              />
            </div>
            
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب المستوى" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستويات</SelectItem>
                <SelectItem value="success">نجح</SelectItem>
                <SelectItem value="info">معلومات</SelectItem>
                <SelectItem value="warning">تحذير</SelectItem>
                <SelectItem value="error">خطأ</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportLogs} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              تصدير CSV
            </Button>
          </div>

          {/* Logs Table */}
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
                    <TableHead className="text-right">الإجراء</TableHead>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">التفاصيل</TableHead>
                    <TableHead className="text-right">المستوى</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        لم يتم العثور على سجلات
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {getActionLabel(log.action)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.user_name}</p>
                            <p className="text-xs text-gray-500">{log.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate">{log.details}</p>
                        </TableCell>
                        <TableCell>
                          {getLevelBadge(log.level)}
                        </TableCell>
                        <TableCell>
                          {formatDate(log.created_at)}
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
  );
};

export default SystemLogs;