import React, { useEffect, useState } from 'react';

const AchievementNotification = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (achievement) {
      // Start enter animation
      setTimeout(() => setIsVisible(true), 50);
      
      // Auto close after 2 seconds
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onClose();
        }, 300); // Wait for exit animation to complete
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] transition-all duration-300 transform ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      style={{ maxWidth: '400px' }}
    >
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-2xl p-6 flex items-center space-x-4 border-2 border-green-400">
        {/* Trophy Animation */}
        <div className="flex-shrink-0 animate-bounce">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl backdrop-blur-sm">
            {achievement.badge || '🏆'}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <i className="fi fi-sr-trophy text-yellow-300"></i>
            <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
          </div>
          <p className="text-white/90 font-semibold text-lg mb-1">
            {achievement.title}
          </p>
          <p className="text-white/75 text-sm">
            {achievement.description}
          </p>
          {achievement.points && (
            <div className="mt-2 flex items-center space-x-1">
              <span className="text-yellow-300 font-bold">+{achievement.points}</span>
              <span className="text-white/75 text-sm">points</span>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onClose(), 300);
          }}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
        >
          <i className="fi fi-sr-cross-small text-2xl"></i>
        </button>
      </div>
    </div>
  );
};

export default AchievementNotification;

