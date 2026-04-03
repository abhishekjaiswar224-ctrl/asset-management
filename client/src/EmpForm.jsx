import React, { useState, useEffect } from "react";
import Toast from "./Toast";
import { Plus, Package, Trash, Eye } from "lucide-react"; // Added Eye icon
import useEmployeeStore from "./utils/employeeStore";
import { useAuthstore } from "./utils/authStore"; // Import the auth store
import MyInformation from "./components/MyInformation"; // Import MyInformation component
import axios from "axios"; // Import axios for the manual auth check

function EmpForm() {
    // Get state and actions from Zustand store
    const formData = useEmployeeStore(state => state.formData);
    const updateFormField = useEmployeeStore(state => state.updateFormField);
    const addAsset = useEmployeeStore(state => state.addAsset);
    const removeAsset = useEmployeeStore(state => state.removeAsset);
    const submitEmployeeData = useEmployeeStore(state => state.submitEmployeeData);
    const resetAssetForm = useEmployeeStore(state => state.resetAssetForm);
    const setEmployeeId = useEmployeeStore(state => state.setEmployeeId);
    
    // Get user data from auth store
    const user = useAuthstore(state => state.user);    // Added states for submission success and data
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedEmpId, setSubmittedEmpId] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [submittedAssetCount, setSubmittedAssetCount] = useState(0);
    const [submittedEmployeeData, setSubmittedEmployeeData] = useState(null);
    
    // Log all user data when user changes
    useEffect(() => {
        console.log("Current user data in EmpForm:", user);
    }, [user]);
    
    // Pre-populate emp_id field when user is an employee and has an emp_id
    useEffect(() => {
        if (user?.role === 'employee' && user?.emp_id) {
            console.log("Setting employee ID from auth store:", user.emp_id);
            setEmployeeId(user.emp_id);
        }
    }, [user?.role, user?.emp_id, setEmployeeId]);
    
    // Keep UI state locally as it's specific to this component
    const [currentAsset, setCurrentAsset] = useState({
        Item: "Laptop",
        Specification: "",
        PurchaseDate: "",
        WarrantyPeriod: "",
        VendorName: "",
        VendorContactNo: ""
    });

    // Reset only asset form when component unmounts
    useEffect(() => {
        return () => {
            resetAssetForm();
        };
    }, [resetAssetForm]);

    const assetTypes = [
        "Laptop", "Desktop", "Mobile", "Four Wheeler", "Two Wheeler", 
        "TV", "AC", "Freez", "Cooler", "Inverter", "Fan", "Flat", 
        "Geyser", "Wooden Bed", "Chair", "Cupboard", "Others"
    ];
    
    const handleChange = (e) => {
        updateFormField(e.target.name, e.target.value);
    };

    const handleAssetChange = (e) => {
        setCurrentAsset({
            ...currentAsset,
            [e.target.name]: e.target.value
        });
    };

    const handleAssetTypeChange = (e) => {
        setCurrentAsset({
            ...currentAsset,
            Item: e.target.value
        });
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
        
        console.log("Adding asset:", JSON.stringify(currentAsset, null, 2));
        
        // Add the asset to the form data
        addAsset(currentAsset);
        
        // Log the current state of assets after adding
        console.log("Current assets after adding:", JSON.stringify(formData.assets, null, 2));
        
        // Reset current asset form
        setCurrentAsset({
            Item: "Laptop",
            Specification: "",
            PurchaseDate: "",
            WarrantyPeriod: "",
            VendorName: "",
            VendorContactNo: ""
        });
        
        Toast.success(`Added ${currentAsset.Item} to assets`);
    };

    const handleRemoveAsset = (index) => {
        removeAsset(index);
        Toast.success("Asset removed successfully");
    };    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Store the asset count before submission (before form gets reset)
            const assetCount = formData.assets.length;
            
            // Store the form data before submission
            const dataToSubmit = { ...formData };
            
            // Pass user data to submitEmployeeData function
            const submittedEmployee = await submitEmployeeData(user);
            
            // If user is an employee, wait for their emp_id to be updated
            if (user?.role === 'employee') {
                // Wait a short moment for the database to update
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Refresh the auth store to get updated user data
                await useAuthstore.getState().authCheck();
                
                // Wait another moment for the auth store to update
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Prepare the employee data with the submitted information
            const employeeDataForView = {
                emp_name: dataToSubmit.employee_name,
                emp_id: dataToSubmit.emp_id,
                location: dataToSubmit.location,
                employee_role: dataToSubmit.employee_role,
                assets: dataToSubmit.assets
            };
            
            setIsSubmitted(true);
            setSubmittedEmpId(formData.emp_id);
            setSubmittedAssetCount(assetCount);
            setSubmittedEmployeeData(employeeDataForView);
        } catch (err) {
            // Error is already handled in the store
            console.error("Form submission error:", err);
        }
    };

    const getAssetIcon = (item) => {
        return <Package size={16} className="text-purple-600" />;
    };    // Conditional rendering based on submission status
    if (isSubmitted && !showDetails) {
        const assetCount = submittedAssetCount; // Use the stored count instead of formData.assets.length
        return (
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg p-8 max-w-3xl mx-auto">
                <div className="text-center">
                    <div className="bg-green-100 text-green-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Submission Successful!</h2>
                    <p className="text-gray-600 mb-6">
                        Your employee profile with {assetCount} asset(s) has been created successfully.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => setShowDetails(true)}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold flex items-center justify-center shadow-md hover:bg-purple-700 transition-colors"
                        >
                            <Eye size={20} className="mr-2" />
                            View Details
                        </button>                        <button
                            onClick={() => {
                                setIsSubmitted(false);
                                setSubmittedEmpId(null);
                                setSubmittedAssetCount(0);
                                setSubmittedEmployeeData(null);
                            }}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold shadow-md hover:bg-gray-200 transition-colors"
                        >
                            Submit Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }
      // Show the details view if requested - Pass the submitted employee data
    if (showDetails) {
        return (
            <div>
                <div className="mb-4">
                    <button
                        onClick={() => setShowDetails(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center hover:bg-gray-200 transition-colors"
                    >
                        ← Back to Success Page
                    </button>
                </div>
                <MyInformation 
                    employeeData={submittedEmployeeData} 
                    isAdminView={false}
                />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg h-[calc(100vh-120px)] max-h-[900px]">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row h-full">
                {/* Left Panel - Employee Fields */}
                <div className="w-full md:w-1/2 p-4 lg:p-6 overflow-y-auto">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </span>
                        Employee Information
                    </h2>
                    <div className="space-y-4">
                        <InputField
                            name="employee_name"
                            label="Employee Name"
                            value={formData.employee_name}
                            onChange={handleChange}
                        />
                        <InputField
                            name="emp_id"
                            label="Employee ID"
                            type="number"
                            value={formData.emp_id}
                            onChange={handleChange}
                            disabled={user?.role === 'employee'}
                        />
                        <InputField
                            name="location"
                            label="Location"
                            value={formData.location}
                            onChange={handleChange}
                        />
                        <InputField
                            name="employee_role"
                            label="Employee Role"
                            value={formData.employee_role}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                
                {/* Right Panel - Asset Management */}
                <div className="w-full md:w-1/2 bg-gradient-to-br from-purple-600 to-indigo-700 p-4 lg:p-6 overflow-y-auto">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </span>
                        Assets Management
                    </h2>
                    
                    <div className="space-y-3">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <label className="block text-sm font-medium text-white mb-2">Asset Type</label>
                            <select
                                value={currentAsset.Item}
                                onChange={handleAssetTypeChange}
                                className="flex-grow appearance-none rounded-lg block w-full px-3 py-2 border-0 bg-white/80 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 sm:text-sm"
                            >
                                {assetTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <InputField
                                name="Specification"
                                label="Specification"
                                value={currentAsset.Specification}
                                onChange={handleAssetChange}
                                darkMode={true}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                <InputField
                                    name="PurchaseDate"
                                    label="Purchase Date"
                                    type="date"
                                    value={currentAsset.PurchaseDate}
                                    onChange={handleAssetChange}
                                    darkMode={true}
                                />
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                <InputField
                                    name="WarrantyPeriod"
                                    label="Warranty Period"
                                    value={currentAsset.WarrantyPeriod}
                                    onChange={handleAssetChange}
                                    darkMode={true}
                                    placeholder="e.g., 2 years"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                <InputField
                                    name="VendorName"
                                    label="Vendor Name"
                                    value={currentAsset.VendorName}
                                    onChange={handleAssetChange}
                                    darkMode={true}
                                />
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                <InputField
                                    name="VendorContactNo"
                                    label="Vendor Contact Number"
                                    value={currentAsset.VendorContactNo}
                                    onChange={handleAssetChange}
                                    darkMode={true}
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleAddAsset}
                                className="inline-flex items-center justify-center px-4 py-2 border-0 rounded-lg text-white bg-purple-500 hover:bg-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-300 transition-colors"
                            >
                                <Plus size={18} className="mr-2" />
                                Add Asset
                            </button>
                        </div>

                        {formData.assets.length > 0 && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mt-4">
                                <h3 className="text-base font-medium text-white mb-2">Assets Added:</h3>
                                <div className="bg-white/80 rounded-lg p-2 max-h-64 overflow-y-auto">
                                    <ul className="divide-y divide-purple-100">
                                        {formData.assets.map((asset, index) => (
                                            <li key={index} className="py-2 px-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center text-sm text-gray-700">
                                                            {getAssetIcon(asset.Item)}
                                                            <span className="ml-2 font-medium">{asset.Item}</span>
                                                        </div>
                                                        {asset.Specification && (
                                                            <div className="ml-6 text-xs text-gray-600 mt-1">
                                                                Spec: {asset.Specification}
                                                            </div>
                                                        )}
                                                        <div className="ml-6 text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                                                            {asset.PurchaseDate && <span>Purchase: {asset.PurchaseDate}</span>}
                                                            {asset.WarrantyPeriod && <span>Warranty: {asset.WarrantyPeriod}</span>}
                                                        </div>
                                                        {(asset.VendorName || asset.VendorContactNo) && (
                                                            <div className="ml-6 text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                                                                {asset.VendorName && <span>Vendor: {asset.VendorName}</span>}
                                                                {asset.VendorContactNo && <span>Contact: {asset.VendorContactNo}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAsset(index)}
                                                        className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                                                        title="Remove asset"
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full px-6 py-2 mt-4 bg-white text-purple-600 rounded-lg font-bold text-base shadow-md transition-all duration-200 ease-in-out hover:bg-purple-50 hover:shadow-lg"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function InputField({ name, label, type = "text", value, onChange, darkMode = false, placeholder, disabled }) {
    return (
        <div>
            <label htmlFor={name} className={`block text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'} mb-1`}>
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                className={`appearance-none rounded-lg block w-full px-3 py-2 ${
                    darkMode 
                        ? 'border-0 bg-white/80 text-gray-800 placeholder-gray-500 focus:ring-purple-300' 
                        : 'border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-purple-500'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
                placeholder={placeholder || label}
                value={value}
                onChange={onChange}
                disabled={disabled}
            />
        </div>
    );
}

export default EmpForm;