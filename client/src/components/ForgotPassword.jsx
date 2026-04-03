import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Toast from "../Toast";
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState('request'); // 'request', 'verify', 'reset'
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devMode, setDevMode] = useState(false); // For development mode
  const [devOtp, setDevOtp] = useState(''); // To display OTP in UI for testing
  const navigate = useNavigate();
  
  // Store the token in a ref to avoid state timing issues
  const resetTokenRef = React.useRef('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!email) {
      Toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In development mode, capture the response for debugging
      let response;
      if (devMode) {
        response = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/auth/request-reset`, { email }, { 
          validateStatus: () => true // Accept all status codes for debugging
        });
        console.log('Dev mode response:', response);
        // If we can extract the OTP from any console logs (development only)
        const responseData = response.data;
        if (responseData && responseData.devOtp) {
          setDevOtp(responseData.devOtp);
        }
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/auth/request-reset`, { email });
      }
      
      Toast.success('If your account exists, you will receive a verification code via email');
      setStep('verify');
    } catch (error) {
      console.error('Password reset request error:', error);
      Toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!email || !otp) {
      Toast.error('Please enter both email and verification code');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Verifying OTP with data:', { email, otp });
      const response = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/auth/verify-otp`, { email, otp });
      console.log('OTP verification response:', response.data);
      
      if (!response.data.resetToken) {
        console.error('No reset token received in the response');
        Toast.error('Verification failed: No reset token received');
        return;
      }
      
      // Log the token value we received from the backend
      console.log('Reset token received from backend:', response.data.resetToken);
      
      // Store token in both state and ref
      setResetToken(response.data.resetToken);
      resetTokenRef.current = response.data.resetToken;
      
      console.log('Reset token set successfully:', response.data.resetToken);
      console.log('Reset token in ref:', resetTokenRef.current);
      
      // Double check the state was updated correctly
      setTimeout(() => {
        console.log('Reset token in state after update:', resetToken);
        console.log('Reset token in ref after update:', resetTokenRef.current);
      }, 10);
      
      Toast.success('Verification successful');
      setStep('reset');
    } catch (error) {
      console.error('OTP verification error:', error);
      Toast.error(error.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      Toast.error('Please enter and confirm your new password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Log the values being sent to the API for debugging
      console.log('Reset password request data:', {
        email,
        resetToken: resetTokenRef.current,
        tokenFromState: resetToken,
        newPassword: newPassword ? '[PROVIDED]' : '[MISSING]'
      });
      
      await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/auth/reset-password`, {
        email,
        resetToken: resetTokenRef.current,
        newPassword
      });
      Toast.success('Password reset successful');
      navigate('/login');
    } catch (error) {
      console.error('Password reset error:', error);
      // More detailed error logging
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      Toast.error(error.response?.data?.message || 'Password reset failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to manually set OTP for development purposes
  const setDevModeOtp = (otpValue) => {
    setOtp(otpValue);
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        {/* Development mode toggle - only visible in development environment */}
        {import.meta.env.DEV && (
          <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 rounded">
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={devMode}
                  onChange={(e) => setDevMode(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Developer Testing Mode</span>
              </label>
              {devMode && (
                <button 
                  onClick={() => setDevModeOtp('123456')} 
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded"
                >
                  Use Test OTP
                </button>
              )}
            </div>
            
            {/* Display manually entered OTP for testing */}
            {devMode && devOtp && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-center">
                <p className="text-xs text-gray-600 mb-1">Development OTP:</p>
                <p className="font-mono text-base font-bold">{devOtp}</p>
                <button 
                  onClick={() => setDevModeOtp(devOtp)} 
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded mt-1"
                >
                  Use This OTP
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'request' && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Forgot Password</h2>
            <p className="mb-4 text-gray-600 text-center">
              Enter your email address and we'll send you a verification code to reset your password.
            </p>
            <form onSubmit={handleRequestReset}>
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email address"
                />
              </div>
              <button 
                type="submit" 
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
            <p className="mt-4 text-center text-gray-600">
              Remember your password? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
            </p>
          </>
        )}

        {step === 'verify' && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Verify Code</h2>
            <p className="mb-4 text-gray-600 text-center">
              We've sent a verification code to your email. Please enter it below.
            </p>
            {/* Development note when emails aren't being sent */}
            {devMode && (
              <div className="mb-4 p-2 bg-orange-100 border border-orange-300 rounded">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> Email delivery is currently disabled. Please check server logs for the OTP or use the test OTP.
                </p>
              </div>
            )}
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-6">
                <label htmlFor="otp" className="block text-gray-700 font-medium mb-2">Verification Code:</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter 6-digit code"
                />
              </div>
              <button 
                type="submit" 
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
            <p className="mt-4 text-center text-gray-600">
              Didn't receive a code? <button 
                onClick={handleRequestReset} 
                className="text-blue-500 hover:underline"
                disabled={isSubmitting}
              >
                Resend Code
              </button>
            </p>
            <p className="mt-2 text-center text-gray-600">
              <button 
                onClick={() => setStep('request')} 
                className="text-blue-500 hover:underline"
                disabled={isSubmitting}
              >
                Use a different email
              </button>
            </p>
          </>
        )}

        {step === 'reset' && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Reset Password</h2>
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">New Password:</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your new password"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">Confirm Password:</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your new password"
                />
              </div>
              <button 
                type="submit" 
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;