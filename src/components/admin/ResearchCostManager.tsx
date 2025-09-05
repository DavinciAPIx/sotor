import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, Loader2, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ResearchCostManager: React.FC = () => {
  const [currentCost, setCurrentCost] = useState<number>(0);
  const [newCost, setNewCost] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentCost();
  }, []);

  const fetchCurrentCost = async () => {
    try {
      setLoading(true);
      console.log('Fetching current research cost...');
      
      // Direct query to app_settings table
      const { data, error } = await supabase
        .from('app_settings')
        .select('value, updated_at')
        .eq('id', 'research_cost')
        .single();

      if (error) {
        console.error('Error fetching research cost:', error);
        // Set default values if no data found
        setCurrentCost(0);
        setNewCost('0');
      } else {
        console.log('Raw data from database:', data);
        
        if (data && data.value) {
          // Safely access the cost property
          const value = data.value as { cost?: number } | null;
          const cost = value?.cost ?? 0;
          console.log('Parsed research cost:', cost);
          setCurrentCost(cost);
          setNewCost(cost.toString());
          setLastUpdated(data?.updated_at || '');
        } else {
          console.log('No data found, setting default to 0');
          setCurrentCost(0);
          setNewCost('0');
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching research cost:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب تكلفة البحث",
        variant: "destructive",
      });
      
      // Set defaults
      setCurrentCost(0);
      setNewCost('0');
    } finally {
      setLoading(false);
    }
  };

// In ResearchCostManager.tsx, update the updateResearchCost function:
const updateResearchCost = async () => {
  try {
    setSaving(true);
    const cost = parseInt(newCost);

    if (isNaN(cost) || cost < 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم صحيح أكبر من أو يساوي 0",
        variant: "destructive",
      });
      return;
    }

    console.log('Updating research cost to:', cost);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لتحديث الإعدادات",
        variant: "destructive",
      });
      return;
    }

    // Update the app_settings table
    const { error } = await supabase
      .from('app_settings')
      .upsert({ 
        id: 'research_cost',
        value: { cost },
        updated_at: new Date().toISOString(),
        updated_by: user.id
      });

    if (error) throw error;

    setCurrentCost(cost);
    setLastUpdated(new Date().toISOString());
    
    toast({
      title: "تم التحديث بنجاح ✅",
      description: cost === 0 
        ? "الأبحاث الآن مجانية للجميع!" 
        : `تم تحديث تكلفة البحث إلى ${cost} ريال`,
    });

    // Dispatch events to notify all components
    window.dispatchEvent(new CustomEvent('researchCostUpdated', {
      detail: { cost }
    }));
    
    window.dispatchEvent(new CustomEvent('refreshResearchCost'));

  } catch (error) {
    console.error('Error updating research cost:', error);
    toast({
      title: "خطأ",
      description: "حدث خطأ أثناء تحديث تكلفة البحث: " + (error as Error).message,
      variant: "destructive",
    });
  } finally {
    setSaving(false);
  }
};

  const formatLastUpdated = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ar-DZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getCostStatus = () => {
    if (currentCost === 0) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        message: 'البحث مجاني حالياً'
      };
    } else {
      return {
        icon: DollarSign,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        message: `تكلفة البحث: ${currentCost} ريال`
      };
    }
  };

  const status = getCostStatus();
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-bahthali-600">
          <Settings className="h-5 w-5" />
          إدارة تكلفة البحث
        </CardTitle>
        <CardDescription>
          تحديد تكلفة إنشاء بحث واحد بالدينار الجزائري
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        ) : (
          <>
            {/* Current Status */}
            <Alert className={`${status.bgColor} ${status.borderColor}`}>
              <StatusIcon className={`h-4 w-4 ${status.color}`} />
              <AlertDescription className={status.color}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{status.message}</span>
                  {lastUpdated && (
                    <span className="text-xs opacity-75">
                      آخر تحديث: {formatLastUpdated(lastUpdated)}
                    </span>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Cost Input */}
            <div className="space-y-3">
              <Label htmlFor="newCost" className="text-sm font-medium">
                التكلفة الجديدة (ريال)
              </Label>
              <Input
                id="newCost"
                type="number"
                min="0"
                step="1"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="أدخل التكلفة الجديدة"
                className="text-right text-lg font-semibold"
                dir="rtl"
              />
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p>• أدخل 0 لجعل البحث مجانياً للجميع</p>
                  <p>• أدخل أي رقم موجب لتحديد تكلفة البحث</p>
                  <p>• التغيير سيؤثر على جميع المستخدمين فوراً</p>
                </div>
              </div>
            </div>

            {/* Preview */}
            {newCost !== currentCost.toString() && newCost !== '' && !isNaN(parseInt(newCost)) && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  <strong>معاينة التغيير:</strong> {' '}
                  {parseInt(newCost) === 0 
                    ? "سيصبح البحث مجانياً لجميع المستخدمين"
                    : `ستصبح تكلفة البحث ${parseInt(newCost)} ريال لكل بحث`
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Update Button */}
            <Button 
              onClick={updateResearchCost}
              disabled={saving || newCost === currentCost.toString() || newCost === '' || isNaN(parseInt(newCost)) || parseInt(newCost) < 0}
              className="w-full bg-bahthali-500 hover:bg-bahthali-600 text-white font-medium py-3"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>

            {/* Warning */}
            <Alert className="bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700 text-xs">
                <strong>تنبيه:</strong> تغيير تكلفة البحث سيؤثر على جميع المستخدمين فوراً. 
                تأكد من التكلفة قبل الحفظ.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ResearchCostManager;