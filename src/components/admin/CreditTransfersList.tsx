import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeftRight, Search, Download, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/formatters';

interface CreditTransfer {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  created_at: string;
  from_user_name?: string;
  to_user_name?: string;
  from_user_email?: string;
  to_user_email?: string;
}

const CreditTransfersList: React.FC = () => {
  const [transfers, setTransfers] = useState<CreditTransfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<CreditTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCreditTransfers();
  }, []);

  useEffect(() => {
    filterTransfers();
  }, [transfers, searchTerm]);

  const fetchCreditTransfers = async () => {
    try {
      setLoading(true);
      
      // Get credit transfers
      const { data: creditTransfers, error } = await supabase
        .from('credit_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user information
      const { data: usersData } = await supabase.rpc('get_all_users_with_profiles');

      const transfersWithUserInfo = creditTransfers?.map(transfer => {
        const fromUser = usersData?.find(u => u.id === transfer.from_user_id);
        const toUser = usersData?.find(u => u.id === transfer.to_user_id);
        
        return {
          ...transfer,
          from_user_name: fromUser?.full_name || 'مستخدم محذوف',
          to_user_name: toUser?.full_name || 'مستخدم محذوف',
          from_user_email: fromUser?.email || 'غير متوفر',
          to_user_email: toUser?.email || 'غير متوفر'
        };
      }) || [];

      setTransfers(transfersWithUserInfo);
    } catch (error) {
      console.error('Error fetching credit transfers:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب تحويلات الرصيد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransfers = () => {
    let filtered = transfers;

    if (searchTerm) {
      filtered = filtered.filter(transfer =>
        transfer.from_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.to_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.from_user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.to_user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransfers(filtered);
  };

  const exportTransfers = () => {
    const csvContent = [
      ['ID', 'من المستخدم', 'إلى المستخدم', 'المبلغ', 'التاريخ'].join(','),
      ...filteredTransfers.map(t => [
        t.id,
        t.from_user_name,
        t.to_user_name,
        t.amount,
        formatDate(t.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `credit_transfers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-bahthali-600">
          <ArrowLeftRight className="h-5 w-5" />
          تحويلات الرصيد بين المستخدمين
        </CardTitle>
        <CardDescription>
          عرض جميع تحويلات الرصيد التي تمت بين المستخدمين
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Export */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في تحويلات الرصيد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-10 text-right"
              />
            </div>
            
            <Button onClick={exportTransfers} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              تصدير CSV
            </Button>
          </div>

          {/* Transfers Table */}
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
                    <TableHead className="text-right">المبلغ المحول</TableHead>
                    <TableHead className="text-right">تاريخ التحويل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        لم يتم العثور على تحويلات رصيد
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-red-500" />
                            <div>
                              <p className="font-medium">{transfer.from_user_name}</p>
                              <p className="text-xs text-gray-500">{transfer.from_user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="font-medium">{transfer.to_user_name}</p>
                              <p className="text-xs text-gray-500">{transfer.to_user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {transfer.amount} ريال
                        </TableCell>
                        <TableCell>
                          {formatDate(transfer.created_at)}
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

export default CreditTransfersList;