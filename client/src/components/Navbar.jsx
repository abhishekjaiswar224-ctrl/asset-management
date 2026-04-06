import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PlusCircle, Users, User, Edit, LogOut, Shield, UserCheck, UploadCloud } from "lucide-react";
import { useAuthstore } from '../utils/authStore';
import { useEmployeeRecord } from '../hooks/useEmployeeRecord';

const Navbar = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuthstore();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasEmployeeRecord, checkingRecord } = useEmployeeRecord();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Get tabs based on user role and employee record status
  const getTabs = () => {
    if (!user) return [];
    
    // Admin tabs
    if (user.role === 'admin') {
      return [
        { id: 'form', label: 'Add Employee', icon: <PlusCircle size={18} /> },
        { id: 'table', label: 'Employee List', icon: <Users size={18} /> },
        { id: 'uploads', label: 'Assets Data', icon: <UploadCloud size={18} /> },
      ];
    } 
    // Employee without a record
    else if (user.role === 'employee' && !hasEmployeeRecord) {
      return [
        { id: 'form', label: 'Create My Profile', icon: <PlusCircle size={18} /> },
      ];
    }
    // Employee with a record
    else {
      return [
        { id: 'myInfo', label: 'My Information', icon: <User size={18} /> },
        { id: 'editInfo', label: 'Edit Information', icon: <Edit size={18} /> },
        { id: 'uploads', label: 'Assets Data', icon: <UploadCloud size={18} /> },
      ];
    }
  };

  const tabs = getTabs();

  // Show loading while checking employee record
  if (checkingRecord) {
    return (
      <header className="sticky top-0 z-10 bg-gradient-to-r from-purple-700 to-indigo-800 py-4 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-white">Asset Management</div>
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span className="text-sm text-white">Loading...</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Handle nested routes (view/edit)
  const isNestedRoute = location.pathname.includes('/view/') || location.pathname.includes('/edit/');

  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-purple-700 to-indigo-800 py-4 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white">Asset Management</div>
          
          {!isNestedRoute && (
            <div className="hidden md:flex justify-center">
              <div className="inline-flex p-0 bg-white/20 backdrop-blur-sm rounded-xl shadow-md">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg font-sm transition-all duration-200
                      ${activeTab === tab.id
                        ? 'bg-white text-purple-700 shadow-md transform scale-105'
                        : 'text-white hover:bg-white/10'
                      }
                    `}
                  >
                    {tab.icon}
                    <span className="ml-2">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
            <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium shadow-sm transition-all duration-200 ${
              user?.role === 'admin' 
                ? 'bg-amber-500 text-white hover:bg-amber-600' 
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}>
              {user?.role === 'admin' ? <Shield size={14} /> : <UserCheck size={14} />}
              <span className="hidden md:inline capitalize font-medium">{user?.role}</span>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition-colors shadow-sm"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Logout</span>
            </button>
            
            <button 
              className="md:hidden text-white focus:outline-none"
              onClick={toggleMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && !isNestedRoute && (
          <div className="md:hidden mt-3 p-2 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setIsMenuOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-2 px-4 py-2 mb-1 last:mb-0 rounded-lg text-left transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-white text-purple-700 shadow-md'
                    : 'text-white hover:bg-white/10'
                  }
                `}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
