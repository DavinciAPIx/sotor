import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send, User, DollarSign, Search, CheckCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CreditTransferDialogProps {
  children: React.ReactNode;
  currentCredits: number;
  onTransferComplete?: () => void;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

const CreditTransferDialog: React.FC<CreditTransferDialogProps> = ({
  children,
  currentCredits,
  onTransferComplete
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [amount, setAmount] = useState('');
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const { toast } = useToast();

  // تحميل جميع المستخدمين عند فتح النافذة
  useEffect(() => {
    if (open) {
      loadAllUsers();
    }
  }, [open]);

  // تصفية المستخدمين حسب البحث
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, allUsers]);

  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      console.log('Loading all users...');
      
      // Get current user to exclude them from the list
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Query profiles table directly - note: profiles table doesn't have email column
      // We'll need to get email from auth.users via a join or separate query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', currentUser?.id || ''); // Exclude current user

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء جلب المستخدمين",
          variant: "destructive",
        });
        return;
      }

      // Get user emails from auth.users (this requires RLS policies or admin access)
      // For now, we'll use a placeholder email or the user ID
      const usersWithEmails = profiles?.map(profile => ({
        ...profile,
        email: profile.full_name || profile.id // Using full_name or id as fallback
      })) || [];

      console.log('Users loaded:', usersWithEmails?.length || 0);
      setAllUsers(usersWithEmails);
      setFilteredUsers(usersWithEmails);

    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "خطأ في جلب المستخدمين",
        description: "حدث خطأ أثناء جلب قائمة المستخدمين. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserSelect = (user: UserData) => {
    setSelectedUser(user);
    setSearchTerm('');
  };

  // التأكد من وجود سجل رصيد للمستقبل
  const ensureRecipientCredits = async (recipientId: string) => {
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', recipientId)
      .maybeSingle();

    if (error && error.code === 'PGRST116') {
      console.log('No credits record for recipient, creating new record');
      const { error: insertError } = await supabase
        .from('user_credits')
        .insert({ user_id: recipientId, balance: 0 });
      if (insertError) {
        console.error('Error creating recipient credits:', insertError);
        throw new Error('فشل إنشاء سجل رصيد للمستقبل');
      }
    } else if (error) {
      console.error('Error checking recipient credits:', error);
      throw new Error('خطأ في التحقق من رصيد المستقبل');
    }
  };

  // دالة التحويل المحسنة - استخدام التحويل المباشر بدلاً من RPC
  const handleTransfer = async () => {
    if (!selectedUser) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المستخدم المستقبل أولاً",
        variant: "destructive",
      });
      return;
    }

    const transferAmount = parseInt(amount);
    if (!transferAmount || transferAmount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    if (transferAmount > currentCredits) {
      toast({
        title: "خطأ",
        description: "رصيدك غير كافي لإجراء هذا التحويل",
        variant: "destructive",
      });
      return;
    }

    setIsTransferring(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('لم يتم العثور على المستخدم');

      console.log('Starting credit transfer...', {
        from: user.id,
        to: selectedUser.id,
        amount: transferAmount
      });

      // التأكد من وجود سجل للمستقبل
      await ensureRecipientCredits(selectedUser.id);

      // بدء المعاملة - خصم من الراسل
      const { data: senderData, error: senderError } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (senderError) {
        console.error('Error fetching sender balance:', senderError);
        throw new Error('خطأ في جلب رصيد الراسل');
      }

      if (senderData.balance < transferAmount) {
        throw new Error('رصيدك غير كافي لإجراء هذا التحويل');
      }

      // خصم من الراسل
      const { error: deductError } = await supabase
        .from('user_credits')
        .update({ balance: senderData.balance - transferAmount })
        .eq('user_id', user.id);

      if (deductError) {
        console.error('Error deducting from sender:', deductError);
        throw new Error('خطأ في خصم المبلغ من رصيدك');
      }

      // إضافة للمستقبل
      const { data: recipientData, error: recipientFetchError } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', selectedUser.id)
        .single();

      if (recipientFetchError) {
        console.error('Error fetching recipient balance:', recipientFetchError);
        // إعادة المبلغ للراسل في حالة الخطأ
        await supabase
          .from('user_credits')
          .update({ balance: senderData.balance })
          .eq('user_id', user.id);
        throw new Error('خطأ في جلب رصيد المستقبل');
      }

      const { error: addError } = await supabase
        .from('user_credits')
        .update({ balance: recipientData.balance + transferAmount })
        .eq('user_id', selectedUser.id);

      if (addError) {
        console.error('Error adding to recipient:', addError);
        // إعادة المبلغ للراسل في حالة الخطأ
        await supabase
          .from('user_credits')
          .update({ balance: senderData.balance })
          .eq('user_id', user.id);
        throw new Error('خطأ في إضافة المبلغ لرصيد المستقبل');
      }

      // تسجيل المعاملة (اختياري)
      await supabase
        .from('credit_transfers')
        .insert({
          from_user_id: user.id,
          to_user_id: selectedUser.id,
          amount: transferAmount,
          created_at: new Date().toISOString()
        });

      toast({
        title: "تم التحويل بنجاح ✨",
        description: `تم تحويل ${transferAmount} ريال إلى ${selectedUser.full_name || selectedUser.email}`,
      });

      setSearchTerm('');
      setAmount('');
      setSelectedUser(null);
      setOpen(false);
      onTransferComplete?.();

    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "فشل التحويل",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء التحويل",
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const resetForm = () => {
    setSearchTerm('');
    setAmount('');
    setSelectedUser(null);
    setAllUsers([]);
    setFilteredUsers([]);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-green-50 to-green-25 border-green-200" dir="rtl">
        <DialogHeader className="text-right border-b border-green-100 pb-4">
          <DialogTitle className="flex items-center gap-3 justify-end text-xl font-bold text-green-800">
            <span>تحويل رصيد</span>
              <Send className="h-5 w-5 text-green-600" />
          </DialogTitle>
          <DialogDescription className="text-right text-green-600 mt-2">
            قم بتحويل جزء من رصيدك إلى مستخدم آخر بسهولة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-4" dir="rtl">
          {/* عرض الرصيد الحالي */}
          <div className="bg-gradient-to-r from-green-100 to-green-50 p-5 rounded-2xl border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">رصيدك الحالي:</span>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
                <span className="font-bold text-lg text-green-800">{currentCredits}</span>
                <span className="font-bold text-lg text-green-600">ريال</span>
              </div>
            </div>
          </div>

          {/* حقل البحث */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-right block font-medium text-green-700">
              البحث عن مستخدم
            </Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
              <Input
                id="search"
                type="text"
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-right pr-10 pl-3 py-3 border border-green-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white"
                dir="rtl"
              />
            </div>
          </div>

          {/* عرض المستخدم المحدد */}
          {selectedUser && (
            <div className="bg-gradient-to-r from-green-50 to-green-25 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-green-300">
                    <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.full_name} />
                    <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <CheckCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-green-600 bg-white rounded-full" />
                </div>
                <div className="flex-1 text-right">
                  <p className="font-semibold text-green-800">
                    {selectedUser.full_name}
                  </p>
                  <p className="text-sm text-green-600">{selectedUser.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}

{!selectedUser && searchTerm.trim() !== '' && (
  <div className="space-y-2">
    <Label className="text-right block font-medium text-green-700">
      نتائج البحث
    </Label>

    {isLoadingUsers ? (
      <div className="flex justify-center items-center py-10 bg-white rounded-xl border border-green-100">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-600 mx-auto mb-2" />
          <span className="text-green-600 text-sm">جاري جلب المستخدمين...</span>
        </div>
      </div>
    ) : (
      <div className="max-h-64 overflow-y-auto border border-green-200 rounded-2xl bg-gradient-to-br from-green-50 to-green-25 shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-green-600">
            <User className="h-10 w-10 mx-auto mb-2 text-green-400" />
            <p className="text-sm">لا توجد نتائج للبحث</p>
          </div>
        ) : (
          <div className="divide-y divide-green-100">
            {filteredUsers.map((user) => (
<button
  key={user.id}
  className="w-full flex items-center justify-between p-3 hover:bg-green-100 transition text-right rounded-xl"
  onClick={() => handleUserSelect(user)}
>
  <div className="flex items-center gap-3">
    <Avatar className="h-8 w-8">
      <AvatarImage src={user.avatar_url} />
      <AvatarFallback className="bg-green-100 text-green-700">
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
    <div className="flex flex-col">
      <span className="text-sm font-medium text-green-800">{user.full_name}</span>
      <span className="text-xs text-green-600">{user.email}</span>
    </div>
  </div>
</button>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
)}


  {/* حقل المبلغ */}
<div className="space-y-2">
  <Label htmlFor="amount" className="text-right block font-medium text-green-700">
    المبلغ المراد تحويله (ريال)
  </Label>
  <Input
    id="amount"
    type="number"
    placeholder="أدخل المبلغ"
    value={amount}
    onChange={(e) => setAmount(e.target.value)}
    max={currentCredits}
    min="1"
    className="text-center text-lg font-semibold py-3 border border-green-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white"
    dir="ltr"
  />
  <p className="text-xs text-green-600 text-right">
    الحد الأقصى: {currentCredits} ريال
  </p>
  {amount && parseInt(amount) % 100 !== 0 && (
    <p className="font-bold text-sm text-red-500 text-right">
      يجب أن يكون المبلغ من مضاعفات 100.
    </p>
  )}
</div>

{/* زر التحويل */}
<Button 
  onClick={handleTransfer}
  disabled={
    !selectedUser ||
    !amount ||
    isTransferring ||
    parseInt(amount) <= 0 ||
    parseInt(amount) % 100 !== 0
  }
  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  size="lg"
>
  {isTransferring ? (
    <div className="flex items-center gap-2">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>جاري التحويل...</span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Sparkles className="h-5 w-5" />
      <span>تحويل الرصيد</span>
    </div>
  )}
</Button>


          {/* ملاحظة */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-xs text-green-600 text-right">
              💡 التحويل فوري ولا يمكن إلغاؤه. تأكد من صحة بيانات المستخدم المستقبل.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditTransferDialog;