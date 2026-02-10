import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupRecaptcha } from '../lib/firebase';
import { apiFetch } from '../lib/api';
import Button from './Button';

export default function PhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState('phone'); // 'phone' or 'code'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setLoading(true);
    setError('');

    try {
      // Expecting number already in +61… format (let’s not auto-append)
      const result = await setupRecaptcha(phoneNumber);
      setConfirmationResult(result);
      setStep('code');
      console.log('Verification code sent');
    } catch (err) {
      console.error('Error sending code:', err);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode || !confirmationResult) return;
  
    setLoading(true);
    setError('');
  
    try {
      // Verify the code with Firebase
      const credential = await confirmationResult.confirm(verificationCode);
      const user = credential.user;
      console.log('Phone auth successful:', user);
  
      // Get Firebase ID token
      const idToken = await user.getIdToken(true);
  
      // Save token + uid locally
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('uid', user.uid);
  
      // Tell backend to hydrate / fetch profile
      await apiFetch('/api/auth/session', {
        method: 'POST',
        requireAuth: false,
        body: { idToken },
      });
  
      navigate('/dashboard');
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to LiveWell
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your phone number to continue
          </p>
        </div>

        <div id="recaptcha-container"></div>

        {step === 'phone' ? (
          <form onSubmit={handleSendCode} className="mt-8 space-y-6">
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="+61 412 345 678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}

            <Button
              type="submit"
              variant="green"
              className="w-full"
              disabled={loading || !phoneNumber}
            >
              {loading ? 'Sending…' : 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="mt-8 space-y-6">
            <input
              id="code"
              name="code"
              type="text"
              required
              className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength="6"
            />

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setStep('phone')}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="green"
                className="flex-1"
                disabled={loading || !verificationCode}
              >
                {loading ? 'Verifying…' : 'Verify Code'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
