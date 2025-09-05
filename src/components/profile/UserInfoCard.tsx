
import React from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, Mail, LogOut, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UserInfoCardProps {
  user: SupabaseUser | null;
  onLogout: () => Promise<void>;
}

const UserInfoCard = ({ user, onLogout }: UserInfoCardProps) => {
  return (
    <div className="mb-8 p-6 bg-gradient-to-tr from-bahthali-50 to-white rounded-xl border border-bahthali-100 shadow-sm hover:shadow-md transition-all duration-300">
      <h3 className="text-xl font-medium text-bahthali-700 mb-5 flex items-center">
        <UserCircle className="ml-2 h-6 w-6" />
        معلوماتك الشخصية
      </h3>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {user?.user_metadata?.avatar_url ? (
            <div className="relative">
              <img 
                src={user.user_metadata.avatar_url} 
                alt="صورة المستخدم" 
                className="w-20 h-20 rounded-full border-2 border-bahthali-200 shadow-sm object-cover"
              />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
            </div>
          ) : (
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-bahthali-100 to-bahthali-200 flex items-center justify-center shadow-sm">
                <User className="h-10 w-10 text-bahthali-500" />
              </div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
            </div>
          )}
          
          <div className="space-y-3">
            <div className={cn(
              "flex items-center gap-2 text-gray-700 bg-white px-4 py-3 rounded-lg",
              "border border-bahthali-100 shadow-sm hover:border-bahthali-200 transition-all duration-300"
            )}>
              <User className="h-5 w-5 text-bahthali-500" />
              <span className="font-semibold">{user?.user_metadata?.full_name || 'غير محدد'}</span>
            </div>
            <div className={cn(
              "flex items-center gap-2 text-gray-700 bg-white px-4 py-3 rounded-lg",
              "border border-bahthali-100 shadow-sm hover:border-bahthali-200 transition-all duration-300"
            )}>
              <Mail className="h-5 w-5 text-bahthali-500" />
              <span className="font-semibold text-sm break-all">{user?.email}</span>
            </div>
          </div>
        </div>
        
        <Button
          variant="destructive"
          className="mt-2 sm:mt-0 flex items-center gap-2 self-start hover:scale-105 transition-transform duration-300 px-5 py-2 h-auto"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
};

export default UserInfoCard;
