import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    // Clear all localStorage data
    localStorage.clear();
    setShowLogoutModal(false);
    navigate('/');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showLogoutModal) {
        handleLogoutCancel();
      }
    };

    if (showLogoutModal) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [showLogoutModal]);

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          {/* Left side - Company info */}
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-3 mb-4">
              <img src="/livewell-logo.svg" alt="LiveWell Logo" className="h-8 w-8" />
              <span className="text-xl font-semibold">LiveWell</span>
            </div>
            <p className="text-gray-400 max-w-md">
              Empowering older Australians to live stronger, healthier lives through innovative health technology and personalized wellness programs.
            </p>
            <div className="text-sm text-gray-500 mt-4">
              © 2024 LiveWell. Made with ❤️ in Australia.
            </div>
          </div>
          
          {/* Right side - Navigation links */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-lg font-semibold mb-3 text-gray-300">Quick Links</h4>
            <Link 
              to="/" 
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Home
            </Link>
            <Link 
              to="/dashboard" 
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Dashboard
            </Link>
            <button 
              onClick={handleLogoutClick}
              className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blur background */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleLogoutCancel}
          ></div>
          
          {/* Modal content */}
          <div className="relative bg-white rounded-xl p-8 max-w-md mx-4 shadow-xl border border-gray-200">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Logout
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 mb-6">
                Are you sure you want to logout? All your session data will be cleared and you'll need to login again.
              </p>
              
              {/* Buttons */}
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={handleLogoutCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
