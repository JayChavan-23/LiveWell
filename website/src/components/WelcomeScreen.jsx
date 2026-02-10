import React from 'react';
import Button from './Button';

const WelcomeScreen = ({ onLogin, onSignup }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to LiveWell
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your health and wellness journey starts here
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={onSignup}
            variant="green"
            className="w-full text-lg py-4"
          >
            Sign Up
          </Button>
          
          <Button
            onClick={onLogin}
            variant="outline"
            className="w-full text-lg py-4"
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
