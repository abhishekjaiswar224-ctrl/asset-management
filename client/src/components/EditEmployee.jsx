import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';
import EditEmployeeForm from './EditEmployeeForm';
import useEmployeeStore from '../utils/employeeStore';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEmployeeById } = useEmployeeStore();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const data = await getEmployeeById(id);
        setEmployee(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching employee:", err);
        setError("Failed to load employee information.");
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id, getEmployeeById]);

  const handleSaveComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6 p-4">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center mr-4 text-purple-600 hover:text-purple-800 transition-colors"
            >
              <ArrowLeft size={18} className="mr-1" />
              <span className="font-medium">Back to List</span>
            </button>
            <h2 className="text-xl font-bold text-gray-800">Edit Employee</h2>
          </div>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm"
          >
            Cancel
          </button>
        </div>
      
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-gray-50 rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-700"></div>
            <span className="ml-3 text-lg text-purple-700">Loading employee information...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <strong className="font-bold">Error!</strong>
              <span className="ml-2"> {error}</span>
            </div>
          </div>
        ) : !employee ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Employee not found.</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl">
            <EditEmployeeForm employeeData={employee} isAdminEdit={true} onSaveComplete={handleSaveComplete} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditEmployee;
