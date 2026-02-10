import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import FloatingNavbar from '../../components/FloatingNavbar';
import { QUIZZES } from '../../constants/quizzes';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../auth/AuthProvider';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('Profile');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Home') {
      navigate('/dashboard');
    } else if (tab === 'Chat') {
      navigate('/chat');
    } else if (tab === 'Health') {
      navigate('/health');
    } else if (tab === 'Goals') {
      navigate('/goals');
    }
  };

  // User data state
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    displayName: ''
  });

  const [healthData, setHealthData] = useState({
    medicalConditions: '',
    allergies: {},
    dietaryPreferences: {},
    height: '',
    heightUnit: 'cm',
    heightInches: 0,
    weight: 0,
    diabetic: false,
    hydrationTarget: 8
  });

  const [editedData, setEditedData] = useState({ ...userData });
  const [editedHealthData, setEditedHealthData] = useState({ ...healthData });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    phone: ''
  });
  const [isAddingEmergency, setIsAddingEmergency] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const previousUserRef = useRef(null);
  
  // Achievements state
  const [achievements, setAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  // Fetch user profile data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [profileResponse, healthResponse] = await Promise.all([
        apiFetch('/api/users/get-data'),
        apiFetch('/api/get-health-info')
      ]);

      if (profileResponse) {
        setUserData(profileResponse);
        setEditedData(profileResponse);
      }

      if (healthResponse && healthResponse.healthInfo) {
        setHealthData(healthResponse.healthInfo);
        setEditedHealthData(healthResponse.healthInfo);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      if (err.message.includes('Authentication required') || err.message.includes('Unauthorized')) {
        setError('Authentication expired. Please log in again.');
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError('Failed to load profile data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch achievements
  const fetchAchievements = async () => {
    try {
      setLoadingAchievements(true);
      
      // First, initialize achievements for existing users
      await apiFetch('/api/achievements/initialize', { method: 'POST' });
      
      // Then fetch all achievements with completion status
      const response = await apiFetch('/api/achievements');
      if (response && response.achievements) {
        setAchievements(response.achievements);
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
    } finally {
      setLoadingAchievements(false);
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return '';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format height for display
  const formatHeight = (height, heightUnit, heightInches) => {
    if (!height) return '';
    if (heightUnit === 'ft') {
      const feet = Math.floor(height);
      const inches = heightInches || 0;
      return `${feet}'${inches}"`;
    }
    return `${height} cm`;
  };

  // Format weight for display
  const formatWeight = (weight) => {
    if (!weight) return '';
    return `${weight} kgs`;
  };

  // Format allergies for display
  const formatAllergies = (allergies) => {
    if (!allergies || typeof allergies !== 'object') return '';
    const allergyList = [];
    if (allergies.nuts) allergyList.push('Nuts');
    if (allergies.dairy) allergyList.push('Dairy');
    if (allergies.shellfish) allergyList.push('Shellfish');
    if (allergies.gluten) allergyList.push('Gluten');
    if (allergies.other) allergyList.push(allergies.other);
    return allergyList.join(', ');
  };

  // Clear state when user changes (logout/login)
  useEffect(() => {
    const currentUserId = user?.uid;
    const previousUserId = previousUserRef.current;
    
    // If user changed (different user logged in), clear all state first
    if (currentUserId && previousUserId && currentUserId !== previousUserId) {
      console.log('Profile: User changed, clearing state for new user:', currentUserId);
      setUserData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dob: '',
        displayName: ''
      });
      setHealthData({
        medicalConditions: '',
        allergies: {},
        dietaryPreferences: {},
        height: '',
        heightUnit: 'cm',
        heightInches: 0,
        weight: 0,
        diabetic: false,
        hydrationTarget: 8
      });
      setEditedData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dob: '',
        displayName: ''
      });
      setEditedHealthData({
        medicalConditions: '',
        allergies: {},
        dietaryPreferences: {},
        height: '',
        heightUnit: 'cm',
        heightInches: 0,
        weight: 0,
        diabetic: false,
        hydrationTarget: 8
      });
      setError('');
      setEmergencyContact({
        name: '',
        phone: ''
      });
      setIsAddingEmergency(false);
      setSuccessMessage('');
    } else if (!user) {
      // User logged out, clear all state
      console.log('Profile: User logged out, clearing state');
      setUserData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dob: '',
        displayName: ''
      });
      setHealthData({
        medicalConditions: '',
        allergies: {},
        dietaryPreferences: {},
        height: '',
        heightUnit: 'cm',
        heightInches: 0,
        weight: 0,
        diabetic: false,
        hydrationTarget: 8
      });
      setEditedData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dob: '',
        displayName: ''
      });
      setEditedHealthData({
        medicalConditions: '',
        allergies: {},
        dietaryPreferences: {},
        height: '',
        heightUnit: 'cm',
        heightInches: 0,
        weight: 0,
        diabetic: false,
        hydrationTarget: 8
      });
      setError('');
      setEmergencyContact({
        name: '',
        phone: ''
      });
      setIsAddingEmergency(false);
      setSuccessMessage('');
    }
    
    // Update the ref with current user
    previousUserRef.current = currentUserId;
  }, [user]);

  // Load data when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      // Add delay to ensure state clearing happens first
      const timer = setTimeout(() => {
        console.log('Profile: Fetching data for user:', user.uid);
        fetchUserData();
        fetchAchievements();
      }, 200);
      
      return () => clearTimeout(timer);
    } else if (!user && !authLoading) {
      // User is not authenticated, redirect to login
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      // Update profile data
      const profileUpdate = {
        firstName: editedData.firstName,
        lastName: editedData.lastName,
        phone: editedData.phone,
        dob: editedData.dob,
        displayName: `${editedData.firstName} ${editedData.lastName}`.trim()
      };

      // Update health data
      const healthUpdate = {
        uid: userData.uid || user?.uid,
        medicalConditions: editedHealthData.medicalConditions,
        allergies: editedHealthData.allergies,
        dietaryPreferences: editedHealthData.dietaryPreferences,
        height: editedHealthData.height,
        heightUnit: editedHealthData.heightUnit,
        heightInches: editedHealthData.heightInches,
        weight: editedHealthData.weight,
        diabetic: editedHealthData.diabetic,
        hydrationTarget: editedHealthData.hydrationTarget,
        consent: true
      };

      console.log('Saving profile data:', profileUpdate);
      console.log('Saving health data:', healthUpdate);

      // Make API calls
      const [profileResponse, healthResponse] = await Promise.all([
        apiFetch('/api/users', {
          method: 'PATCH',
          body: JSON.stringify(profileUpdate)
        }),
        apiFetch('/api/post-health-info', {
          method: 'POST',
          body: JSON.stringify(healthUpdate)
        })
      ]);

      console.log('Profile update response:', profileResponse);
      console.log('Health update response:', healthResponse);

      // Update local state with the response data
      if (profileResponse) {
        setUserData(profileResponse);
        setEditedData(profileResponse);
      }
      
      if (healthResponse && healthResponse.healthInfo) {
        setHealthData(healthResponse.healthInfo);
        setEditedHealthData(healthResponse.healthInfo);
      }

      setIsEditing(false);
      
      // Show success message
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(`Failed to save changes: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditedData({ ...userData });
    setEditedHealthData({ ...healthData });
    setIsEditing(false);
    setError('');
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear success message when user starts editing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleHealthInputChange = (field, value) => {
    setEditedHealthData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setEmergencyContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddEmergencyContact = () => {
    if (emergencyContact.name && emergencyContact.phone) {
      // For now, just show success message
      alert('Emergency contact added successfully! (Database integration coming soon)');
      setIsAddingEmergency(false);
      setEmergencyContact({ name: '', phone: '' });
    } else {
      alert('Please fill in both name and phone number');
    }
  };

  const handleCancelEmergencyContact = () => {
    setIsAddingEmergency(false);
    setEmergencyContact({ name: '', phone: '' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Authenticating...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  // If no user after auth loading, redirect will happen in useEffect
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <style jsx>{`
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
      {/* Navbar */}
      <nav className="glass-effect shadow-xl border-b border-white/20 sticky top-0 z-40">
        <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Name */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
              <div className="relative">
                <img src="/livewell-logo.svg" alt="LiveWell Logo" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                LiveWell
              </span>
            </div>
            
            {/* Right side - Profile (already on profile page, so no need for profile button) */}
            <div className="flex space-x-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="group relative bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="transition-transform duration-300 group-hover:scale-110"><i className="fi fi-sr-home"></i></span>
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header - Centered below navbar */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="glass-effect rounded-2xl p-8 shadow-2xl card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Profile</h1>
            <p className="text-gray-600">Manage your personal information and view achievements</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-effect bg-gradient-to-br from-red-50/80 to-red-100/80 border border-red-200/50 rounded-lg p-4 mb-6 shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fi fi-sr-exclamation text-red-400"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="glass-effect bg-gradient-to-br from-green-50/80 to-green-100/80 border border-green-200/50 rounded-lg p-4 mb-6 shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fi fi-sr-check text-green-400"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top Cards Section - Personal Info & Emergency Contact */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Personal Information Card - 70% width */}
          <div className="flex-1 lg:w-[70%] glass-effect rounded-xl p-6 shadow-2xl card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setSuccessMessage('');
                    setError('');
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                    <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.firstName || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.lastName || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                {isEditing ? (
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={editedData.dob}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <span className="flex items-center text-sm text-gray-500">
                      {editedData.dob ? calculateAge(editedData.dob) + ' years' : ''}
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {userData.dob ? `${calculateAge(userData.dob)} years` : 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.email || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.phone || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact Card - 30% width */}
          <div className="lg:w-[30%] glass-effect rounded-xl p-6 shadow-2xl card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Emergency Contact</h2>
            </div>

            {!isAddingEmergency ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fi fi-sr-user-add text-xl text-orange-600"></i>
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-2">Add Emergency Contact</h3>
                <p className="text-sm text-gray-600 mb-4">Add a trusted contact for safety</p>
                <button
                  onClick={() => setIsAddingEmergency(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2 mx-auto text-sm"
                >
                  <i className="fi fi-sr-plus"></i>
                  <span>Add Contact</span>
                </button>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-8">
                  <i className="fi fi-sr-shield-check"></i>
                  <span>For Safety</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={emergencyContact.name}
                    onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="Enter contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={emergencyContact.phone}
                    onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="flex space-x-2 pt-3">
                  <button
                    onClick={handleAddEmergencyContact}
                    className="flex-1 bg-orange-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-orange-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={handleCancelEmergencyContact}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 rounded-lg font-medium hover:bg-gray-400 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Health Information Section */}
        <div className="glass-effect rounded-xl p-6 shadow-2xl card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Health Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
              {isEditing ? (
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={editedHealthData.height}
                    onChange={(e) => handleHealthInputChange('height', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Height"
                  />
                  <select
                    value={editedHealthData.heightUnit}
                    onChange={(e) => handleHealthInputChange('heightUnit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="cm">cm</option>
                    <option value="ft">ft</option>
                  </select>
                  {editedHealthData.heightUnit === 'ft' && (
                    <input
                      type="number"
                      value={editedHealthData.heightInches}
                      onChange={(e) => handleHealthInputChange('heightInches', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Inches"
                      min="0"
                      max="11"
                    />
                  )}
                </div>
              ) : (
                <p className="text-gray-900">
                  {formatHeight(healthData.height, healthData.heightUnit, healthData.heightInches) || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
              {isEditing ? (
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={editedHealthData.weight}
                    onChange={(e) => handleHealthInputChange('weight', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Weight"
                  />
                  <span className="flex items-center text-sm text-gray-500">kgs</span>
                </div>
              ) : (
                <p className="text-gray-900">{formatWeight(healthData.weight) || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
              {isEditing ? (
                <textarea
                  value={editedHealthData.medicalConditions}
                  onChange={(e) => handleHealthInputChange('medicalConditions', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter any medical conditions"
                />
              ) : (
                <p className="text-gray-900">{healthData.medicalConditions || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editedHealthData.allergies.nuts || false}
                        onChange={(e) => handleHealthInputChange('allergies', {
                          ...editedHealthData.allergies,
                          nuts: e.target.checked
                        })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">Nuts</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editedHealthData.allergies.dairy || false}
                        onChange={(e) => handleHealthInputChange('allergies', {
                          ...editedHealthData.allergies,
                          dairy: e.target.checked
                        })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">Dairy</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editedHealthData.allergies.shellfish || false}
                        onChange={(e) => handleHealthInputChange('allergies', {
                          ...editedHealthData.allergies,
                          shellfish: e.target.checked
                        })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">Shellfish</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editedHealthData.allergies.gluten || false}
                        onChange={(e) => handleHealthInputChange('allergies', {
                          ...editedHealthData.allergies,
                          gluten: e.target.checked
                        })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">Gluten</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={editedHealthData.allergies.other || ''}
                    onChange={(e) => handleHealthInputChange('allergies', {
                      ...editedHealthData.allergies,
                      other: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Other allergies"
                  />
                </div>
              ) : (
                <p className="text-gray-900">{formatAllergies(healthData.allergies) || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="glass-effect rounded-xl p-6 shadow-2xl card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Achievements & Rewards</h2>
            <button
              onClick={() => setShowAllAchievements(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              View All
            </button>
          </div>
          
          {loadingAchievements ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : achievements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <i className="fi fi-sr-trophy text-4xl mb-4"></i>
              <p>No achievements yet. Complete challenges to earn rewards!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {achievements.slice(0, 4).map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`glass-effect rounded-lg p-4 border relative card-hover shadow-lg hover:shadow-xl transition-all ${
                    achievement.completed
                      ? 'bg-gradient-to-br from-green-50/80 to-green-100/80 border-green-300/50'
                      : 'bg-gradient-to-br from-gray-50/80 to-gray-100/80 border-gray-300/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-3xl">
                      <i className={`${achievement.icon} ${achievement.completed ? 'text-green-600' : 'text-gray-400'}`}></i>
                    </div>
                    <div className="text-2xl">{achievement.badge}</div>
                  </div>
                  <h3 className={`font-semibold mb-2 ${achievement.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-sm mb-3 ${achievement.completed ? 'text-gray-700' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      achievement.completed 
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-gray-100 text-gray-500 border-gray-300'
                    }`}>
                      {achievement.category}
                    </span>
                    {achievement.completed && (
                      <span className="text-xs text-green-600 font-semibold">
                        +{achievement.points} pts
                      </span>
                    )}
                  </div>
                  {achievement.completed && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-500 rounded-full p-1">
                        <i className="fi fi-sr-check text-white text-xs"></i>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View All Achievements Modal */}
      {showAllAchievements && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">All Achievements</h2>
                <p className="text-green-100 text-sm">
                  {achievements.filter(a => a.completed).length} of {achievements.length} completed
                </p>
              </div>
              <button
                onClick={() => setShowAllAchievements(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <i className="fi fi-sr-cross text-xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Completed Achievements */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="fi fi-sr-check-circle text-green-600 mr-2"></i>
                  Completed ({achievements.filter(a => a.completed).length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.filter(a => a.completed).map((achievement) => (
                    <div 
                      key={achievement.id}
                      className="bg-gradient-to-br from-green-50 to-green-100 border border-green-300 rounded-lg p-4 relative"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl">
                          <i className={`${achievement.icon} text-green-600`}></i>
                        </div>
                        <div className="text-xl">{achievement.badge}</div>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{achievement.title}</h4>
                      <p className="text-sm text-gray-700 mb-3">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full border border-green-300">
                          {achievement.category}
                        </span>
                        <span className="text-xs text-green-600 font-semibold">
                          +{achievement.points} pts
                        </span>
                      </div>
                      {achievement.completedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Completed: {new Date(achievement.completedAt).toLocaleDateString()}
                        </p>
                      )}
                      <div className="absolute top-2 right-2">
                        <div className="bg-green-500 rounded-full p-1">
                          <i className="fi fi-sr-check text-white text-xs"></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locked/Incomplete Achievements */}
              {achievements.filter(a => !a.completed).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i className="fi fi-sr-lock text-gray-500 mr-2"></i>
                    Locked ({achievements.filter(a => !a.completed).length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.filter(a => !a.completed).map((achievement) => (
                      <div 
                        key={achievement.id}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-lg p-4 opacity-60"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-2xl">
                            <i className={`${achievement.icon} text-gray-400`}></i>
                          </div>
                          <div className="text-xl opacity-50">{achievement.badge}</div>
                        </div>
                        <h4 className="font-semibold text-gray-600 mb-1">{achievement.title}</h4>
                        <p className="text-sm text-gray-500 mb-3">{achievement.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full border border-gray-300">
                            {achievement.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {achievement.points} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Navigation Bar */}
      <FloatingNavbar />

      {/* Footer - Full width, positioned below content */}
      <div className="mt-32">
        <Footer />
      </div>
    </div>
  );
};

export default Profile;
