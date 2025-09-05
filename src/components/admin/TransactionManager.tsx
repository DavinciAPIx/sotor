import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Search, Filter, Download, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/formatters';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  research_topic: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

const TransactionManager: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter, paymentMethodFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Get transactions with user information
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails separately since they're in auth.users
      const userIds = data?.map(t => t.user_id) || [];
      const { data: usersData } = await supabase.rpc('get_all_users_with_profiles');

      const transactionsWithUserInfo = data?.map(transaction => {
        const userInfo = usersData?.find(u => u.id === transaction.user_id);
        return {
          ...transaction,
          user_name: transaction.profiles?.full_name || 'مستخدم بدون اسم',
          user_email: userInfo?.email || 'غير متوفر'
        };
      }) || [];

      setTransactions(transactionsWithUserInfo);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب المعاملات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.research_topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    // Filter by payment method
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.payment_method === paymentMethodFilter);
    }

    setFilteredTransactions(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'مكتمل', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      pending: { label: 'قيد المعالجة', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'فشل', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const, className: '' };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      'CIB': 'بطاقة بنكية',
      'credit': 'رصيد',
      'free_credit': 'رصيد مجاني',
      'admin_gift': 'هدية من الإدارة',
    };
    return methods[method] || method;
  };

  const exportTransactions = () => {
    const csvContent = [
      ['ID', 'المستخدم', 'البريد الإلكتروني', 'المبلغ', 'الحالة', 'طريقة الدفع', 'موضوع البحث', 'التاريخ'].join(','),
      ...filteredTransactions.map(t => [
        t.id,
        t.user_name,
        t.user_email,
        t.amount,
        t.status,
        getPaymentMethodLabel(t.payment_method),
        t.research_topic,
        formatDate(t.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-bahthali-600">
          <CreditCard className="h-5 w-5" />
          إدارة المعاملات
        </CardTitle>
        <CardDescription>
          عرض وإدارة جميع المعاملات المالية في المنصة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في المعاملات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-10 text-right"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="paid">مكتمل</SelectItem>
                <SelectItem value="pending">قيد المعالجة</SelectItem>
                <SelectItem value="failed">فشل</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطرق</SelectItem>
                <SelectItem value="CIB">بطاقة بنكية</SelectItem>
                <SelectItem value="credit">رصيد</SelectItem>
                <SelectItem value="free_credit">رصيد مجاني</SelectItem>
                <SelectItem value="admin_gift">هدية من الإدارة</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportTransactions} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              تصدير CSV
            </Button>
          </div>

          {/* Transactions Table */}
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
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">طريقة الدفع</TableHead>
                    <TableHead className="text-right">موضوع البحث</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        لم يتم العثور على معاملات
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.user_name}</p>
                            <p className="text-xs text-gray-500">{transaction.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.amount} ريال
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodLabel(transaction.payment_method)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.research_topic}
                        </TableCell>
                        <TableCell>
                          {formatDate(transaction.created_at)}
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
  );
};

export default TransactionManager;