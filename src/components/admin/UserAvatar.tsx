
import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  avatarUrl: string | null;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ avatarUrl }) => {
  return (
    <>
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt="Avatar" 
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-gray-500" />
        </div>
      )}
    </>
  );
};

export default UserAvatar;
