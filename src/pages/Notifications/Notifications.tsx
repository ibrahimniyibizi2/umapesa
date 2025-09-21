import { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Shield,
  Settings
} from 'lucide-react';

export default function Notifications() {
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      transfers: true,
      security: true,
      marketing: false,
      system: true
    },
    push: {
      transfers: true,
      security: true,
      marketing: false,
      system: false
    },
    sms: {
      transfers: false,
      security: true,
      marketing: false,
      system: false
    }
  });

  const recentNotifications = [
    {
      id: 1,
      type: 'transfer',
      title: 'Transfer Completed',
      message: 'Your transfer of 500 MZN to Maria Santos has been completed successfully.',
      time: '2 minutes ago',
      read: false,
      icon: <CheckCircle className="w-5 h-5 text-green-600" />
    },
    {
      id: 2,
      type: 'security',
      title: 'New Login Detected',
      message: 'A new login was detected from Mozambique. If this wasn\'t you, please secure your account.',
      time: '1 hour ago',
      read: true,
      icon: <Shield className="w-5 h-5 text-blue-600" />
    },
    {
      id: 3,
      type: 'system',
      title: 'Exchange Rate Update',
      message: 'MZN to RWF exchange rate has been updated to 18.45.',
      time: '3 hours ago',
      read: true,
      icon: <DollarSign className="w-5 h-5 text-purple-600" />
    },
    {
      id: 4,
      type: 'transfer',
      title: 'Transfer Received',
      message: 'You received 25,000 RWF from João Silva.',
      time: '1 day ago',
      read: true,
      icon: <Users className="w-5 h-5 text-green-600" />
    }
  ];

  const handleSettingChange = (channel: string, type: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel as keyof typeof prev],
        [type]: value
      }
    }));
  };

  const markAsRead = (id: number) => {
    // In a real app, this would update the backend
    console.log('Marking notification as read:', id);
  };

  const notificationTypes = [
    {
      key: 'transfers',
      label: 'Transfer Updates',
      description: 'Notifications about your money transfers',
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      key: 'security',
      label: 'Security Alerts',
      description: 'Important security notifications',
      icon: <Shield className="w-5 h-5" />
    },
    {
      key: 'marketing',
      label: 'Promotions',
      description: 'Offers, tips, and promotional content',
      icon: <AlertCircle className="w-5 h-5" />
    },
    {
      key: 'system',
      label: 'System Updates',
      description: 'App updates and maintenance notices',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Manage your notification preferences</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
          </div>

          <div className="p-4">
            {notificationTypes.map((type) => (
              <div key={type.key} className="mb-6 last:mb-0">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                    {type.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{type.label}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>

                <div className="ml-11 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Email</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.email[type.key as keyof typeof notificationSettings.email]}
                        onChange={(e) => handleSettingChange('email', type.key, e.target.checked)}
                        aria-label={`Email notifications for ${type.label}`}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Push</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.push[type.key as keyof typeof notificationSettings.push]}
                        onChange={(e) => handleSettingChange('push', type.key, e.target.checked)}
                        aria-label={`Push notifications for ${type.label}`}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">SMS</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings.sms[type.key as keyof typeof notificationSettings.sms]}
                        onChange={(e) => handleSettingChange('sms', type.key, e.target.checked)}
                        aria-label={`SMS notifications for ${type.label}`}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {notification.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">{notification.title}</h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <div className="flex items-center space-x-1 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{notification.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Bell className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Stay Informed</h3>
              <p className="text-sm text-blue-700">
                Enable notifications to stay updated on your transfers, security alerts,
                and important account information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}