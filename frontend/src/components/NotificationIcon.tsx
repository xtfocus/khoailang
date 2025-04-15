import { useState, useEffect } from 'react';
import { HiBell } from 'react-icons/hi2';

interface Notification {
  id: number;
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function NotificationIcon() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addNotification = (message: string) => {
    const newNotification = {
      id: Date.now(),
      message,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Subscribe to notification events
  useEffect(() => {
    const handleImportSuccess = (event: CustomEvent<{ count: number }>) => {
      addNotification(`Successfully imported ${event.detail.count} words`);
    };

    const handleShareSuccess = (event: CustomEvent<{ count: number }>) => {
      addNotification(`Successfully shared ${event.detail.count} flashcard${event.detail.count > 1 ? 's' : ''}`);
    };

    window.addEventListener('wordImportSuccess' as any, handleImportSuccess);
    window.addEventListener('flashcardShareSuccess' as any, handleShareSuccess);
    
    return () => {
      window.removeEventListener('wordImportSuccess' as any, handleImportSuccess);
      window.removeEventListener('flashcardShareSuccess' as any, handleShareSuccess);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <HiBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="py-2">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">No notifications</p>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.timestamp.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}