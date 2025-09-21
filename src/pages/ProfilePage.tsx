import { User, Settings, LogOut, CreditCard, Bell, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">John Doe</h1>
              <p className="text-gray-600">+258 84 123 4567</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          <Link 
            to="/profile/edit" 
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <User className="w-5 h-5 text-gray-700 mr-3" />
            <span>Edit Profile</span>
          </Link>
          
          <Link 
            to="/profile/payment-methods" 
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <CreditCard className="w-5 h-5 text-gray-700 mr-3" />
            <span>Payment Methods</span>
          </Link>
          
          <Link 
            to="/profile/notifications" 
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <Bell className="w-5 h-5 text-gray-700 mr-3" />
            <span>Notifications</span>
          </Link>
          
          <Link 
            to="/profile/settings" 
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <Settings className="w-5 h-5 text-gray-700 mr-3" />
            <span>Settings</span>
          </Link>
          
          <Link 
            to="/help" 
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50"
          >
            <HelpCircle className="w-5 h-5 text-gray-700 mr-3" />
            <span>Help & Support</span>
          </Link>
          
          <button className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 text-red-600">
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
