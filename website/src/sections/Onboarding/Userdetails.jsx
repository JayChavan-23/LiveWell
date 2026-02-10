import React, { useState, useEffect, useMemo } from 'react';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { appAuth, googleSignIn } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Userdetails = () => {
  const navigate = useNavigate();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const images = useMemo(() => [
    { src: new URL('../../assets/old-1.jpg', import.meta.url).href, alt: 'Senior using technology' },
    { src: new URL('../../assets/old-2.jpg', import.meta.url).href, alt: 'Elderly with digital device' },
    { src: new URL('../../assets/old-3.jpg', import.meta.url).href, alt: 'Senior staying connected' },
    { src: new URL('../../assets/old-4.jpg', import.meta.url).href, alt: 'Active senior with technology' },
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  // Use context data for form fields
  const formData = {
    firstName: onboardingData.firstName || '',
    lastName: onboardingData.lastName || '',
    phoneNumber: onboardingData.phoneNumber || '',
    dateOfBirth: onboardingData.dateOfBirth || '',
    postcode4: onboardingData.postcode4 || '',
    email: onboardingData.email || '',
    password: onboardingData.password || ''
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    
    try {
      const result = await googleSignIn();
      const user = result.user;
      
      // Extract name from Google profile
      const displayName = user.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Auto-fill form fields from Google account
      updateOnboardingData('userDetails', {
        firstName,
        lastName,
        email: user.email,
      });
      
      setIsGoogleUser(true);
      setError('');
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email. Please use email/password login.');
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

    // Special handling for postcode - only allow numbers
    if (name === 'postcode4') {
      const numericValue = value.replace(/\D/g, '');
      updateOnboardingData('userDetails', { [name]: numericValue });
    } else {
      updateOnboardingData('userDetails', { [name]: value });
    }

    // Real-time password validation
    if (name === 'password' && value.length > 0 && value.length <= 6) {
      setFieldErrors(prev => ({
        ...prev,
        password: 'Password must be longer than 6 characters'
      }));
    } else if (name === 'password' && value.length > 6) {
      // Clear password error if it meets requirements
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setFieldErrors({});

    // Client-side validation
    const validationErrors = {};
    
    // Validate password length (only if not a Google user)
    if (!isGoogleUser && formData.password && formData.password.length <= 6) {
      validationErrors.password = 'Password must be longer than 6 characters';
    }
    
    // If there are validation errors, show them and stop submission
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError('Please fix the errors below before continuing.');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('=== SIGNUP ATTEMPT ===');
      console.log('Form data:', { ...formData, password: '***' });
      console.log('Is Google User:', isGoogleUser);
      
      // Save all form data to context
      updateOnboardingData('userDetails', { ...formData });

      let idToken;
      let uid;

      if (isGoogleUser) {
        // 🔹 For Google users: They're already authenticated, just create backend profile
        console.log('Google user - getting existing token...');
        const currentUser = appAuth.currentUser;
        
        if (!currentUser) {
          throw new Error('Google authentication lost. Please try again.');
        }

        idToken = await currentUser.getIdToken();
        uid = currentUser.uid;

        // First, store the token so the API call can authenticate
        localStorage.setItem('authToken', idToken);
        localStorage.setItem('uid', uid);

        // Call backend to complete Google signup (creates Firestore profile)
        const profileResp = await apiFetch('/api/users/complete-google-signup', {
          method: 'POST',
          requireAuth: true,
          body: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phoneNumber,
            dob: formData.dateOfBirth,
            state: formData.state || undefined,
            suburb: formData.suburb || undefined,
          },
        });

        console.log('Profile created/updated:', profileResp);

      } else {
        // 🔹 For email/password users: Create account in backend
        const signupBody = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phoneNumber,
          email: formData.email,
          password: formData.password,
          dob: formData.dateOfBirth,
          state: formData.state,
          suburb: formData.suburb,
        };
        
        const resp = await apiFetch('/api/auth/signup', {
          method: 'POST',
          requireAuth: false,
          body: signupBody,
        });

        console.log('Signup response:', resp);
        uid = resp.uid;

        // Sign in with Firebase
        console.log('Signing in with Firebase...');
        const userCredential = await signInWithEmailAndPassword(
          appAuth, 
          formData.email, 
          formData.password
        );
        console.log('Firebase sign in successful:', userCredential.user.uid);
        idToken = await userCredential.user.getIdToken();
        
        // Save token + uid in localStorage for auth
        localStorage.setItem('authToken', idToken);
        localStorage.setItem('uid', uid);
      }

      console.log('User signed up + authenticated');
      console.log('Signup successful, navigating to health-info');
      navigate('/health-info'); // go to next onboarding step
    } catch (err) {
      console.error('=== SIGNUP ERROR ===');
      console.error('Error details:', err);
      console.error('Error message:', err.message);
      
      // Handle specific backend errors
      if (err.message && err.message.includes('email')) {
        setFieldErrors({ email: 'This email is already in use' });
        setError('This email is already registered. Please use a different email.');
      } else if (err.message && err.message.includes('phone')) {
        setFieldErrors({ phoneNumber: 'This phone number is already in use' });
        setError('This phone number is already registered. Please use a different phone number.');
      } else if (err.message && err.message.includes('Email already exists')) {
        setFieldErrors({ email: 'This email is already in use' });
        setError('This email is already registered. Please use a different email.');
      } else if (err.message && err.message.includes('Phone already exists')) {
        setFieldErrors({ phoneNumber: 'This phone number is already in use' });
        setError('This phone number is already registered. Please use a different phone number.');
      } else {
        setError('Failed to create account. Please check your details and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get input styling based on field errors and Google auto-fill
  const getInputClassName = (fieldName) => {
    const baseClass = "w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-all duration-300 backdrop-blur-sm";
    const errorClass = "border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/50 backdrop-blur-sm";
    const googleFilledClass = "border-green-300 focus:ring-green-500 focus:border-green-400 bg-green-50/30 backdrop-blur-sm";
    const normalClass = "border-white/30 focus:ring-green-500 focus:border-green-400 hover:border-green-300 bg-white/20 backdrop-blur-sm";
    
    if (fieldErrors[fieldName]) return `${baseClass} ${errorClass}`;
    if (isGoogleUser && (fieldName === 'firstName' || fieldName === 'lastName' || fieldName === 'email')) {
      return `${baseClass} ${googleFilledClass}`;
    }
    return `${baseClass} ${normalClass}`;
  };

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
                    {index === 0 && "Start Your Wellness Journey"}
                    {index === 1 && "Join Our Healthy Community"}
                    {index === 2 && "Technology Made Simple"}
                    {index === 3 && "Your Health, Your Way"}
                  </h3>
                  <p className="text-white/90 text-lg">
                    {index === 0 && "Take the first step towards a healthier life"}
                    {index === 1 && "Connect with thousands living better every day"}
                    {index === 2 && "Easy-to-use tools designed with you in mind"}
                    {index === 3 && "Personalized health tracking at your fingertips"}
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

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative min-h-screen">
        {/* Background decorations (mobile only) */}
        <div className="absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full opacity-30 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full opacity-30 animate-float-delayed"></div>
        </div>

        <div className="max-w-2xl w-full relative z-10">
        {/* Enhanced Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-20 h-20 glass-effect-strong rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow group-hover:scale-110 transition-transform duration-300">
                <img src="/livewell-logo.svg" alt="LiveWell Logo" className="w-12 h-12" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Create Your Account</h2>
          <p className="text-gray-600 font-medium">Let's start with your basic information</p>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="mb-8">
          <div className="glass-effect rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center group">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-sm font-semibold">1</span>
                </div>
                <span className="ml-2 text-sm font-semibold text-green-700">Personal Info</span>
              </div>
              <div className="w-12 h-0.5 bg-gradient-to-r from-green-300 to-gray-300"></div>
              <div className="flex items-center group">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-gray-500 text-sm font-semibold">2</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">Health Info</span>
              </div>
              <div className="w-12 h-0.5 bg-gradient-to-r from-gray-300 to-gray-300"></div>
              <div className="flex items-center group">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-gray-500 text-sm font-semibold">3</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">Assessment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Form Card */}
        <div className="glass-effect-strong rounded-2xl shadow-2xl p-8 border border-white/30 card-hover">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <i className="fi fi-sr-user text-green-600 mr-2"></i>
                  First Name *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fi fi-sr-user text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                  </div>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className={`${getInputClassName('firstName')} pl-12`}
                    placeholder="First Name"
                  />
                </div>
                {fieldErrors.firstName && (
                  <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50/50 rounded-lg p-2">
                    <i className="fi fi-sr-exclamation-circle mr-2"></i>
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <i className="fi fi-sr-user text-green-600 mr-2"></i>
                  Last Name *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fi fi-sr-user text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                  </div>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className={`${getInputClassName('lastName')} pl-12`}
                    placeholder="Last Name"
                  />
                </div>
                {fieldErrors.lastName && (
                  <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50/50 rounded-lg p-2">
                    <i className="fi fi-sr-exclamation-circle mr-2"></i>
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Phone + DOB */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <i className="fi fi-sr-phone-call text-green-600 mr-2"></i>
                  Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fi fi-sr-phone-call text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                  </div>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`${getInputClassName('phoneNumber')} pl-12`}
                    placeholder="Phone Number (Optional)"
                  />
                </div>
                {fieldErrors.phoneNumber && (
                  <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50/50 rounded-lg p-2">
                    <i className="fi fi-sr-exclamation-circle mr-2"></i>
                    {fieldErrors.phoneNumber}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <i className="fi fi-sr-calendar text-green-600 mr-2"></i>
                  Date of Birth * <span className="text-xs text-gray-500 ml-2">(Must be 25+ years old)</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fi fi-sr-calendar text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                  </div>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    max={(() => {
                      const today = new Date();
                      const minAge = 25;
                      const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
                      return maxDate.toISOString().split('T')[0];
                    })()}
                    className={`${getInputClassName('dateOfBirth')} pl-12 cursor-pointer`}
                  />
                </div>
                {fieldErrors.dateOfBirth && (
                  <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50/50 rounded-lg p-2">
                    <i className="fi fi-sr-exclamation-circle mr-2"></i>
                    {fieldErrors.dateOfBirth}
                  </p>
                )}
              </div>
            </div>

            {/* Postcode */}
            <div>
              <label htmlFor="postcode4" className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <i className="fi fi-sr-map-marker text-green-600 mr-2"></i>
                Postcode
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fi fi-sr-map-marker text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                </div>
                <input
                  type="text"
                  id="postcode4"
                  name="postcode4"
                  value={formData.postcode4}
                  onChange={handleInputChange}
                  maxLength="4"
                  className={`${getInputClassName('postcode4')} pl-12`}
                  placeholder="Postcode (Optional)"
                />
              </div>
              {fieldErrors.postcode4 && (
                <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50/50 rounded-lg p-2">
                  <i className="fi fi-sr-exclamation-circle mr-2"></i>
                  {fieldErrors.postcode4}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <i className="fi fi-sr-envelope text-green-600 mr-2"></i>
                Email *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fi fi-sr-envelope text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isGoogleUser}
                  className={`${getInputClassName('email')} pl-12 ${isGoogleUser ? 'cursor-not-allowed' : ''}`}
                  placeholder="Email"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50/50 rounded-lg p-2">
                  <i className="fi fi-sr-exclamation-circle mr-2"></i>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password - Only show for non-Google users */}
            {!isGoogleUser && (
              <div>
                <label htmlFor="password" className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <i className="fi fi-sr-lock text-green-600 mr-2"></i>
                  Password *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fi fi-sr-lock text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className={`${getInputClassName('password')} pl-12`}
                    placeholder="Password"
                  />
                </div>
                {fieldErrors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center bg-red-50/50 rounded-lg p-2">
                    <i className="fi fi-sr-exclamation-circle mr-2"></i>
                    {fieldErrors.password}
                  </p>
                )}
                {!fieldErrors.password && formData.password && formData.password.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600 flex items-center bg-gray-50/50 rounded-lg p-2">
                    <i className={`fi fi-sr-${formData.password.length > 6 ? 'check' : 'exclamation-triangle'} mr-2`}></i>
                    Password strength: {formData.password.length > 6 ? 'Good' : 'Weak'} ({formData.password.length}/7+ characters)
                  </p>
                )}
              </div>
            )}

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

            {/* Google Sign-In Section */}
            {!isGoogleUser && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/40 backdrop-blur-sm text-gray-600 font-medium">Or sign up with</span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
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
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Use Google Account</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Success message for Google users */}
            {isGoogleUser && (
              <div className="bg-green-50/80 border border-green-200/50 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fi fi-sr-check-circle text-green-500"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Google account connected! Please complete the remaining fields below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Button */}
            <div className="pt-6">
              <Button
                type="submit"
                variant="green"
                className="w-full text-lg py-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Continue to Health Info
                    <i className="fi fi-sr-arrow-right ml-2"></i>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Enhanced Trust Indicators */}
        <div className="text-center mt-8">
          <div className="glass-effect rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center group">
                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-2 group-hover:scale-110 transition-transform duration-300">
                  <i className="fi fi-sr-shield-check text-white text-xs"></i>
                </div>
                <span className="font-semibold text-gray-700 whitespace-nowrap">Secure Registration</span>
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
};

export default Userdetails;

