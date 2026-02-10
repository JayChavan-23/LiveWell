import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const FloatingNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      // Clear all localStorage data
      localStorage.clear();
      
      // Call logout function from AuthProvider
      await logout();
      
      // Close modal
      setShowLogoutModal(false);
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if there's an error
      window.location.href = '/';
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowLogoutModal(false);
    }
  };

  const navItems = [
    { path: '/dashboard', icon: 'fi-rr-home', label: 'Home' },
    { path: '/health', icon: 'fi-rr-heart', label: 'Health' },
    { path: '/goals', icon: 'fi-rr-target', label: 'Goals' },
    { path: '/chat', icon: 'fi-rr-comment', label: 'Chat' },
    { path: '/profile', icon: 'fi-rr-user', label: 'Profile' },
  ];

  return (
    <>
      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-300 p-4">
          <div className="flex items-center space-x-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center space-y-2 px-6 py-4 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-green-600 text-white shadow-lg transform -translate-y-1'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <i className={`fi ${item.icon} text-xl`}></i>
                  <span className="text-lg font-bold">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Logout Button */}
            <button
              onClick={handleLogoutClick}
              className="flex flex-col items-center space-y-2 px-6 py-4 rounded-2xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
            >
              <i className="fi fi-sr-sign-out text-3xl"></i>
              <span className="text-lg font-bold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
          onClick={handleLogoutCancel}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border-2 border-gray-200 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-red-300">
                <i className="fi fi-sr-sign-out text-3xl text-red-600"></i>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Confirm Logout
              </h3>
              
              <p className="text-gray-700 mb-7 font-medium text-base">
                Are you sure you want to logout? All your session data will be cleared.
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleLogoutCancel}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all duration-300 shadow-md"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingNavbar;
