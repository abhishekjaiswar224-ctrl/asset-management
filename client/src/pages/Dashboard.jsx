import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import EmpForm from '../EmpForm';
import EmployeeTable from '../components/EmployeeTable';
import MyInformation from '../components/MyInformation';
import EditEmployeeForm from '../components/EditEmployeeForm';
import ViewEmployee from '../components/ViewEmployee';
import EditEmployee from '../components/EditEmployee';
import UploadHistory from './UploadHistory';
import { useAuthstore } from '../utils/authStore';
import { useEmployeeRecord } from '../hooks/useEmployeeRecord';

// Main Dashboard Component
const Dashboard = () => {
  const { user } = useAuthstore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('');
  const { hasEmployeeRecord, checkingRecord } = useEmployeeRecord();
  
  // Set the default active tab based on user role and employee record status
  useEffect(() => {
    if (user && !checkingRecord) {
      // If we're on a specific view/edit page, don't set active tab
      if (location.pathname.includes('/view/') || location.pathname.includes('/edit/')) {
        return;
      }

      if (user.role === 'admin') {
        setActiveTab('form');
      } else if (!hasEmployeeRecord) {
        setActiveTab('form');
      } else {
        setActiveTab('myInfo');
      }
    }
  }, [user, hasEmployeeRecord, checkingRecord, location.pathname]);

  // Handle tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Show loading while checking employee record
  if (checkingRecord) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        <span className="ml-3 text-lg text-purple-700">Loading your profile...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        hasEmployeeRecord={hasEmployeeRecord}
      />
      
      <div className="flex-1 p-4 overflow-auto">
        <Routes>
          <Route path="view/:id" element={<ViewEmployee />} />
          <Route path="edit/:id" element={<EditEmployee />} />
          <Route path="/" element={
            <>
              {activeTab === 'form' && <EmpForm />}
              {activeTab === 'table' && <EmployeeTable />}
              {activeTab === 'myInfo' && <MyInformation />}
              {activeTab === 'editInfo' && <EditEmployeeForm />}
              {activeTab === 'uploads' && <UploadHistory />}
            </>
          } />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
