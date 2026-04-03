import { create } from "zustand";
import axios from "axios";
import Toast from "../Toast";
import { useAuthstore } from "./authStore";

// Configure axios to use relative URLs by default
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true
});

const useEmployeeStore = create((set, get) => ({
  formData: {
    employee_name: "",
    emp_id: "",
    location: "",
    employee_role: "",
    assets: [],
    CarModel: "",
    CarNumber: "",
    InsuranceValidity: "",
    SerialNumber: "",
    LaptopConfiguration: "",
    DateOfPurchase: "",
    WarrantyPeriod: "",
    VendorName: "",
    VendorContactNumber: "",
    Street: "",
    City: "",
    State: "",
    ZipCode: "",
    Country: "",
    otherAssetName: ""
  },
  
  // New state for employees list
  employees: [],
  loading: false, // Changed from true to false to enable initial fetch
  error: null,
  
  // Update a single form field
  updateFormField: (fieldName, value) => set((state) => ({
    formData: { ...state.formData, [fieldName]: value }
  })),
  
  // Add an asset to the assets array
  addAsset: (asset) => set((state) => ({
    formData: { 
      ...state.formData,
      assets: [...state.formData.assets, asset]
    }
  })),

  // Remove an asset from the assets array by index
  removeAsset: (index) => set((state) => ({
    formData: {
      ...state.formData,
      assets: state.formData.assets.filter((_, i) => i !== index)
    }
  })),
  
  // Reset the form to initial state
  resetForm: () => set({
    formData: {
      employee_name: "",
      emp_id: "",
      location: "",
      assets: []
    }
  }),

  // Reset only the asset-related fields
  resetAssetForm: () => set((state) => ({
    formData: {
      ...state.formData,
      assets: [],
      CarModel: "",
      CarNumber: "",
      InsuranceValidity: "",
      SerialNumber: "",
      LaptopConfiguration: "",
      DateOfPurchase: "",
      WarrantyPeriod: "",
      VendorName: "",
      VendorContactNumber: "",
      Street: "",
      City: "",
      State: "",
      ZipCode: "",
      Country: "",
      otherAssetName: ""
    }
  })),
  
  // Reset the entire form to initial state (for use when navigating away)
  resetAllFields: () => set({
    formData: {
      employee_name: "",
      emp_id: "",
      location: "",
      assets: [],
      CarModel: "",
      CarNumber: "",
      InsuranceValidity: "",
      SerialNumber: "",
      LaptopConfiguration: "",
      DateOfPurchase: "",
      WarrantyPeriod: "",
      VendorName: "",
      VendorContactNumber: "",
      Street: "",
      City: "",
      State: "",
      ZipCode: "",
      Country: "",
      otherAssetName: ""
    }
  }),
  
  // Make fetchEmployees function stable by using a single instance - modified to fix infinite loop
  fetchEmployees: async () => {
    // Get user from authStore
    const user = useAuthstore.getState().user;
    
    // Skip fetching if the store is not yet initialized or user isn't authenticated
    if (!user) {
      console.log("fetchEmployees: User authentication state not available yet");
      return [];
    }
    
    // Only admins can fetch all employees
    if (user.role !== 'admin') {
      console.log(`fetchEmployees: User role ${user.role} is not admin, skipping fetch`);
      return [];
    }
    
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/api/employees`);
      set({ employees: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error("Fetch employees error:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Submit employee data to the API
  submitEmployeeData: async (user) => {
    console.log("submitEmployeeData: Starting submission process");
    console.log("submitEmployeeData: Form data to be submitted:", JSON.stringify(get().formData, null, 2));
    
    try {
      console.log("submitEmployeeData: Making API request to /employees endpoint");
      const formData = get().formData;
      
      // Use provided user data if any (for employee role)
      if (user && user.role === 'employee' && user.emp_id) {
        formData.emp_id = user.emp_id;
        console.log("Using emp_id from user data:", user.emp_id);
      }
      
      // Validate required fields before submission
      if (!formData.employee_name) {
        console.error("submitEmployeeData: Missing required field - employee_name");
        Toast.error("Employee name is required");
        throw new Error("Employee name is required");
      }
      
      if (!formData.emp_id) {
        console.error("submitEmployeeData: Missing required field - emp_id");
        Toast.error("Employee ID is required");
        throw new Error("Employee ID is required");
      }
      
      // Ensure assets array exists and is not empty
      if (!formData.assets || !Array.isArray(formData.assets) || formData.assets.length === 0) {
        console.error("submitEmployeeData: No assets provided");
        Toast.error("At least one asset is required");
        throw new Error("At least one asset is required");
      }

      // Log the assets being sent
      console.log("submitEmployeeData: Assets to be sent:", JSON.stringify(formData.assets, null, 2));
      
      console.log("submitEmployeeData: Sending data:", JSON.stringify(formData));
      const response = await api.post(
        `/api/employees`,
        formData
      );
      console.log("submitEmployeeData: Response received:", response.data);
      Toast.success("Employee added successfully!");
      get().resetAssetForm();  // Only reset asset fields, preserve employee info
      
      // Only fetch all employees if user is an admin
      if (user && user.role === 'admin') {
        get().fetchEmployees(); // Refresh the employees list
      }
      
      return response.data;
    } catch (err) {
      console.error("submitEmployeeData: Error details:", err);
      Toast.error("Failed to add employee. Please check your input and try again.");
      throw err;
    }
  },

  // Delete an employee by ID
  deleteEmployee: async (emp_id) => {
    try {
      const response = await api.delete(`/api/employees/${emp_id}`);
      Toast.success("Employee deleted successfully!");
      
      // Update the employees list after deletion
      set(state => ({
        employees: state.employees.filter(employee => employee.emp_id !== emp_id)
      }));
      
      return response.data;
    } catch (error) {
      console.error("Delete employee error:", error);
      Toast.error("Failed to delete employee.");
      throw error;
    }
  },

  // Get employee by ID
  getEmployeeById: async (emp_id) => {
    try {
      const response = await api.get(`/api/employees/${emp_id}`);
      return response.data;
    } catch (error) {
      console.error("Get employee error:", error);
      throw error;
    }
  },

  // Update employee data
  updateEmployee: async (emp_id, employeeData) => {
    try {
      const response = await api.put(
        `/api/employees/${emp_id}`,
        employeeData
      );
      Toast.success("Employee updated successfully!");
      get().fetchEmployees(); // Refresh the employees list
      return response.data;
    } catch (error) {
      console.error("Update employee error:", error);
      Toast.error("Failed to update employee.");
      throw error;
    }
  },

  // Get current user's employee data
  getMyEmployee: async () => {
    try {
      const response = await api.get(
        `/api/employees/me`
      );
      return response.data;
    } catch (error) {
      console.error("Get my employee data error:", error);
      
      // Handle 404 specifically - might happen when employee profile doesn't exist yet
      if (error.response && error.response.status === 404) {
        return null; // Return null instead of throwing error for this specific case
      }
      
      throw error;
    }
  },

  // Function to set the employee ID - used from the EmpForm component
  setEmployeeId: (empId) => {
    if (empId) {
      set(state => ({
        formData: {
          ...state.formData,
          emp_id: empId
        }
      }));
      console.log("Employee ID set to:", empId);
      return true;
    }
    return false;
  }
}));

export default useEmployeeStore;
