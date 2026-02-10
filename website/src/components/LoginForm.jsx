import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { apiFetch } from '../lib/api';
import { googleSignIn } from '../lib/firebase';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    phoneOrEmail: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    
    try {
      const result = await googleSignIn();
      const user = result.user;
      
      // Get ID token from Google sign-in
      const idToken = await user.getIdToken();
      
      // Check if user exists in backend by calling session endpoint
      try {
        const resp = await apiFetch('/api/auth/session', {
          method: 'POST',
          requireAuth: false,
          body: { idToken },
        });
        
        console.log('User found in backend:', resp);
        
        // Save auth data
        localStorage.setItem('authToken', idToken);
        localStorage.setItem('uid', resp.uid);
        
        // Navigate to dashboard
        navigate('/dashboard');
      } catch (sessionError) {
        // If session endpoint fails, user doesn't exist in backend
        console.error('User not found in backend:', sessionError);
        setError('No account found with this Google account. Please sign up first.');
        
        // Sign out from Firebase
        const { signOut } = await import('../lib/firebase');
        await signOut();
      }
    } catch (err) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // User closed popup, ignore
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Form data:', { phoneOrEmail: formData.phoneOrEmail, password: '***' });
      
      const resp = await apiFetch('/api/users/login', {
        method: 'POST',
        requireAuth: false,
        body: {
          phoneOrEmail: formData.phoneOrEmail,
          password: formData.password,
        },
      });

      console.log('Login response:', resp);

      // Save token + uid for later API calls
      localStorage.setItem('authToken', resp.token);
      localStorage.setItem('uid', resp.uid);

      // ⚠️ IMPORTANT: We need to authenticate with Firebase Client SDK
      // The backend gives us a token, but we need to sign in with Firebase client
      console.log('Authenticating with Firebase...');
      
      // Import Firebase auth functions
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { appAuth } = await import('../lib/firebase');
      
      try {
        // If phone number was used, we need to get the email from the response
        // For now, let's try with the original input, but we might need to modify this
        const emailToUse = formData.phoneOrEmail.includes('@') 
          ? formData.phoneOrEmail 
          : resp.email || formData.phoneOrEmail; // Use email from response if available
          
        console.log('Attempting Firebase sign-in with email:', emailToUse);
        
        // Sign in with Firebase to sync authentication state
        const userCredential = await signInWithEmailAndPassword(
          appAuth, 
          emailToUse,
          formData.password
        );
        console.log('Firebase authentication successful:', userCredential.user.uid);
      } catch (firebaseError) {
        console.error('Firebase authentication failed:', firebaseError);
        // Continue anyway since backend auth succeeded
      }

      console.log('Login successful, waiting for Firebase auth state...');
      
      // Wait a moment for Firebase auth state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check current auth state
      console.log('Current Firebase user after login:', appAuth.currentUser?.uid);
      console.log('Current Firebase user email:', appAuth.currentUser?.email);
      
      console.log('Navigating to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      
      // Handle specific login errors
      if (error.message && (error.message.includes('not found') || error.message.includes('does not exist'))) {
        setFieldErrors({ phoneOrEmail: 'Account does not exist' });
        setError('No account found with this email or phone number. Please check your details or sign up.');
      } else if (error.message && error.message.includes('password')) {
        setFieldErrors({ password: 'Incorrect password' });
        setError('Incorrect password. Please try again.');
      } else if (error.message && error.message.includes('invalid')) {
        setFieldErrors({ phoneOrEmail: 'Invalid email or phone number format' });
        setError('Please enter a valid email address or phone number.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Helper function to get input styling based on field errors
  const getInputClassName = (fieldName) => {
    const baseClass = "appearance-none rounded-xl relative block w-full px-4 py-4 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-all duration-300 backdrop-blur-sm";
    const errorClass = "border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/50 backdrop-blur-sm";
    const normalClass = "border-white/30 focus:ring-green-500 focus:border-green-400 hover:border-green-300 bg-white/20 backdrop-blur-sm";
    
    return `${baseClass} ${fieldErrors[fieldName] ? errorClass : normalClass}`;
  };

  const [currentSlide, setCurrentSlide] = useState(0);
  const images = useMemo(() => [
    { src: new URL('../assets/old-1.jpg', import.meta.url).href, alt: 'Senior using technology' },
    { src: new URL('../assets/old-2.jpg', import.meta.url).href, alt: 'Elderly with digital device' },
    { src: new URL('../assets/old-3.jpg', import.meta.url).href, alt: 'Senior staying connected' },
    { src: new URL('../assets/old-4.jpg', import.meta.url).href, alt: 'Active senior with technology' },
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000); // Change slide every 4 seconds
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex relative overflow-hidden">
      <style>{`
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .glass-effect-strong {
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.5);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
          animation-delay: 4s;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(1.1);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .slide-enter {
          animation: slideIn 1s ease-out;
        }
      `}</style>

      {/* Left Side - Carousel */}
      <div className="hidden lg:flex lg:w-1/2 fixed left-0 top-0 bg-gradient-to-br from-green-600 to-emerald-700 items-center justify-center overflow-hidden h-screen">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Carousel Container */}
        <div className="relative w-full h-full flex items-center justify-center p-12">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                currentSlide === index ? 'opacity-100 slide-enter' : 'opacity-0'
              }`}
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-12">
                <div className="relative w-full max-w-lg">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-auto rounded-3xl shadow-2xl object-cover"
                    style={{ maxHeight: '500px' }}
                  />
                  <div className="absolute -bottom-4 -right-4 w-full h-full bg-white/20 rounded-3xl -z-10"></div>
                </div>
                <div className="mt-8 text-center">
                  <h3 className="text-3xl font-bold text-white mb-3">
                    {index === 0 && "Empowering Senior Health"}
                    {index === 1 && "Stay Connected, Stay Healthy"}
                    {index === 2 && "Technology for Better Living"}
                    {index === 3 && "Your Wellness Journey Starts Here"}
                  </h3>
                  <p className="text-white/90 text-lg">
                    {index === 0 && "Join thousands of seniors living healthier lives"}
                    {index === 1 && "Track your health with ease and confidence"}
                    {index === 2 && "Simple, intuitive tools designed for you"}
                    {index === 3 && "Take control of your health today"}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'bg-white w-8' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative min-h-screen">
        {/* Background decorations (only on right side for mobile) */}
        <div className="absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full opacity-30 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full opacity-30 animate-float-delayed"></div>
        </div>

        <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Enhanced Header Section */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-20 h-20 glass-effect-strong rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow group-hover:scale-110 transition-transform duration-300">
                <img src="/livewell-logo.svg" alt="LiveWell Logo" className="w-12 h-12" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600 font-medium">
            Sign in to continue your health journey
          </p>
        </div>

        {/* Enhanced Login Card */}
        <div className="glass-effect-strong rounded-2xl shadow-2xl p-8 border border-white/30 card-hover">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phoneOrEmail" className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <i className="fi fi-sr-envelope text-green-600 mr-2"></i>
                Phone Number or Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fi fi-sr-envelope text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                </div>
                <input
                  id="phoneOrEmail"
                  name="phoneOrEmail"
                  type="text"
                  required
                  className={`${getInputClassName('phoneOrEmail')} pl-12`}
                  placeholder="Enter your email or phone"
                  value={formData.phoneOrEmail}
                  onChange={handleInputChange}
                />
              </div>
              {fieldErrors.phoneOrEmail && (
                <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50/50 rounded-lg p-2">
                  <i className="fi fi-sr-exclamation-circle mr-2"></i>
                  {fieldErrors.phoneOrEmail}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <i className="fi fi-sr-lock text-green-600 mr-2"></i>
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fi fi-sr-lock text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={`${getInputClassName('password')} pl-12`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50/50 rounded-lg p-2">
                  <i className="fi fi-sr-exclamation-circle mr-2"></i>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Enhanced Remember Me & Forgot Password */}
            <div className="flex items-center justify-between bg-white/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-white/30 rounded bg-white/20"
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-gray-800">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-semibold text-green-600 hover:text-green-500 transition-colors duration-300 hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>

            {error && (
              <div className="bg-red-50/80 border border-red-200/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fi fi-sr-exclamation-triangle text-red-500"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Button
                type="submit"
                variant="green"
                className="w-full"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/40 backdrop-blur-sm text-gray-600 font-medium">Or</span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {googleLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">Signing in...</span>
                  </div>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Sign in with Google</span>
                  </>
                )}
              </button>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleBack}
                disabled={loading || googleLoading}
              >
                <i className="fi fi-sr-arrow-left mr-2"></i>
                Back to Home
              </Button>
            </div>
          </form>

          {/* Enhanced Divider */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30"></div>
              </div>

            </div>
          </div>

          {/* Enhanced Sign Up Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/user-details')}
              className="group text-green-600 hover:text-green-500 font-semibold transition-all duration-300 hover:underline flex items-center justify-center mx-auto"
            >
              <i className="fi fi-sr-user-plus mr-2 group-hover:scale-110 transition-transform duration-300"></i>
              Create your free account
            </button>
          </div>
        </div>

        {/* Enhanced Trust Indicators */}
        <div className="text-center">
          <div className="glass-effect rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center group">
                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-2 group-hover:scale-110 transition-transform duration-300">
                  <i className="fi fi-sr-shield-check text-white text-xs"></i>
                </div>
                <span className="font-semibold text-gray-700 whitespace-nowrap">Secure Login</span>
              </div>
              <div className="flex items-center group">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mr-2 group-hover:scale-110 transition-transform duration-300">
                  <i className="fi fi-sr-lock text-white text-xs"></i>
                </div>
                <span className="font-semibold text-gray-700 whitespace-nowrap">Privacy Protected</span>
              </div>
              <div className="flex items-center group">
                <div className="w-6 h-6 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full flex items-center justify-center mr-2 group-hover:scale-110 transition-transform duration-300">
                  <i className="fi fi-sr-heart text-white text-xs"></i>
                </div>
                <span className="font-semibold text-gray-700 whitespace-nowrap">Health Focused</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

