import React, { useState, useContext } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CreditCard, Crown, CheckCircle, Award, Star } from 'lucide-react';
import { AuthContext } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useResearchCost } from '@/hooks/useResearchCost';
import BonusDisplay from './BonusDisplay';
import MoyasarCheckout from './payment/MoyasarCheckout';

interface PricingPlanProps {
  price: number;
  title: string;
  recommended?: boolean;
  features: string[];
  icon: React.ReactNode;
  color: string;
  researchCount: number;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  bonusCount?: number;
  onSelectPlan: (amount: number, title: string) => void; // Fixed: Added title parameter
}

const PricingPlans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<{ amount: number; title: string } | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const { researchCost } = useResearchCost();
  const { user } = useContext(AuthContext);
  const { toast } = useToast();

  // Fixed: Updated to accept both amount and title
  const handleSelectPlan = async (amount: number, title: string) => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب عليك تسجيل الدخول أولاً لشحن الرصيد",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPlan({ amount, title });
    setShowCheckout(true);
  };

  const handlePaymentSuccess = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
    toast({
      title: "تم الدفع بنجاح! 🎉",
      description: "تم إضافة الرصيد إلى حسابك بنجاح",
    });
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  if (researchCost === 0) return null;

  const commonFeatures = ["صفحة غلاف متميزة", "خطة بحث منظمة", "بحث كامل و منظم"];
  const pricingPlans = [
    {
      price: 10,
      title: "الباقة النحاسية",
      researchCount: 1,
      features: commonFeatures,
      icon: <Star className="h-6 w-6" />,
      color: "copper",
      badge: "سريع",
      badgeVariant: "secondary" as const,
      recommended: false
    },
    {
      price: 30,
      title: "الباقة الفضية",
      researchCount: 4,
      bonusCount: 1,
      features: commonFeatures,
      recommended: true,
      icon: <Crown className="h-6 w-6" />,
      color: "dark-silver"
    },
    {
      price: 50,
      title: "الباقة الذهبية",
      researchCount: 7,
      bonusCount: 2,
      features: commonFeatures,
      icon: <Award className="h-6 w-6" />,
      color: "dark-gold",
      badge: "الأكثر توفيرا",
      badgeVariant: "default" as const,
      recommended: false
    }
  ];

  const PricingPlan: React.FC<PricingPlanProps> = ({
    price,
    title,
    features,
    recommended = false,
    icon,
    color,
    researchCount,
    badge,
    badgeVariant = "default",
    bonusCount = 0,
    onSelectPlan // Fixed: Added this prop
  }) => {
    const getBorderColor = () => {
      switch (color) {
        case 'copper': return 'border-copper-200';
        case 'dark-silver': return 'border-dark-silver-200';
        case 'dark-gold': return 'border-dark-gold-200';
        default: return 'border-gray-200';
      }
    };

    const getBackgroundColor = () => {
      switch (color) {
        case 'copper': return 'from-copper-50/80 to-white';
        case 'dark-silver': return 'from-dark-silver-50/80 to-white';
        case 'dark-gold': return 'from-dark-gold-50/80 to-white';
        default: return 'from-white to-white';
      }
    };

    const getIconColor = () => {
      switch (color) {
        case 'copper': return 'bg-copper-100/50 text-copper-600';
        case 'dark-silver': return 'bg-dark-silver-100/50 text-dark-silver-600';
        case 'dark-gold': return 'bg-dark-gold-100/50 text-dark-gold-600';
        default: return 'bg-gray-100 text-gray-600';
      }
    };

    const getPriceColor = () => {
      switch (color) {
        case 'copper': return 'text-copper-600';
        case 'dark-silver': return 'text-dark-silver-600';
        case 'dark-gold': return 'text-dark-gold-600';
        default: return 'text-gray-700';
      }
    };

    const getButtonColor = () => {
      switch (color) {
        case 'copper': return 'bg-copper-500 hover:bg-copper-600';
        case 'dark-silver': return 'bg-dark-silver-500 hover:bg-dark-silver-600';
        case 'dark-gold': return 'bg-dark-gold-500 hover:bg-dark-gold-600';
        default: return 'bg-gray-500 hover:bg-gray-600';
      }
    };

    return (
      <Card className={cn("w-full relative overflow-hidden transition-all duration-300 shadow-lg border-2 h-full flex flex-col", getBorderColor())}>
        <div className={cn("absolute inset-0 bg-gradient-to-b opacity-10", getBackgroundColor())} />

        {recommended && (
          <div className="absolute left-0 top-0 overflow-hidden pt-3 pr-3 z-20">
            <div className="relative h-20 w-20">
              <div className="absolute transform -rotate-45 bg-dark-silver-500 text-white font-medium py-1 left-[-40px] top-[12px] w-[170px] text-center text-xs shadow-md">
                الأكثر طلباً
              </div>
            </div>
          </div>
        )}

        {badge && (
          <div className="absolute left-0 top-0 overflow-hidden pt-3 pr-3 z-20">
            <div className="relative h-20 w-20">
              <div className={cn("absolute transform -rotate-45 text-white font-medium py-1 left-[-40px] top-[12px] w-[170px] text-center text-xs shadow-md",
                badge === "سريع" ? "bg-copper-500" : "bg-dark-gold-500")}> {badge}</div>
            </div>
          </div>
        )}

        <CardHeader className={cn("relative z-10 bg-gradient-to-b p-6", getBackgroundColor())}>
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("p-2 rounded-full", getIconColor())}>{icon}</div>
            <CardTitle className="text-xl font-bold text-black-700">{title}</CardTitle>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className={cn("text-3xl font-bold", getPriceColor())}>{price}</span>
            <span className="text-md font-bold text-black-500 mr-1">ريال / {researchCount} {researchCount === 1 ? 'بحث' : 'أبحاث'}</span>
          </div>
          {bonusCount > 0 && (
            <div className="mt-4">
              <BonusDisplay bonusCount={bonusCount} color={color} savingsAmount={bonusCount * 10} />
            </div>
          )}
        </CardHeader>

        <CardContent className="relative z-10 pt-4 pb-2 flex-grow">
          <p className="text-sm text-gray-500 mb-4 font-medium">جميع المزايا تشمل:</p>
          <ul className="space-y-3 min-h-[140px]">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="relative z-10 pt-2 pb-6 mt-auto">
          <Button 
            className={cn("w-full gap-2 font-medium transition-all shadow-md hover:shadow-lg", getButtonColor())} 
            onClick={() => onSelectPlan(price, title)} // Fixed: Now correctly passes both price and title
          >
            <CreditCard className="mr-2 h-4 w-4" /> 
            اختر هذه الباقة
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-bahthali-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-2">اختر الباقة المناسبة لك</h2>
          <div className="w-24 h-1 bg-bahthali-500 mx-auto mb-6 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingPlan 
              key={index} 
              {...plan} 
              onSelectPlan={handleSelectPlan} // Fixed: Pass the handler function
            />
          ))}
        </div>
      </div>
      
      {/* Moyasar Checkout Dialog */}
      {selectedPlan && (
        <MoyasarCheckout
          isOpen={showCheckout}
          onClose={handleCloseCheckout}
          amount={selectedPlan.amount}
          planTitle={selectedPlan.title}
          userId={user?.id || ''}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </section>
  );
};

export default PricingPlans;