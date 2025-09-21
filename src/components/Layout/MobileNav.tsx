import { Link, useLocation } from 'react-router-dom';
import { Home, Send, Users, User, Menu } from 'lucide-react';

interface MobileNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const location = useLocation();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/'
    },
    {
      id: 'send',
      label: 'Send',
      icon: Send,
      path: '/send-money'
    },
    {
      id: 'fundraise',
      label: 'Fundraise',
      icon: Users,
      path: '/fundraising'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile'
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
      path: '/menu'
    }
  ];

  // Determine active tab based on current path if not provided
  const currentActiveTab = activeTab || navItems.find(item =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  )?.id || 'home';

  return (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 pt-4 block md:hidden">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentActiveTab === item.id;

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => onTabChange?.(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-1 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              />
              <span className={`text-xs font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}