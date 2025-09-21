import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ScrollPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    // Check if the popup was previously dismissed
    return localStorage.getItem('popupDismissed') === 'true';
  });

  useEffect(() => {
    const handleScroll = () => {
      // Show popup when user scrolls 50% of the page height
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      
      if (scrollPosition > pageHeight * 0.5 && !isDismissed) {
        setIsVisible(true);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial check in case user loads the page already scrolled
    handleScroll();

    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Store dismissal in localStorage
    localStorage.setItem('popupDismissed', 'true');
  };

  // Don't render if dismissed or not visible
  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-xs">
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">Need Help?</h3>
          <button 
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Our support team is here to help you with any questions or issues you might have.
        </p>
        <div className="flex space-x-2">
          <a 
            href="/support" 
            className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </a>
          <a 
            href="/help" 
            className="flex-1 bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Help Center
          </a>
        </div>
      </div>
    </div>
  );
}
