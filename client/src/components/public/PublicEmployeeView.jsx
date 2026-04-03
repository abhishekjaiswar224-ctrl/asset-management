import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Package } from 'lucide-react';

const PublicEmployeeView = () => {
  const { token } = useParams();
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || ''}/api/employees/public/${token}`);
        setEmployeeData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching public employee information:", err);
        setError("Failed to load employee information. The link may be invalid.");
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [token]);

  // Helper function to get asset icon
  const getAssetIcon = (assetItem) => {
    return <Package size={20} className="text-purple-500" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        <span className="ml-3 text-lg text-purple-700">Loading information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="max-w-3xl mx-auto mt-10 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">No employee information found.</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto mt-10 bg-white rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Employee Information: {employeeData.emp_name}</h2>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Employee Details */}
            <div className="bg-purple-50 rounded-lg p-5 shadow-sm">
              <h3 className="text-lg font-medium text-purple-800 mb-4">Employee Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-800">{employeeData.emp_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employee ID:</span>
                  <span className="font-medium text-gray-800">{employeeData.emp_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-800">{employeeData.location || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Assets List */}
            <div className="bg-indigo-50 rounded-lg p-5 shadow-sm">
              <h3 className="text-lg font-medium text-indigo-800 mb-4">Assets</h3>
              {employeeData.assets && employeeData.assets.length > 0 ? (
                <div className="space-y-4">
                  {employeeData.assets.map((asset, index) => (
                    <div key={asset.SrNo || index} className="bg-white p-4 rounded-md shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getAssetIcon(asset.Item)}
                            <h4 className="text-md font-medium text-gray-800">{asset.Item}</h4>
                            {asset.Specification && (
                              <span className="text-sm text-gray-500">({asset.Specification})</span>
                            )}
                          </div>
                          
                          <div className="ml-7 text-sm space-y-1">
                            {asset.PurchaseDate && (
                              <div className="text-gray-600">
                                Purchase Date: {new Date(asset.PurchaseDate).toLocaleDateString()}
                              </div>
                            )}
                            {asset.WarrantyPeriod && (
                              <div className="text-gray-600">
                                Warranty: {asset.WarrantyPeriod}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">No assets found.</div>
              )}
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Asset Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicEmployeeView;