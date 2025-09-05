import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/App';
import { LogIn, Shield, Mail } from 'lucide-react';
import CreditsDisplay from './CreditsDisplay';

const Header = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const { toast } = useToast();
  const [creditsVersion, setCreditsVersion] = useState(0);

  const refreshCredits = useCallback(() => {
    setCreditsVersion(prev => prev + 1);
  }, []);

  useEffect(() => {
    setLoading(false);

    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminCheckComplete(true);
        return;
      }
      
      try {
        console.log('Checking admin status for user:', user.id, user.email, 'in Header component');
        
        // Use RPC function to safely check admin status without RLS issues
        const { data, error } = await supabase.rpc('check_user_admin_status', {
          user_id_param: user.id
        });
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          setAdminCheckComplete(true);
        } else {
          const isUserAdmin = Boolean(data);
          console.log('Admin check result:', data, 'Is admin:', isUserAdmin);
          setIsAdmin(isUserAdmin);
          setAdminCheckComplete(true);
          
          // If the user is an admin, log it clearly
          if (isUserAdmin) {
            console.log('USER IS ADMIN - SHOULD SHOW ADMIN BUTTON');
          }
        }
      } catch (error) {
        console.error('Unexpected error checking admin status:', error);
        setIsAdmin(false);
        setAdminCheckComplete(true);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  // Credits update event listener
  useEffect(() => {
    const handleCreditsUpdated = () => {
      console.log("Credits updated event received");
      refreshCredits();
    };
    
    document.addEventListener('creditsUpdated', handleCreditsUpdated);
    return () => {
      document.removeEventListener('creditsUpdated', handleCreditsUpdated);
    };
  }, [refreshCredits]);

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
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error during Google login:', error);
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="w-full bg-bahthali-100 shadow-sm py-3 sm:py-4">
      <div className="container mx-auto px-3 sm:px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/">
            <h1 className="text-xl sm:text-2xl font-bold text-bahthali-700">
              <span className="text-bahthali-500">سطـــــو</span>
              <span className="text-bahthali-700">ر</span>
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {loading ? (
            <Button variant="outline" size="sm" disabled>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-bahthali-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جاري التحميل...
            </Button>
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Admin Link - Show for admins and also check email directly */}
              {(isAdmin || user.email === 'imvuveteran@gmail.com' || user.email === 'cherifhoucine91@gmail.com') && (
                <Link to="/admin">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 flex items-center gap-1 transition-all duration-200 font-bold"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">الإدارة</span>
                  </Button>
                </Link>
              )}
              
              {/* Credits display */}
              <CreditsDisplay key={`credits-${creditsVersion}`} userId={user.id} isAdmin={isAdmin || user.email === 'imvuveteran@gmail.com' || user.email === 'cherifhoucine91@gmail.com'} />
              
              {/* User profile link with avatar */}
              <Link to="/profile" className="flex items-center gap-2 px-2 py-1 rounded-full border border-bahthali-200 hover:bg-gray-100 bg-bahthali-50 transition-colors">
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full border-2 border-bahthali-200 hover:border-bahthali-400 transition-all" 
                    title="الملف الشخصي" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-bahthali-100 flex items-center justify-center border-2 border-bahthali-200">
                    <Mail className="h-4 w-4 text-bahthali-500" />
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px] text-bahthali-700">
                  {user.user_metadata?.full_name?.split(' ')[0] || 'الملف الشخصي'}
                </span>
              </Link>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-bahthali-500 border-bahthali-200 hover:bg-bahthali-50 flex items-center gap-2" 
              onClick={handleGoogleLogin}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              تسجيل الدخول
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;