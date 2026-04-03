import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthstore } from '../utils/authStore';
import { Key, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const AdminAccountCreation = () => {
  const [searchParams] = useSearchParams();
  const empIdFromUrl = searchParams.get('empId');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthstore(); // Removed signup since we'll use axios directly

  // Form state
  const [empId, setEmpId] = useState(empIdFromUrl || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  
  // Check if user is admin, if not redirect to dashboard
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Automatically fetch employee details if empId is provided
  useEffect(() => {
    if (empId) {
      fetchEmployeeDetails(empId);
    }
  }, [empId]);

  const fetchEmployeeDetails = async (id) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || ''}/api/emp/employee/${id}`,
        { withCredentials: true }
      );
      
      if (response.data) {
        setEmployeeData(response.data);
        
        // Check if user account already exists
        try {
          const userResponse = await axios.get(
            `${import.meta.env.VITE_API_URL || ''}/api/auth/user/${id}`,
            { withCredentials: true }
          );
          
          if (userResponse.data) {
            toast.warning(`User account already exists for employee ${response.data.emp_name}`);
          }
        } catch (error) {
          // No user account found is expected, continue with account creation
        }
      }
    } catch (error) {
      // We'll just continue with the provided empId if employee data can't be fetched
      console.error("Could not fetch employee details:", error);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!empId || !password || !email) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the new admin-create-user endpoint instead of signup
      await axios.post(
        `${import.meta.env.VITE_API_URL || ''}/api/auth/admin-create-user`,
        { empId, password, email, role: 'employee' },
        { withCredentials: true }
      );
      
      toast.success(`Account created successfully for ${employeeData?.emp_name || empId}`);
      
      // Reset form
      setPassword('');
      setConfirmPassword('');
      setEmail('');
      
      // Redirect back to the edit employee page if we came from there
      const returnPath = searchParams.get('returnTo');
      if (returnPath && returnPath.startsWith('/dashboard/edit/')) {
        navigate(returnPath);
      } else {
        // Otherwise go back to the dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Account creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} className="mr-1" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Key className="mr-2" />
            Admin: Create Employee Account
          </h2>
        </div>

        <div className="p-6">
          {employeeData && (
            <div className="bg-green-50 p-4 rounded-md border border-green-100 mb-6">
              <h3 className="font-medium text-green-800 mb-1">Employee Found</h3>
              <p className="text-green-700 text-sm">
                Creating account for: <span className="font-semibold">{employeeData.emp_name}</span> (ID: {employeeData.emp_id})
              </p>
            </div>
          )}

          {!employeeData && empId && (
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
              <h3 className="font-medium text-blue-800 mb-1">Creating New Account</h3>
              <p className="text-blue-700 text-sm">
                You are creating a user account for employee with ID: <span className="font-semibold">{empId}</span>
              </p>
            </div>
          )}

          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label htmlFor="empId" className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                id="empId"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-100"
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">Employee ID is read-only</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-green-600 text-white rounded-md ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'
                }`}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAccountCreation;