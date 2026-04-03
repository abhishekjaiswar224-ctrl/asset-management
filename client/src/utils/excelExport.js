import * as XLSX from 'xlsx';
import axios from 'axios';
import { create } from 'zustand';
import Toast from '../Toast';

// Create a store for Excel import functionality
export const useExcelImportStore = create((set, get) => ({
  importing: false,
  importProgress: 0,
  importError: null,
  importSuccess: false,
  importStats: { successCount: 0, failCount: 0, totalCount: 0 },
  
  // Set importing state
  setImporting: (value) => set({ importing: value }),
  
  // Set import progress
  setImportProgress: (value) => set({ importProgress: value }),
  
  // Set import error
  setImportError: (error) => set({ importError: error }),
  
  // Set import success
  setImportSuccess: (value) => set({ importSuccess: value }),
  
  // Set import stats
  setImportStats: (stats) => set((state) => ({
    importStats: { ...state.importStats, ...stats }
  })),
  
  // Reset import states
  resetImport: () => set({
    importing: false,
    importError: null,
    importSuccess: false,
    importProgress: 0,
    importStats: { successCount: 0, failCount: 0, totalCount: 0 }
  }),
  
  // Handle import from Excel
  handleImportFromExcel: async (file, fetchEmployees) => {
    if (!file) return;
    
    const api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '',
      withCredentials: true
    });
    
    try {
      set({
        importing: true,
        importError: null,
        importProgress: 0,
        importSuccess: false
      });
      
      // Parse Excel file
      const importData = await parseExcelFile(file, (progress) => {
        set({ importProgress: Math.round(progress * 30) }); // First 30% for parsing
      });
      
      if (!importData || importData.length === 0) {
        set({
          importError: "No valid data found in the Excel file.",
          importing: false
        });
        return;
      }
      
      // Process data - group by employee
      const employeesToImport = processExcelData(importData);
      
      // Set total count for progress tracking
      set((state) => ({
        importStats: {
          ...state.importStats,
          totalCount: employeesToImport.length
        }
      }));
      
      // Upload to server in batches
      const batchSize = 5;
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < employeesToImport.length; i += batchSize) {
        const batch = employeesToImport.slice(i, i + batchSize);
        try {
          const response = await api.post('/api/employees/batch-import', { employees: batch });
          
          // Update counts based on batch results
          successCount += response.data.results?.success || 0;
          failCount += response.data.results?.failed || 0;
          
          set({
            importStats: {
              successCount,
              failCount,
              totalCount: employeesToImport.length
            }
          });
          
        } catch (error) {
          console.error('Error importing batch:', error);
          failCount += batch.length;
          
          set((state) => ({
            importStats: {
              ...state.importStats,
              failCount: state.importStats.failCount + batch.length
            }
          }));
        }
        
        // Update progress (30% already for parsing + 70% for import)
        const importPercentage = ((i + batch.length) / employeesToImport.length) * 70;
        set({ importProgress: Math.round(30 + importPercentage) });
      }
      
      // Import complete
      set({
        importing: false,
        importSuccess: true
      });
      
      // Refresh employee list if function is provided
      if (typeof fetchEmployees === 'function') {
        fetchEmployees();
      }
      
      if (successCount > 0) {
        Toast.success(`Successfully imported ${successCount} employees`);
      }
      
      if (failCount > 0) {
        Toast.error(`Failed to import ${failCount} employees`);
      }
      
      return { success: successCount, failed: failCount };
      
    } catch (error) {
      console.error('Error importing from Excel:', error);
      set({
        importError: error.message,
        importing: false
      });
      Toast.error(`Error: ${error.message}`);
      throw error;
    }
  }
}));

/**
 * Exports data to an Excel file
 * @param {Array} data - The data to export
 * @param {string} fileName - The name for the exported file (without extension)
 * @param {Array} columns - Optional array of column specifications with header and key
 */
export const exportToExcel = (data, fileName = 'export', columns = null) => {
  try {
    // If no specific columns are provided, use all data properties
    if (!columns) {
      const firstItem = data[0] || {};
      columns = Object.keys(firstItem).map(key => ({
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        key: key
      }));
    }

    // If data contains complex objects like arrays, flatten them
    const flattenedData = data.map(item => {
      const flatItem = { ...item };
      
      // Handle assets specifically since we know it's a common complex field
      if (flatItem.assets && Array.isArray(flatItem.assets)) {
        // Extract asset types as comma-separated string
        flatItem.assetTypes = flatItem.assets
          .filter(asset => asset.type)
          .map(asset => asset.type)
          .join(', ');
        
        // Extract car details
        const carAsset = flatItem.assets.find(asset => 
          asset.type === 'Car' && asset.details);
        if (carAsset?.details) {
          flatItem.carModel = carAsset.details.CarModel || 'N/A';
          flatItem.carNumber = carAsset.details.CarNumber || 'N/A';
          flatItem.insuranceValidity = carAsset.details.InsuranceValidity || 'N/A';
        }
        
        // Extract laptop details
        const laptopAsset = flatItem.assets.find(asset => 
          asset.type === 'Laptop' && asset.details);
        if (laptopAsset?.details) {
          flatItem.laptopSerial = laptopAsset.details.SerialNumber || 'N/A';
          flatItem.laptopConfig = laptopAsset.details.LaptopConfiguration || 'N/A';
          flatItem.laptopPurchaseDate = laptopAsset.details.DateOfPurchase || 'N/A';
          flatItem.laptopWarranty = laptopAsset.details.WarrantyPeriod || 'N/A';
          flatItem.laptopVendor = laptopAsset.details.VendorName || 'N/A';
          flatItem.vendorContact = laptopAsset.details.VendorContactNumber || 'N/A';
        }
        
        // Extract address details
        const addressAsset = flatItem.assets.find(asset => 
          asset.type === 'Address' && asset.details);
        if (addressAsset?.details) {
          const addressParts = [];
          if (addressAsset.details.Street) addressParts.push(addressAsset.details.Street);
          if (addressAsset.details.City) addressParts.push(addressAsset.details.City);
          if (addressAsset.details.State) addressParts.push(addressAsset.details.State);
          if (addressAsset.details.ZipCode) addressParts.push(addressAsset.details.ZipCode);
          if (addressAsset.details.Country) addressParts.push(addressAsset.details.Country);
          
          flatItem.address = addressParts.join(', ') || 'N/A';
        }
      }
      
      return flatItem;
    });

    // Create a workbook and add the worksheet
    const worksheet = XLSX.utils.json_to_sheet(flattenedData, { 
      header: columns.map(col => col.key) 
    });

    // Add header row with custom column names
    XLSX.utils.sheet_add_aoa(
      worksheet, 
      [columns.map(col => col.header)], 
      { origin: 'A1' }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate the Excel file
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

/**
 * Parses an Excel file and returns the data as an array of objects
 * @param {File} file - The Excel file to parse
 * @param {Function} progressCallback - Optional callback for progress updates (0-1)
 * @returns {Promise<Array>} - Promise resolving to array of data objects
 */
export const parseExcelFile = (file, progressCallback = null) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (progressCallback) progressCallback(0.3);
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (progressCallback) progressCallback(0.5);
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          if (progressCallback) progressCallback(0.7);
          
          // Normalize headers
          const normalizedData = jsonData.map(row => {
            const normalizedRow = {};
            
            // Map common variations of column names
            Object.entries(row).forEach(([key, value]) => {
              const lowerKey = key.toLowerCase();
              
              if (lowerKey.includes('token') && lowerKey.includes('name')) normalizedRow.emp_name = value;
              else if (lowerKey.includes('name') && lowerKey.includes('emp')) normalizedRow.emp_name = value;
              else if (lowerKey.includes('employee') && lowerKey.includes('name')) normalizedRow.emp_name = value;
              else if (lowerKey.includes('emp') && lowerKey.includes('id')) normalizedRow.emp_id = value;
              else if (lowerKey.includes('employee') && lowerKey.includes('id')) normalizedRow.emp_id = value;
              else if (lowerKey === 'location') normalizedRow.location = value;
              else if (lowerKey.includes('role')) normalizedRow.employee_role = value;
              else if (lowerKey === 'asset item') normalizedRow.Item = value;
              else if (lowerKey.includes('item') || lowerKey.includes('asset')) normalizedRow.Item = value;
              else if (lowerKey.includes('spec')) normalizedRow.Specification = value;
              else if (lowerKey.includes('purchase') || (lowerKey.includes('date') && !lowerKey.includes('warranty'))) normalizedRow.PurchaseDate = value;
              else if (lowerKey.includes('warranty')) normalizedRow.WarrantyPeriod = value;
              else if (lowerKey.includes('vendor') && lowerKey.includes('name')) normalizedRow.VendorName = value;
              else if ((lowerKey.includes('vendor') && lowerKey.includes('contact')) || 
                       (lowerKey.includes('contact') && lowerKey.includes('number'))) {
                normalizedRow.VendorContact = value;
              }
            });
            
            // Handle any missing required fields
            if (!normalizedRow.emp_name && row['Token Name']) normalizedRow.emp_name = row['Token Name'];
            if (!normalizedRow.emp_id && row['Employee ID']) normalizedRow.emp_id = row['Employee ID'];
            
            return normalizedRow;
          });

          if (progressCallback) progressCallback(1);
          resolve(normalizedData);
          
        } catch (error) {
          console.error('Error parsing Excel data:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      console.error('Error in parseExcelFile:', error);
      reject(error);
    }
  });
};

/**
 * Process Excel data to group by employee and format for import
 * @param {Array} data - Array of raw data objects from Excel
 * @returns {Array} - Processed data ready for import
 */
export const processExcelData = (data) => {
  // Group items by employee
  const employeeMap = new Map();
  
  data.forEach(row => {
    const empId = row.emp_id;
    if (!empId) return; // Skip rows without employee ID
    
    if (!employeeMap.has(empId)) {
      employeeMap.set(empId, {
        emp_id: empId,
        emp_name: row.emp_name,
        location: row.location,
        employee_role: row.employee_role,
        assets: []
      });
    }
    
    const employee = employeeMap.get(empId);
    
    // Add asset if Item exists
    if (row.Item) {
      const asset = {
        Item: row.Item,
        Specification: row.Specification,
        PurchaseDate: row.PurchaseDate,
        WarrantyPeriod: row.WarrantyPeriod,
        VendorName: row.VendorName,
        VendorContactNo: row.VendorContact
      };
      
      employee.assets.push(asset);
    }
  });
  
  return Array.from(employeeMap.values());
};