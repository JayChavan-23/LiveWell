import React, { createContext, useContext, useState } from 'react';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }) => {
  const [onboardingData, setOnboardingData] = useState({
    // User Details
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    suburb: '',
    postcode4: '',
    email: '',
    password: '',
    
    // Health Info
    diabetic: false,
    allergies: {
      nuts: false,
      dairy: false,
      shellfish: false,
      gluten: false,
      other: ''
    },
    dietaryPreferences: {
      vegan: false,
      halal: false,
      vegetarian: false,
      keto: false,
      other: ''
    },
    hydrationTarget: 7,
    height: '',
    heightUnit: 'ft',
    weight: '',
    consent: false,
    
    // Frailty Info
    moderateMinutes: '',
    vigorousMinutes: '',
    steps: '',
    sedentaryHours: '',
    strengthDays: '',
    frailtyScore: null
  });

  const updateOnboardingData = (section, data) => {
    setOnboardingData(prev => ({
      ...prev,
      ...data
    }));
  };

  const clearOnboardingData = () => {
    setOnboardingData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      dateOfBirth: '',
      suburb: '',
      postcode4: '',
      email: '',
      password: '',
      diabetic: false,
      allergies: {
        nuts: false,
        dairy: false,
        shellfish: false,
        gluten: false,
        other: ''
      },
      dietaryPreferences: {
        vegan: false,
        halal: false,
        vegetarian: false,
        keto: false,
        other: ''
      },
      hydrationTarget: 7,
      height: '',
      heightUnit: 'ft',
      weight: '',
      consent: false,
      moderateMinutes: '',
      vigorousMinutes: '',
      steps: '',
      sedentaryHours: '',
      strengthDays: '',
      frailtyScore: null
    });
  };

  const value = {
    onboardingData,
    updateOnboardingData,
    clearOnboardingData
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
