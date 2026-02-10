import React, { useState } from 'react';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../auth/AuthProvider';

const FrailtyInfo = () => {
  const navigate = useNavigate();
  const { updateOnboardingData } = useOnboarding();
  const { user } = useAuth();
  const [frailtyScore, setFrailtyScore] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStepsRange = (steps) => {
    if (steps < 2000) return '<2000';
    if (steps <= 4000) return '2000–4000';
    if (steps <= 6000) return '4000–6000';
    if (steps <= 8000) return '6000–8000';
    if (steps <= 10000) return '8000–10000';
    return '>10000';
  };

  // 🔹 Local state for form data
  const [formData, setFormData] = useState({
    moderateMinutes: '',
    vigorousMinutes: '',
    steps: '',
    sedentaryHours: '',
    strengthDays: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateFrailtyScore = () => {
    const moderate = parseInt(formData.moderateMinutes) || 0;
    const vigorous = parseInt(formData.vigorousMinutes) || 0;
    const steps = parseInt(formData.steps) || 0;
    const sedentary = parseInt(formData.sedentaryHours) || 0;
    const strength = parseInt(formData.strengthDays) || 0;

    // 1. MVPA (0–40 pts)
    const mvpaEqDay = moderate + (2 * vigorous);
    const mvpaPts = Math.min(40, (40 * mvpaEqDay) / 120);

    // 2. Steps (0–30 pts)
    let stepsPts = 0;
    if (steps <= 2000) stepsPts = 0;
    else if (steps <= 4000) stepsPts = 10 * (steps - 2000) / 2000;
    else if (steps <= 6000) stepsPts = 10 + (8 * (steps - 4000) / 2000);
    else if (steps <= 8000) stepsPts = 18 + (6 * (steps - 6000) / 2000);
    else if (steps <= 10000) stepsPts = 24 + (4 * (steps - 8000) / 2000);
    else stepsPts = 30;

    // 3. Strength/Balance (0–15 pts)
    let strengthPts = 0;
    if (strength === 0) strengthPts = 0;
    else if (strength === 1) strengthPts = 6;
    else if (strength <= 3) strengthPts = 12;
    else strengthPts = 15;

    // 4. Sedentary hours (0–15 pts)
    let sedentaryPts = 0;
    if (sedentary >= 10) sedentaryPts = 0;
    else if (sedentary >= 8) sedentaryPts = 6;
    else if (sedentary >= 6) sedentaryPts = 6 + (4 * (8 - sedentary) / 2);
    else if (sedentary >= 4) sedentaryPts = 10 + (3 * (6 - sedentary) / 2);
    else sedentaryPts = 15;

    const totalScore = Math.round(mvpaPts + stepsPts + strengthPts + sedentaryPts);
    setFrailtyScore(totalScore);
    return totalScore;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const score = calculateFrailtyScore();

      // Save to context
      updateOnboardingData('frailtyInfo', { ...formData, frailtyScore: score });

      const uid = user?.uid;
      if (!uid) throw new Error('No user logged in');

      // 🔹 Save to backend
      await apiFetch('/api/post-frailty-info', {
        method: 'POST',
        body: { uid, ...formData, frailtyScore: score },
      });

      console.log('✅ Frailty info saved to backend + context');
      navigate('/dashboard', { state: { frailtyScore: score } });
    } catch (err) {
      console.error('Error saving frailty info:', err);
      alert('Error saving frailty info. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Physical Activity Assessment</h2>
          <p className="text-gray-600 font-medium">Help us understand your activity level to calculate your frailty score</p>
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
                  <i className="fi fi-sr-check text-white text-sm"></i>
                </div>
                <span className="ml-2 text-sm font-semibold text-green-700">Health Info</span>
              </div>
              <div className="w-12 h-0.5 bg-gradient-to-r from-green-500 to-green-500"></div>
              <div className="flex items-center group">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-sm font-semibold">3</span>
                </div>
                <span className="ml-2 text-sm font-semibold text-green-700">Assessment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Form Card */}
        <div className="glass-effect-strong rounded-2xl shadow-2xl p-8 border border-white/30 card-hover">

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Enhanced Question 1: Moderate Activity */}
            <div className="space-y-4 glass-effect rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                  <i className="fi fi-sr-walking text-green-600 text-lg"></i>
                </div>
                <div className="flex-1">
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    Yesterday, about how many minutes did you spend walking briskly or doing light exercise?
                  </label>
                  <p className="text-sm text-gray-600 mb-4">(0–180+ minutes)</p>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fi fi-sr-clock text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                    </div>
                    <input
                      type="number"
                      name="moderateMinutes"
                      value={formData.moderateMinutes}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="180"
                      className="w-full px-4 py-3 pl-12 border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/20 backdrop-blur-sm text-gray-800 placeholder-gray-500"
                      placeholder="Enter minutes"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Question 2: Vigorous Activity */}
            <div className="space-y-4 glass-effect rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-red-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                  <i className="fi fi-sr-running text-red-600 text-lg"></i>
                </div>
                <div className="flex-1">
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    Yesterday, about how many minutes did you spend doing more vigorous activity (like jogging, stair climbing, heavy gardening)?
                  </label>
                  <p className="text-sm text-gray-600 mb-4">(0–90+ minutes)</p>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fi fi-sr-clock text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                    </div>
                    <input
                      type="number"
                      name="vigorousMinutes"
                      value={formData.vigorousMinutes}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="90"
                      className="w-full px-4 py-3 pl-12 border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/20 backdrop-blur-sm text-gray-800 placeholder-gray-500"
                      placeholder="Enter minutes"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Question 3: Steps */}
            <div className="space-y-4 glass-effect rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                  <i className="fi fi-sr-shoe-prints text-blue-600 text-lg"></i>
                </div>
                <div className="flex-1">
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    About how many steps did you take yesterday?
                  </label>
                  <p className="text-sm text-gray-600 mb-4">(If unsure, pick a range: &lt;2000, 2000–4000, 4000–6000, 6000–8000, 8000–10000, &gt;10000)</p>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fi fi-sr-shoe-prints text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                    </div>
                    <input
                      type="number"
                      name="steps"
                      value={formData.steps}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 pl-12 border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/20 backdrop-blur-sm text-gray-800 placeholder-gray-500"
                      placeholder="Enter steps"
                    />
                  </div>
                  {formData.steps && (
                    <div className="mt-2 p-3 glass-effect rounded-lg border border-white/30 backdrop-blur-sm">
                      <p className="text-sm text-blue-700 font-medium">
                        <i className="fi fi-sr-info mr-1"></i>
                        Range: {getStepsRange(parseInt(formData.steps))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Question 4: Sedentary Hours */}
            <div className="space-y-4 glass-effect rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                  <i className="fi fi-sr-chair text-orange-600 text-lg"></i>
                </div>
                <div className="flex-1">
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    How many hours were you sitting yesterday (not counting sleep)?
                  </label>
                  <p className="text-sm text-gray-600 mb-4">(0–12+ hours)</p>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fi fi-sr-clock text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                    </div>
                    <input
                      type="number"
                      name="sedentaryHours"
                      value={formData.sedentaryHours}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="12"
                      step="0.5"
                      className="w-full px-4 py-3 pl-12 border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/20 backdrop-blur-sm text-gray-800 placeholder-gray-500"
                      placeholder="Enter hours"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Question 5: Strength/Balance Exercises */}
            <div className="space-y-4 glass-effect rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                  <i className="fi fi-sr-dumbbell-weightlifting text-purple-600 text-lg"></i>
                </div>
                <div className="flex-1">
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    On how many days in the past week did you do strength or balance activities (e.g., light weights, Tai Chi, resistance bands)?
                  </label>
                  <p className="text-sm text-gray-600 mb-4">(0–7 days)</p>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fi fi-sr-calendar text-gray-500 group-focus-within:text-green-600 transition-colors duration-300"></i>
                    </div>
                    <input
                      type="number"
                      name="strengthDays"
                      value={formData.strengthDays}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="7"
                      className="w-full px-4 py-3 pl-12 border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/20 backdrop-blur-sm text-gray-800 placeholder-gray-500"
                      placeholder="Enter days"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
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
                    Calculating Score...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Calculate My Frailty Score
                    <i className="fi fi-sr-calculator ml-2"></i>
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Enhanced Score Display (if calculated) */}
          {frailtyScore !== null && (
            <div className="mt-8 p-8 glass-effect-strong rounded-2xl border border-white/30 shadow-2xl backdrop-blur-sm hover:shadow-3xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse-glow">
                  <i className="fi fi-sr-chart-line text-white text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">Your Frailty Score</h3>
                <div className="text-6xl font-bold text-green-600 mb-4">{frailtyScore}/100</div>
                <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold mb-4 ${
                  frailtyScore >= 80 ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' : 
                  frailtyScore >= 60 ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800' : 
                  frailtyScore >= 40 ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800' : 
                  frailtyScore >= 20 ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800' : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
                }`}>
                  {frailtyScore >= 80 ? 'Excellent' : 
                   frailtyScore >= 60 ? 'Good' : 
                   frailtyScore >= 40 ? 'Fair' : 
                   frailtyScore >= 20 ? 'Poor' : 'Very Poor'}
                </div>
                <p className="text-gray-600 mb-6 font-medium">
                  {frailtyScore >= 80 ? 'Great job! You have excellent physical activity levels.' : 
                   frailtyScore >= 60 ? 'Good work! You have healthy activity levels.' : 
                   frailtyScore >= 40 ? 'Fair activity levels. Consider increasing your daily movement.' : 
                   frailtyScore >= 20 ? 'Low activity levels. Try to incorporate more physical activity.' : 'Very low activity levels. Please consult with a healthcare provider.'}
                </p>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="green"
                  className="px-8 py-3"
                >
                  <div className="flex items-center">
                    Complete Setup
                    <i className="fi fi-sr-arrow-right ml-2"></i>
                  </div>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Trust Indicators */}
        <div className="text-center mt-8">
          <div className="glass-effect rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center group">
                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-2 group-hover:scale-110 transition-transform duration-300">
                  <i className="fi fi-sr-shield-check text-white text-xs"></i>
                </div>
                <span className="font-semibold text-gray-700 whitespace-nowrap">Secure Assessment</span>
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

export default FrailtyInfo;
