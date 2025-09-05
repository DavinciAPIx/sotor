import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRightLeft, Search, Download, Gift, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/formatters';

interface CreditTransaction {
  id: string;
  from_user_id: string | null;
  to_user_id: string;
  amount: number;
  type: string;
  created_at: string;
  from_user_name?: string;
  to_user_name?: string;
  from_user_email?: string;
  to_user_email?: string;
}

const CreditTransactionsList: React.FC = () => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCreditTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm]);

  const fetchCreditTransactions = async () => {
    try {
      setLoading(true);
      
      // Get credit transactions
      const { data: creditTransactions, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user information
      const { data: usersData } = await supabase.rpc('get_all_users_with_profiles');

      const transactionsWithUserInfo = creditTransactions?.map(transaction => {
        const fromUser = usersData?.find(u => u.id === transaction.from_user_id);
        const toUser = usersData?.find(u => u.id === transaction.to_user_id);
        
        return {
          ...transaction,
          from_user_name: fromUser?.full_name || 'مستخدم محذوف',
          to_user_name: toUser?.full_name || 'مستخدم محذوف',
          from_user_email: fromUser?.email || 'غير متوفر',
          to_user_email: toUser?.email || 'غير متوفر'
        };
      }) || [];

      setTransactions(transactionsWithUserInfo);
    } catch (error) {
      console.error('Error fetching credit transactions:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب معاملات الرصيد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.from_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.to_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.from_user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.to_user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const getTransactionTypeBadge = (type: string) => {
    const typeConfig = {
      'admin_gift': { label: 'هدية من الإدارة', className: 'bg-green-100 text-green-800' },
      'transfer': { label: 'تحويل', className: 'bg-blue-100 text-blue-800' },
      'bonus': { label: 'مكافأة', className: 'bg-purple-100 text-purple-800' },
    };

    const config = typeConfig[type] || { label: type, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const exportTransactions = () => {
    const csvContent = [
      ['ID', 'من المستخدم', 'إلى المستخدم', 'المبلغ', 'النوع', 'التاريخ'].join(','),
      ...filteredTransactions.map(t => [
        t.id,
        t.from_user_name || 'النظام',
        t.to_user_name,
        t.amount,
        t.type,
        formatDate(t.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `credit_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-bahthali-600">
          <ArrowRightLeft className="h-5 w-5" />
          معاملات الرصيد
        </CardTitle>
        <CardDescription>
          عرض جميع معاملات تحويل وإهداء الرصيد
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Export */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في معاملات الرصيد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-10 text-right"
              />
            </div>
            
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
                    <TableHead className="text-right">من المستخدم</TableHead>
                    <TableHead className="text-right">إلى المستخدم</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        لم يتم العثور على معاملات رصيد
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {transaction.from_user_id ? (
                            <div>
                              <p className="font-medium">{transaction.from_user_name}</p>
                              <p className="text-xs text-gray-500">{transaction.from_user_email}</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-600">
                              <Gift className="h-4 w-4" />
                              <span className="font-medium">النظام</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.to_user_name}</p>
                            <p className="text-xs text-gray-500">{transaction.to_user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          +{transaction.amount} ريال
                        </TableCell>
                        <TableCell>
                          {getTransactionTypeBadge(transaction.type)}
                        </TableCell>
                        <TableCell>
                          {formatDate(transaction.created_at)}
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

export default CreditTransactionsList;