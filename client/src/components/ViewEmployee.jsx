import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MyInformation from './MyInformation';
import useEmployeeStore from '../utils/employeeStore';

const ViewEmployee = () => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center mr-4 text-purple-600 hover:text-purple-800"
        >
          <ArrowLeft size={18} className="mr-1" />
          Back to List
        </button>
        <h2 className="text-xl font-bold text-gray-800">Employee Details</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
          <span className="ml-3 text-lg text-purple-700">Loading employee information...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : !employee ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <span className="block sm:inline">Employee not found.</span>
        </div>
      ) : (
        <MyInformation employeeData={employee} isAdminView={true} />
      )}
    </div>
  );
};

export default ViewEmployee;
