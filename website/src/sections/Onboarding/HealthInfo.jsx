import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../auth/AuthProvider';

const HealthInfo = () => {
  const navigate = useNavigate();
  const { updateOnboardingData } = useOnboarding();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null); // store backend user profile

  // 🔹 Local state holds the actual form data
  const [formData, setFormData] = useState({
    diabetic: false,
    allergies: { nuts: false, dairy: false, shellfish: false, gluten: false, other: '' },
    dietaryPreferences: { vegan: false, halal: false, vegetarian: false, keto: false, other: '' },
    medicalConditions: '',
    hydrationTarget: 0,
    height: '',
    heightUnit: 'cm',
    heightInches: '',
    weight: '',
    consent: false,
  });

  // ---------- Handlers ----------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleCheckboxChange = (category, item) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category], [item]: !prev[category][item] },
    }));
  };

  const handleOtherChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category], other: value },
    }));
  };

  const handleHydrationChange = (cups) => {
    setFormData(prev => ({ ...prev, hydrationTarget: cups }));
  };

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const uid = user?.uid;
      if (!uid) throw new Error('No user logged in');

      console.log('🚀 Posting health info:', { uid, ...formData });

      // 🔹 Save to backend
      await apiFetch('/api/post-health-info', {
        method: 'POST',
        body: { uid, ...formData },
      });

      // 🔹 Sync into context after successful save
      updateOnboardingData('healthInfo', formData);

      console.log('✅ Health info saved to backend + context');
      navigate('/frailty-info');
    } catch (err) {
      console.error('Error saving health info:', err);
      setError('Failed to save health info. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderHydrationCups = () => {
    const cups = [];
    for (let i = 1; i <= 10; i++) {
      cups.push(
        <button
          key={i}
          type="button"
          onClick={() => handleHydrationChange(i)}
          className={`w-12 h-16 rounded-lg border-2 transition-all duration-200 ${
            i <= formData.hydrationTarget
              ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
              : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
          }`}
        >
          <div className="text-xs font-medium">{i}</div>
          <div className="text-xs">cup</div>
        </button>
      );
    }
    return cups;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <style jsx>{`
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
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
      
      {/* Enhanced Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full opacity-30 animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full opacity-20 animate-float-slow"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-25 animate-float"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full opacity-30 animate-float-delayed"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Health Information</h2>
          <p className="text-gray-600 font-medium">Help us understand your health needs better</p>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="mb-8">
          <div className="glass-effect rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center group">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <i className="fi fi-sr-check text-white text-sm"></i>
                </div>
                <span className="ml-2 text-sm font-semibold text-green-700">Personal Info</span>
              </div>
              <div className="w-12 h-0.5 bg-gradient-to-r from-green-500 to-green-500"></div>
              <div className="flex items-center group">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-sm font-semibold">2</span>
                </div>
                <span className="ml-2 text-sm font-semibold text-green-700">Health Info</span>
              </div>
              <div className="w-12 h-0.5 bg-gradient-to-r from-green-300 to-gray-300"></div>
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Enhanced Row 1: Diabetic Toggle */}
            <div className="flex items-center justify-between p-6 glass-effect rounded-xl border border-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <i className="fi fi-sr-heart text-green-600 text-xl"></i>
                </div>
                <div>
                  <label className="text-lg font-semibold text-gray-900">Are you Diabetic?</label>
                  <p className="text-sm text-gray-600 mt-1">Please indicate if you have diabetes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleChange('diabetic')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  formData.diabetic ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.diabetic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Row 2: Allergies and Dietary Preferences */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enhanced Allergies */}
              <div className="space-y-4 glass-effect rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-100 to-pink-100 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <i className="fi fi-sr-wheat-awn-circle-exclamation text-red-600 text-lg"></i>
                  </div>
                  <label className="text-lg font-semibold text-gray-900">Allergies</label>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">     
                    <input
                      type="checkbox"
                      checked={formData.allergies.nuts}
                      onChange={() => handleCheckboxChange('allergies', 'nuts')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">Nuts</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.allergies.dairy}
                      onChange={() => handleCheckboxChange('allergies', 'dairy')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">Dairy</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.allergies.shellfish}
                      onChange={() => handleCheckboxChange('allergies', 'shellfish')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">Shellfish</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.allergies.gluten}
                      onChange={() => handleCheckboxChange('allergies', 'gluten')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">Gluten</span>
                  </label>
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Other allergies..."
                    value={formData.allergies.other}
                    onChange={(e) => handleOtherChange('allergies', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Enhanced Dietary Preferences */}
              <div className="space-y-4 glass-effect rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <i className="fi fi-sr-leaf text-green-600 text-lg"></i>
                  </div>
                  <label className="text-lg font-semibold text-gray-900">Dietary Preferences</label>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.dietaryPreferences.vegan}
                      onChange={() => handleCheckboxChange('dietaryPreferences', 'vegan')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">Vegan</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.dietaryPreferences.halal}
                      onChange={() => handleCheckboxChange('dietaryPreferences', 'halal')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">Halal</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.dietaryPreferences.vegetarian}
                      onChange={() => handleCheckboxChange('dietaryPreferences', 'vegetarian')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">Vegetarian</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.dietaryPreferences.keto}
                      onChange={() => handleCheckboxChange('dietaryPreferences', 'keto')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">Keto</span>
                  </label>
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Other dietary preferences..."
                    value={formData.dietaryPreferences.other}
                    onChange={(e) => handleOtherChange('dietaryPreferences', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Row 2.5: Medical Conditions */}
            <div className="space-y-4 glass-effect rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <i className="fi fi-sr-file-medical text-blue-600 text-lg"></i>
                </div>
                <label className="text-lg font-semibold text-gray-900">Medical Conditions</label>
              </div>
              <p className="text-sm text-gray-600 mb-4">Any other medical conditions you would like to declare</p>
              <textarea
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none bg-white/20 backdrop-blur-sm"
                placeholder="Please describe any medical conditions, medications, or health concerns..."
              />
            </div>

            {/* Enhanced Row 3: Hydration Target */}
            <div className="space-y-4 glass-effect rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <i className="fi fi-sr-glass text-cyan-600 text-lg"></i>
                </div>
                <label className="text-lg font-semibold text-gray-900">Daily Hydration Target</label>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                It is recommended to have 7 cups of water daily. 1 cup equals 250ml of water.
              </p>
              <div className="flex justify-center space-x-2 mb-4">
                {renderHydrationCups()}
              </div>
              <div className="text-center text-sm text-gray-600 glass-effect rounded-lg py-3 backdrop-blur-sm">
                Selected: <span className="font-semibold text-green-600">{formData.hydrationTarget} cups</span> ({formData.hydrationTarget * 250}ml)
              </div>
            </div>

            {/* Enhanced Row 4: Height and Weight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 glass-effect rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div>
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fi fi-sr-ruler-vertical text-purple-600 text-sm"></i>
                  </div>
                  <label className="text-sm font-semibold text-gray-700">Height *</label>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    required
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="Height"
                  />
                  <select
                    name="heightUnit"
                    value={formData.heightUnit}
                    onChange={handleInputChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  >
                    <option value="ft">ft</option>
                    <option value="cm">cm</option>
                  </select>
                  {formData.heightUnit === 'ft' && (
                    <input
                      type="number"
                      name="heightInches"
                      value={formData.heightInches}
                      onChange={handleInputChange}
                      min="0"
                      max="11"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="in"
                    />
                  )}
                </div>
                {formData.heightUnit === 'ft' && (
                  <div className="text-xs text-gray-500 mt-1">Height: {formData.height}' {formData.heightInches}"</div>
                )}
              </div>
              <div>
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    <i className="fi fi-sr-scale text-orange-600 text-sm"></i>
                  </div>
                  <label className="text-sm font-semibold text-gray-700">Weight (kg) *</label>
                </div>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  placeholder="Weight in kg"
                />
              </div>
            </div>

            {/* Enhanced Row 5: Consent */}
            <div className="flex items-center justify-between p-6 glass-effect rounded-xl border border-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center flex-1">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <i className="fi fi-sr-shield-check text-green-600 text-xl"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">
                    I consent that all these details will be stored securely and not be shared with anyone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleChange('consent')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ml-4 ${
                  formData.consent ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.consent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Row 6: Next Button */}
            <div className="pt-6">
              <Button
                type="submit"
                variant="green"
                className="w-full text-lg py-4"
                disabled={!formData.consent}
              >
                {!formData.consent ? (
                  'Please accept consent to continue'
                ) : (
                  <div className="flex items-center justify-center">
                    Continue to Assessment
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
                <span className="font-semibold text-gray-700 whitespace-nowrap">Secure Data</span>
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
  );
};

export default HealthInfo;
