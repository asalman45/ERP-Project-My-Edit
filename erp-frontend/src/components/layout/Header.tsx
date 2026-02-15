import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Search, Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();

  const initials = useMemo(() => {
    if (!user?.name) return 'AD';
    return user.name
      .split(' ')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }, [user?.name]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-white/40 rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-md"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </Button>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-300 group-focus-within:text-blue-500" />
            <input
              type="text"
              placeholder="Search across all modules..."
              className="w-full pl-12 pr-4 py-3 bg-white/60 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/70 focus:bg-white/80 shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* Right side - User Profile */}
        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs uppercase tracking-wide text-gray-400">Welcome</span>
            <span className="text-sm font-semibold text-gray-800">
              {user?.name ?? 'Administrator'}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="relative p-2 hover:bg-white/40 rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-md group">
            <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs text-white flex items-center justify-center shadow-sm">
              3
            </span>
          </Button>
          
          <div className="flex items-center space-x-3 bg-white/50 rounded-xl p-2 hover:bg-white/70 transition-all duration-300 hover:shadow-md border border-white/30">
            <Avatar className="w-10 h-10 border-2 border-white/50 shadow-sm">
              <AvatarImage src="/api/placeholder/40/40" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-800">{user?.name ?? 'Administrator'}</p>
              <p className="text-xs text-gray-500">{user?.role ?? 'Administrator'}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 hover:bg-white/40 rounded-lg transition-all duration-300 hover:scale-110"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
export { Header };