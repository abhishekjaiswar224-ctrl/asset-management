import axios from 'axios';
import Toast from "../Toast";
import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || '';

export const useAuthstore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isSigningUp: false,
    ischeckingAuth: true,
    isLoggingOut: false,
    isLoggingIn: false,
    
    signup: async (credentials) => {
        set({ isSigningUp: true });
        // credentials should now contain { empId, password, email }
        console.log('Signup credentials being sent:', credentials);
        try {
            const response = await axios.post(`${API_URL}/api/auth/signup`, credentials, { withCredentials: true });
         
            // Set user data directly from the signup response and credentials
            // This avoids the need for an immediate authCheck call
            set({ 
                user: { 
                    userId: response.data.userId, 
                    role: response.data.role,
                    username: credentials.empId,
                    email: credentials.email,
                    emp_id: credentials.empId // Store the empId directly from signup credentials
                }, 
                isAuthenticated: true,
                isSigningUp: false 
            });
            
            Toast.success('Account created successfully');
            return response.data;
        } catch (error) {
            Toast.error(error.response?.data?.message || 'Something went wrong');
            set({ isSigningUp: false, user: null });
            throw error;
        }
    },

    login: async (credentials) => {
        set({ isLoggingIn: true });
        // credentials should now contain { empId, password }
        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, credentials, { withCredentials: true });
            
            // Store all returned user data including emp_id
            set({ 
                user: { 
                    userId: response.data.userId, 
                    role: response.data.role,
                    username: response.data.username, // Keep username if backend returns it
                    email: response.data.email,
                    emp_id: response.data.emp_id  // Store the emp_id from login response
                }, 
                isAuthenticated: true,
                isLoggingIn: false 
            });
            Toast.success('Logged in successfully');
            return response.data;
        } catch (error) {
            set({ isLoggingIn: false, user: null });
            Toast.error(error.response?.data?.message || 'Something went wrong');
            throw error;
        }
    },

    logout: async () => {
        set({ isLoggingOut: true });
        try {
            await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
            set({ user: null, isAuthenticated: false, isLoggingOut: false });
            Toast.success('Logged out successfully');
        } catch (error) {
            Toast.error(error.response?.data?.message || 'Something went wrong');
            set({ isLoggingOut: false });
        }
    },

    authCheck: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/auth/check-auth`, { withCredentials: true });
            
            // Add detailed console log to see all data returned from the server
            console.log('Auth check response data:', response.data);
            
            set({ 
                user: {
                    userId: response.data.userId,
                    role: response.data.role,
                    username: response.data.username,
                    email: response.data.email,
                    emp_id: response.data.emp_id  // Store the emp_id from the check-auth response
                },
                isAuthenticated: true, 
                ischeckingAuth: false 
            });
        } catch (error) {
            console.log('Auth check failed:', error);
            set({ user: null, isAuthenticated: false, ischeckingAuth: false });
        }
    }
}));
