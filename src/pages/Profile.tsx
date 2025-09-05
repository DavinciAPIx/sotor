
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/App';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserInfoCard from '@/components/profile/UserInfoCard';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { formatDate } from '@/utils/formatters';

interface ResearchItem {
  id: string;
  title: string;
  document_url: string;
  created_at: string;
}

const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [researchHistory, setResearchHistory] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(10);
  const [activeTab, setActiveTab] = useState("research");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to home if not logged in
    if (!user) {
      navigate('/');
      return;
    }

    console.log("Profile: Loading user data for", user?.id);

    // Simulate loading progress for a better UX
    const progressInterval = setInterval(() => {
      setLoadingProgress((prevProgress) => {
        const newProgress = prevProgress + 20;
        return newProgress >= 90 ? 90 : newProgress;
      });
    }, 300);

    // Fetch user's research history
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        
        console.log("Fetching research history");
        const { data: researchData, error: researchError } = await supabase
          .from('research_history')
          .select('id, title, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (researchError) {
          console.error('Error fetching research history:', researchError);
          // If table doesn't exist, just set empty array
          if (researchError.code === '42P01') {
            console.log("Research history table doesn't exist yet, setting empty array");
            setResearchHistory([]);
          } else {
            setLoadError("لم نتمكن من جلب سجل أبحاثك");
            toast({
              title: "خطأ في جلب الأبحاث",
              description: "لم نتمكن من جلب سجل أبحاثك. يرجى المحاولة مرة أخرى.",
              variant: "destructive",
            });
          }
        } else {
          console.log("Research history fetched:", researchData?.length || 0, "items");
          // Transform content to extract document_url
          const transformedData = researchData?.map(item => ({
            id: item.id,
            title: item.title,
            document_url: item.content, // content stores the document URL
            created_at: item.created_at
          })) || [];
          
          setResearchHistory(transformedData);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setLoadError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      } finally {
        setLoadingProgress(100);
        setTimeout(() => {
          setLoading(false);
          clearInterval(progressInterval);
        }, 500);
      }
    };

    fetchUserData();

    return () => clearInterval(progressInterval);
  }, [user, navigate, toast]);

  const handleRefresh = () => {
    setLoading(true);
    setLoadingProgress(10);
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error.message);
        toast({
          title: "خطأ في تسجيل الخروج",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم تسجيل الخروج بنجاح",
          description: "نراك قريبًا!",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء محاولة تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-2xl border-bahthali-200/50">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between">
              <Link to="/">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex items-center gap-1 text-bahthali-500 hover:text-bahthali-700 hover:bg-bahthali-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  العودة
                </Button>
              </Link>
              <CardTitle className="text-xl sm:text-2xl font-bold text-bahthali-700">الملف الشخصي</CardTitle>
              <div className="w-[100px]">
                {loadError && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="text-bahthali-500"
                  >
                    تحديث
                  </Button>
                )}
              </div>
            </div>
            <CardDescription className="text-gray-500 mt-2">
              مرحباً {user?.user_metadata?.full_name || 'بك'} في صفحتك الشخصية
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* User Info Section */}
            <UserInfoCard user={user} onLogout={handleLogout} />
            
            <div className="mt-8">
              {/* Research History */}
              <ProfileTabs 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                loadError={loadError}
                loading={loading}
                loadingProgress={loadingProgress}
                researchHistory={researchHistory}
                formatDate={formatDate}
                handleRefresh={handleRefresh}
              />
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
