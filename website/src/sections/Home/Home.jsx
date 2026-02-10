import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

const Home = () => {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(0);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/user-details');
  };

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? -1 : index);
  };

  const faqData = [
    {
      question: "What is LiveWell?",
      answer: "LiveWell is a comprehensive health platform designed specifically for older adults in Australia to prevent frailty, maintain independence, and improve overall wellness through personalized health tracking and guidance."
    },
    {
      question: "How can I sign up for a free assessment?",
      answer: "You can sign up for a free frailty assessment by clicking the 'Sign Up' button above. This will take you through a simple registration process where we'll collect basic health information."
    },
    {
      question: "What features are included in the free assessment?",
      answer: "The free assessment includes a comprehensive frailty evaluation, personalized health recommendations, access to basic health tracking tools, and a consultation summary report."
    },
    {
      question: "What pricing plans does LiveWell offer?",
      answer: "LiveWell offers various subscription plans starting from basic health tracking to premium packages with AI health coaching, detailed analytics, and priority support."
    },
    {
      question: "Can I upgrade or downgrade my plan at any time?",
      answer: "Yes, you can modify your LiveWell subscription plan at any time. Changes will take effect at the start of your next billing cycle."
    },
    {
      question: "Is LiveWell compatible with other health apps and devices?",
      answer: "Yes, LiveWell integrates with popular health apps and wearable devices, allowing you to sync your health data from multiple sources for a comprehensive view of your wellness."
    },
    {
      question: "How secure is my health data with LiveWell?",
      answer: "LiveWell follows strict Australian privacy laws and healthcare data protection standards. Your health information is encrypted, secure, and never shared without your explicit consent."
    },
    {
      question: "Does LiveWell offer customer support?",
      answer: "Yes, LiveWell provides comprehensive customer support including phone support, live chat, and email assistance. Premium users also get priority support access."
    },
    {
      question: "Can I customize LiveWell to fit my specific health needs?",
      answer: "Yes, LiveWell offers extensive customization options that allow you to tailor the platform to your specific health conditions, goals, and preferences for a personalized experience."
    },
    {
      question: "What kind of training and resources does LiveWell provide?",
      answer: "LiveWell provides comprehensive training videos, user guides, webinars, and one-on-one onboarding sessions to help you get the most out of the platform."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left - LiveWell Logo */}
            <div className="flex items-center space-x-3">
              <img src="/livewell-logo.svg" alt="LiveWell Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-900">LiveWell</span>
            </div>
            
            {/* Center - Navigation Links */}
            <div className="flex items-center space-x-8">
              <a href="#advantages" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">Advantages</a>
              <a href="#faqs" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">FAQ's</a>
            </div>
            
            {/* Right - CTA Button */}
            <button
              onClick={handleSignup}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Download App
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-20 text-center relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full opacity-20"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full opacity-20"></div>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Discover <span className="text-green-600">LiveWell</span>,<br />
              Your Health & Wellness Companion
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
              Comprehensive health tracking, frailty prevention, and wellness management designed specifically for older adults in Australia.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <button
                onClick={handleSignup}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Get Started Free
              </button>
              <button
                onClick={handleLogin}
                className="bg-white text-gray-800 px-10 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-green-300"
              >
                Log In
              </button>
            </div>

            {/* Laptop Mockup with enhanced styling */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-green-50 to-transparent rounded-3xl transform scale-105"></div>
              <img 
                src="/laptop-home.png" 
                alt="LiveWell Platform on Laptop" 
                className="max-w-4xl w-full h-auto mx-auto relative z-10 drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Feature Icons Bar */}
        <div className="relative overflow-hidden rounded-3xl mb-20">
          {/* Background with green gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-green-200/30 via-transparent to-emerald-200/30"></div>
          
          {/* Content */}
          <div className="relative z-10 p-12">
            {/* Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Everything You Need for <span className="text-green-600">Better Health</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Comprehensive health management tools designed specifically for older adults
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { icon: "fi fi-sr-heart", label: "Health Tracking", color: "from-red-400 to-red-500", bgColor: "bg-red-50" },
                { icon: "fi fi-sr-shield-check", label: "Privacy", color: "from-blue-400 to-blue-500", bgColor: "bg-blue-50" },
                { icon: "fi fi-sr-bell", label: "Reminders", color: "from-yellow-400 to-yellow-500", bgColor: "bg-yellow-50" },
                { icon: "fi fi-sr-chart-line", label: "Progress", color: "from-green-400 to-green-500", bgColor: "bg-green-50" },
                { icon: "fi fi-sr-link", label: "Integration", color: "from-purple-400 to-purple-500", bgColor: "bg-purple-50" },
                { icon: "fi fi-sr-settings", label: "Customization", color: "from-gray-400 to-gray-500", bgColor: "bg-gray-50" },
                { icon: "fi fi-sr-comment", label: "AI Chat", color: "from-emerald-400 to-emerald-500", bgColor: "bg-emerald-50" },
                { icon: "fi fi-sr-file-medical", label: "Reports", color: "from-indigo-400 to-indigo-500", bgColor: "bg-indigo-50" },
                { icon: "fi fi-sr-mobile", label: "Dashboard", color: "from-pink-400 to-pink-500", bgColor: "bg-pink-50" },
                { icon: "fi fi-sr-notification", label: "Alerts", color: "from-orange-400 to-orange-500", bgColor: "bg-orange-50" },
                { icon: "fi fi-sr-users", label: "Support", color: "from-cyan-400 to-cyan-500", bgColor: "bg-cyan-50" },
                { icon: "fi fi-sr-book", label: "Resources", color: "from-teal-400 to-teal-500", bgColor: "bg-teal-50" }
              ].map((feature, index) => (
                <div key={index} className="group text-center transform hover:scale-105 transition-all duration-300">
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl ${feature.bgColor} shadow-sm group-hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-white/50`}>
                    <i className={`${feature.icon} text-2xl bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`}></i>
                  </div>
                  <p className="text-gray-700 text-sm font-medium group-hover:text-gray-800 transition-colors duration-300">
                    {feature.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-12">
              <button
                onClick={handleSignup}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Your Health Journey
              </button>
            </div>
          </div>
        </div>

        {/* Discover Features Section */}
        <div id="advantages" className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
              <i className="fi fi-sr-star mr-2"></i>
              Trusted by 10,000+ Australians
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Choose <span className="text-green-600">LiveWell</span>?
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Experience the difference with our comprehensive health platform designed specifically for older adults. From personalized assessments to AI-powered insights, LiveWell empowers you to take control of your health journey.
            </p>
            
            <ul className="space-y-6">
              {[
                { text: "Comprehensive Frailty Assessment for Personalized Prevention", icon: "fi fi-sr-user-check" },
                { text: "AI-Powered Health Coaching for Continuous Guidance", icon: "fi fi-sr-robot" },
                { text: "Customizable Health Dashboards for Tailored Insights", icon: "fi fi-sr-chart-pie" },
                { text: "Seamless Integration with Health Devices and Apps", icon: "fi fi-sr-link" }
              ].map((feature, index) => (
                <li key={index} className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
                    <i className={`${feature.icon} text-green-600 text-xl`}></i>
                  </div>
                  <div>
                    <span className="text-gray-700 text-lg font-medium">{feature.text}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <button
                onClick={handleSignup}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Start Your Free Assessment
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-8 relative overflow-hidden border border-green-100">
              <div className="absolute inset-0 bg-gradient-to-br from-green-200/20 via-emerald-200/20 to-teal-200/20 rounded-3xl"></div>
              <div className="relative z-10">
                <img 
                  src="/laptop.png" 
                  alt="LiveWell Features on Laptop" 
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>
              {/* Floating elements */}
              <div className="absolute top-4 right-4 w-16 h-16 bg-green-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-emerald-500 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faqs" className="mb-20">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <i className="fi fi-sr-question-mark text-2xl text-white"></i>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to commonly asked questions about LiveWell's features, pricing, and support services.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-green-50 transition-colors rounded-xl"
                >
                  <span className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${openFAQ === index ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600 group-hover:bg-green-200'}`}>
                    <i className={`text-sm ${openFAQ === index ? 'fi fi-sr-minus' : 'fi fi-sr-plus'}`}></i>
                  </div>
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-5">
                    <div className="border-t border-green-100 pt-4">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
