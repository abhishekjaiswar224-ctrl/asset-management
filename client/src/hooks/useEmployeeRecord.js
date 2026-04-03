import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthstore } from '../utils/authStore';

export const useEmployeeRecord = () => {
  const { user } = useAuthstore();
  const [hasEmployeeRecord, setHasEmployeeRecord] = useState(false);
  const [checkingRecord, setCheckingRecord] = useState(true);
  
  useEffect(() => {
    const checkEmployeeRecord = async () => {
      if (user?.role === 'employee') {
        try {
          setCheckingRecord(true);
          // Use the /me endpoint to check if the employee has a record
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL || ''}/api/employees/me`,
            { withCredentials: true }
          );
          
          // If we get a successful response, the employee has a record
          setHasEmployeeRecord(true);
          setCheckingRecord(false);
        } catch (error) {
          // If we get a 404, the employee doesn't have a record yet
          if (error.response && error.response.status === 404) {
            setHasEmployeeRecord(false);
          } else {
            console.error("Error checking employee record:", error);
          }
          setCheckingRecord(false);
        }
      } else {
        setCheckingRecord(false);
      }
    };
    
    if (user) {
      checkEmployeeRecord();
    } else {
      setCheckingRecord(false);
    }
  }, [user]);

  return { hasEmployeeRecord, checkingRecord };
};
