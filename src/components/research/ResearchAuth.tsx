import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, LogIn, FileText, Gift, Users, Star, Shield } from 'lucide-react';
import { useResearchCost } from '@/hooks/useResearchCost';

const ResearchAuth = () => {
  const { researchCost } = useResearchCost();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error('Google login error:', error.message);
      }
    } catch (error) {
      console.error('Error during Google login:', error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Gift Banner */}
<div className="bg-gradient-to-r from-bahthali-500 to-bahthali-700 text-white p-4 rounded-md border border-bahthli-200 shadow-md backdrop-blur-sm animate-fade-in">
  <div className="flex items-center justify-center gap-2 text-center">
    <div>
      <div className="font-bold text-lg text-white drop-shadow-sm">مرحبا بك في بحثي</div>
    </div>
  </div>
</div>

      <Card className="bg-white shadow-xl border-bahthali-100 overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-bahthali-50/20 to-transparent pointer-events-none"></div>
        
        <CardHeader className="text-center relative z-10 pb-4">
          <CardTitle className="text-2xl font-bold text-bahthali-700 mb-2">
            {researchCost === 0 
              ? "ابدأ رحلتك الأكاديمية معنا مجاناً"
              : "انضم الآن واحصل على 10 ريال 😍"
            }
          </CardTitle>
          <CardDescription className="text-gray-800 text-base">
            {researchCost === 0 
              ? "اكتشف قوة البحث العلمي المدعوم بالذكاء الاصطناعي"
              : "بحث مجاني كامل في انتظارك - بدون أي التزامات مالية"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-8 py-4 relative z-10">
          {/* Google Login Button */}
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full border-2 border-gray-200 py-6 flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-bahthali-300 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="font-semibold">
                {researchCost === 0 
                  ? "سجل مجاناً وابدأ البحث فوراً" 
                  : "سجل الآن و ابدا البحث فوراً"
                }
              </span>
            </Button>
          </div>
        </CardContent>

        {/* Footer with additional encouragement */}
        <CardFooter className="bg-gray-50/50 text-center py-4 relative z-10">
          <div className="w-full">
            <p className="text-xs text-gray-800 mb-2">
              🔑 معلوماتك آمنة ومحمية | 🕒 تفعيل فوري للحساب
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResearchAuth;
