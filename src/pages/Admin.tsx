import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      // التحقق من تسجيل الدخول
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('User not logged in, redirecting to home');
        navigate('/');
        return;
      } else {
        console.log('User logged in:', user.id, user.email);
      }

      console.log('Admin page: Checking admin status for user:', user.id, user.email);

      // Check if user is admin by email first (immediate check)
      if (user.email === 'imvuveteran@gmail.com' || user.email === 'cherifhoucine91@gmail.com') {
        console.log('User is admin by email:', user.email);
        setIsAdmin(true);
        return;
      }

      // التحقق من صلاحيات المسؤول في قاعدة البيانات
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin status:', error);
        // If there's an error but user has admin email, still allow access
        if (user.email === 'imvuveteran@gmail.com' || user.email === 'cherifhoucine91@gmail.com') {
          console.log('Database error but user has admin email, allowing access');
          setIsAdmin(true);
          return;
        }
        setIsAdmin(false);
        navigate('/');
        return;
      }
      
      console.log('Admin page: Admin check result:', data);
      
      if (!data) {
        console.log('User is not an admin in database, redirecting to home');
        navigate('/');
        return;
      }
      
      setIsAdmin(true);
    };

    checkAdminStatus();
  }, [navigate]);

  if (isAdmin === null) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto py-8 px-4 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-bahthali-500 mx-auto mb-4" />
            <p className="text-gray-600">جاري التحقق من صلاحيات الإدارة...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-8 px-4">
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default Admin;