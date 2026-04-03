import React, { useState, useEffect } from 'react';
import { useAuthstore } from '../utils/authStore';
import useEmployeeStore from '../utils/employeeStore';
import Toast from '../Toast';
import { Package, Plus, Trash, Key, Loader2 } from 'lucide-react';
import axios from 'axios';

const EditEmployeeForm = ({ employeeData = null, isAdminEdit = false, onSaveComplete = null }) => {
  const { user } = useAuthstore();
  const { getMyEmployee, updateEmployee, getEmployeeById } = useEmployeeStore();
  
  // Add states for user account management
  const [userAccount, setUserAccount] = useState(null);
  const [loadingUserAccount, setLoadingUserAccount] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const [formData, setFormData] = useState({
    employee_name: '',
    location: '',
    emp_id: '',
  });

  const [existingAssets, setExistingAssets] = useState([]);
  const [assetsToRemove, setAssetsToRemove] = useState([]);
  const [newAssets, setNewAssets] = useState([]);

  // UI state for asset management
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [currentAsset, setCurrentAsset] = useState({
    Item: "Laptop",
    Specification: "",
    PurchaseDate: "",
    WarrantyPeriod: "",
    VendorName: "",
    VendorContactNo: ""
  });
  
  const assetTypes = [
    "Laptop", "Desktop", "Mobile", "Four Wheeler", "Two Wheeler", 
    "TV", "AC", "Freez", "Cooler", "Inverter", "Fan", "Flat", 
    "Geyser", "Wooden Bed", "Chair", "Cupboard", "Others"
  ];
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch employee data when component mounts
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        let data;
        
        // If employeeData is provided via props, use it directly
        if (employeeData) {
          data = employeeData;
        } 
        // Otherwise fetch current user's data
        else if (user?.userId) {
          data = await getMyEmployee();
        } else {
          setLoading(false);
          return;
        }
        
        setFormData({
          employee_name: data.emp_name || '',
          location: data.location || '',
          emp_id: data.emp_id || '', // Store the emp_id from the fetched data
        });
        setExistingAssets(data.assets || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching employee data for edit:", err);
        setError("Failed to load employee information. Please try again later.");
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeData, user?.userId, getMyEmployee]);

  // Add effect to fetch user account details
  useEffect(() => {
    const fetchUserAccount = async () => {
      if (!formData.emp_id) return;
      
      setLoadingUserAccount(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || ''}/api/auth/user/${formData.emp_id}`,
          { withCredentials: true }
        );
        setUserAccount(response.data);
      } catch (error) {
        console.error('Error fetching user account:', error);
        setUserAccount(null);
      } finally {
        setLoadingUserAccount(false);
      }
    };

    if (isAdminEdit && user?.role === 'admin') {
      fetchUserAccount();
    }
  }, [formData.emp_id, isAdminEdit, user?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleAssetChange = (e) => {
    const { name, value } = e.target;
    setCurrentAsset(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssetTypeChange = (e) => {
    setCurrentAsset(prev => ({
      ...prev,
      Item: e.target.value
    }));
  };

  const handleAddAsset = () => {
    // Validate required fields
    if (!currentAsset.Item) {
      Toast.error("Please select an asset type");
      return;
    }
    
    // If "Others" is selected, check if a custom name is provided
    if (currentAsset.Item === "Others" && !currentAsset.Specification) {
      Toast.error("Please provide a specification for 'Others' asset type");
      return;
    }
    
    setNewAssets(prev => [...prev, { ...currentAsset }]);
    
    // Reset asset form fields
    setCurrentAsset({
      Item: "Laptop",
      Specification: "",
      PurchaseDate: "",
      WarrantyPeriod: "",
      VendorName: "",
      VendorContactNo: ""
    });
    
    // Hide the asset form
    setShowAssetForm(false);
    Toast.success(`Added ${currentAsset.Item} asset`);
  };

  const handleRemoveExistingAsset = (assetId) => {
    setAssetsToRemove(prev => [...prev, assetId]);
    setExistingAssets(prev => prev.filter(asset => asset.SrNo !== assetId));
  };

  const handleRemoveNewAsset = (index) => {
    setNewAssets(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Prepare data for update
      const updateData = {
        employee_name: formData.employee_name,
        location: formData.location,
        assets: [
          // Include new assets to add
          ...newAssets
        ],
        // Include existing assets with updates if needed
        removeAssets: assetsToRemove
      };
      
      // Use the employee ID instead of the user ID
      await updateEmployee(formData.emp_id, updateData);
      Toast.success("Employee information has been updated successfully!");
      
      // Refresh the data
      if (isAdminEdit) {
        // If admin is editing, call onSaveComplete callback if provided
        if (onSaveComplete) {
          onSaveComplete();
        }
      } else {
        // If employee is editing their own record, refresh the data
        const updatedData = await getMyEmployee();
        setExistingAssets(updatedData.assets || []);
        setNewAssets([]);
        setAssetsToRemove([]);
      }
      
      setSubmitting(false);
    } catch (err) {
      console.error("Error updating employee information:", err);
      Toast.error("Failed to update employee information. Please try again.");
      setSubmitting(false);
    }
  };

  // Add password reset handler
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    console.log('=======================================');
    console.log('PASSWORD RESET FUNCTION CALLED');
    console.log('=======================================');
    
    if (!newPassword || !confirmPassword) {
      Toast.error('Please fill in both password fields');
      return;
    }

    // Basic password validation
    if (newPassword.length < 6) {
      Toast.error('Password must be at least 8 characters long');
      return;
    }

    setResettingPassword(true);
    try {
      console.log('Attempting to reset password for employee:', formData.emp_id);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || ''}/api/auth/reset-password-admin`,
        {
          emp_id: formData.emp_id,
          newPassword
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Password reset response:', response.data);
      Toast.success('Password updated successfully');
      setShowPasswordReset(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      Toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const getAssetIcon = () => {
    return <Package size={16} className="text-purple-600" />;
  };

  // Helper to render asset details
  const renderAssetDetails = (asset) => {
    const details = [];
    
    if (asset.Item) details.push(asset.Item);
    if (asset.Specification) details.push(`(${asset.Specification})`);
    
    return details.join(' ') || 'Asset';
  };

  // Display form for adding new asset
  const renderAssetForm = () => {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4 text-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-purple-700">Add New Asset</h3>
          <button 
            type="button"
            onClick={() => setShowAssetForm(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
          <select
            value={currentAsset.Item}
            onChange={handleAssetTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {assetTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Specification</label>
          <input
            type="text"
            name="Specification"
            value={currentAsset.Specification}
            onChange={handleAssetChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., Model, Serial Number, or Details"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              name="PurchaseDate"
              value={currentAsset.PurchaseDate}
              onChange={handleAssetChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Period</label>
            <input
              type="text"
              name="WarrantyPeriod"
              value={currentAsset.WarrantyPeriod}
              onChange={handleAssetChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., 2 years"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
            <input
              type="text"
              name="VendorName"
              value={currentAsset.VendorName}
              onChange={handleAssetChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Contact</label>
            <input
              type="text"
              name="VendorContactNo"
              value={currentAsset.VendorContactNo}
              onChange={handleAssetChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleAddAsset}
          className="w-full py-2 px-4 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-medium"
        >
          Add Asset
        </button>
      </div>
    );
  };

  const renderExistingAssets = () => {
    if (!existingAssets.length) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">
          {isAdminEdit ? "Current Assets:" : "Your Current Assets:"}
        </h4>
        <div className="space-y-2">
          {existingAssets.map((asset) => (
            <div 
              key={asset.SrNo} 
              className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-gray-50"
            >
              <div className="flex items-start flex-col">
                <div className="flex items-center mb-1">
                  {getAssetIcon()}
                  <span className="ml-2 font-medium">{asset.Item}</span>
                  {asset.Specification && <span className="text-gray-500 ml-1 text-sm">({asset.Specification})</span>}
                </div>
                <div className="ml-6 text-xs text-gray-500 flex flex-wrap gap-x-4">
                  {asset.PurchaseDate && <span>Purchased: {new Date(asset.PurchaseDate).toLocaleDateString()}</span>}
                  {asset.WarrantyPeriod && <span>Warranty: {asset.WarrantyPeriod}</span>}
                </div>
                {(asset.VendorName || asset.VendorContactNo) && (
                  <div className="ml-6 text-xs text-gray-500 flex flex-wrap gap-x-4">
                    {asset.VendorName && <span>Vendor: {asset.VendorName}</span>}
                    {asset.VendorContactNo && <span>Contact: {asset.VendorContactNo}</span>}
                  </div>
                )}
              </div>
              {/* Only show delete button for admins */}
              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleRemoveExistingAsset(asset.SrNo)}
                  className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                  title="Remove asset"
                >
                  <Trash size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUserAccount = () => {
    if (!isAdminEdit || user?.role !== 'admin') return null;

    return (
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-lg font-medium text-gray-800 mb-3">User Account</h3>
        
        {loadingUserAccount ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading account information...</span>
          </div>
        ) : userAccount ? (
          <div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{userAccount.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Status</p>
                  <p className={`font-medium ${userAccount.isactive ? 'text-green-600' : 'text-red-600'}`}>
                    {userAccount.isactive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <p className="text-gray-900 capitalize">{userAccount.role}</p>
                </div>
              </div>
            </div>

            {!showPasswordReset ? (
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="inline-flex items-center px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <Key size={16} className="mr-2" />
                Reset Password
              </button>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-3">Reset Password</h4>
                
                {/* Test button outside the form just to check if event handlers work */}
                <div className="mb-3 p-2 bg-blue-100 border border-blue-200 rounded">
                  <p className="text-blue-800 text-xs mb-2">Troubleshooting:</p>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('TEST BUTTON CLICKED');
                      alert('Test button clicked - check console');
                    }}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded"
                  >
                    Test Console Log
                  </button>
                </div>
                
                {/* Changed from form to div to avoid nesting forms */}
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        disabled={resettingPassword}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        disabled={resettingPassword}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          console.log('DIRECT BUTTON CLICK');
                          handlePasswordReset(e);
                        }}
                        disabled={resettingPassword}
                        className={`flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md ${
                          resettingPassword ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {resettingPassword && <Loader2 size={16} className="mr-2 animate-spin" />}
                        {resettingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordReset(false);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                        disabled={resettingPassword}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600 mb-3">No user account found for this employee.</p>
            <p className="text-sm text-gray-500 mb-4">You can create a new account for this employee using their employee ID.</p>
            <a 
              href={`/admin/create-account?empId=${formData.emp_id}&returnTo=${encodeURIComponent(`/dashboard/edit/${formData.emp_id}`)}`}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Key size={16} className="mr-2" />
              Create Account
            </a>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        <span className="ml-3 text-lg text-purple-700">Loading information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const formTitle = isAdminEdit 
    ? `Edit Employee: ${formData.employee_name}`
    : "Edit My Information";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">{formTitle}</h2>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="employee_name" className="block text-sm font-medium text-gray-700 mb-1">
                Employee Name
              </label>
              <input
                type="text"
                id="employee_name"
                name="employee_name"
                value={formData.employee_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Role field removed to prevent displaying and changing roles */}
            
            {/* Add user account section */}
            {renderUserAccount()}

            {/* Assets Management Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Manage Assets</h3>
              
              {/* Existing Assets */}
              {renderExistingAssets()}
              
              {/* New Assets to Add */}
              {newAssets.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">New Assets to Add:</h4>
                  <div className="space-y-2">
                    {newAssets.map((asset, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-purple-50"
                      >
                        <div className="flex items-start flex-col">
                          <div className="flex items-center mb-1">
                            {getAssetIcon()}
                            <span className="ml-2 font-medium">{asset.Item}</span>
                            {asset.Specification && <span className="text-gray-500 ml-1 text-sm">({asset.Specification})</span>}
                          </div>
                          <div className="ml-6 text-xs text-gray-500 flex flex-wrap gap-x-4">
                            {asset.PurchaseDate && <span>Purchased: {asset.PurchaseDate}</span>}
                            {asset.WarrantyPeriod && <span>Warranty: {asset.WarrantyPeriod}</span>}
                          </div>
                          {(asset.VendorName || asset.VendorContactNo) && (
                            <div className="ml-6 text-xs text-gray-500 flex flex-wrap gap-x-4">
                              {asset.VendorName && <span>Vendor: {asset.VendorName}</span>}
                              {asset.VendorContactNo && <span>Contact: {asset.VendorContactNo}</span>}
                            </div>
                          )}
                        </div>
                        {/* Allow removing new (not yet submitted) assets */}
                        <button
                          type="button"
                          onClick={() => handleRemoveNewAsset(index)}
                          className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                          title="Remove asset"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add Asset Button */}
              {!showAssetForm ? (
                <button
                  type="button"
                  onClick={() => setShowAssetForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <Plus size={16} className="mr-2" />
                  Add Asset
                </button>
              ) : (
                renderAssetForm()
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2 px-4 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-medium ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeForm;