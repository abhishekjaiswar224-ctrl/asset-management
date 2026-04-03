import React, { useState, useEffect } from 'react';
import { useAuthstore } from '../utils/authStore';
import useEmployeeStore from '../utils/employeeStore';
import { Package, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const MyInformation = ({ employeeData = null, isAdminView = false }) => {
  const { user } = useAuthstore();
  const { getMyEmployee } = useEmployeeStore();
  const [localEmployeeData, setLocalEmployeeData] = useState(null);
  const [loading, setLoading] = useState(!employeeData);
  const [error, setError] = useState(null);
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    // If employee data is provided through props (admin viewing an employee), use it
    if (employeeData) {
      setLocalEmployeeData(employeeData);
      setLoading(false);
      return;
    }

    // Otherwise fetch current user's employee data (normal employee view)
    const fetchEmployeeData = async () => {
      try {
        const data = await getMyEmployee();
        setLocalEmployeeData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching employee information:", err);
        setError("Failed to load your information. Please try again later.");
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeData, getMyEmployee]);

  // Helper function to get asset icon
  const getAssetIcon = (assetItem) => {
    return <Package size={20} className="text-purple-500" />;
  };

  // Generate public access URL with permanent token
  const getPublicUrl = () => {
    if (!localEmployeeData?.emp_id) return '';
    
    // Create a permanent token that will always be the same for this employee
    // Format: emp_ID (simple and permanent)
    const token = `emp_${localEmployeeData.emp_id}`;
    
    // Generate the full public access URL
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/employee/${token}`;
  };
  
  // QR Code Modal Component
  const QrCodeModal = () => {
    const publicUrl = getPublicUrl();
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Employee Information QR Code</h3>
          <p className="text-gray-600 mb-4">Scan this QR code to view this employee's basic information:</p>
          
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG value={publicUrl} size={200} />
          </div>
          
          <div className="mt-4 text-xs text-gray-500 break-all">
            <p className="mb-1 font-medium">Public URL:</p>
            <p>{publicUrl}</p>
          </div>
          
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => {
                // Create a printable version of just the QR code
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Employee QR Code - ${localEmployeeData.emp_name}</title>
                      <style>
                        body { 
                          display: flex; 
                          justify-content: center; 
                          align-items: center; 
                          height: 100vh; 
                          margin: 0; 
                          font-family: Arial, sans-serif;
                        }
                        .qr-container {
                          text-align: center;
                          border: 1px solid #eee;
                          padding: 20px;
                          border-radius: 8px;
                        }
                        h2 { margin-bottom: 10px; }
                        p { margin: 5px 0; color: #666; }
                      </style>
                    </head>
                    <body>
                      <div class="qr-container">
                        <h2>${localEmployeeData.emp_name}</h2>
                        <p>Employee ID: ${localEmployeeData.emp_id}</p>
                        ${document.getElementById('qr-code-print').innerHTML}
                        <p style="margin-top: 15px;">Scan to view employee information</p>
                      </div>
                    </body>
                  </html>
                `);
                printWindow.document.close();
                setTimeout(() => {
                  printWindow.print();
                }, 500);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white"
            >
              Print QR Code
            </button>
            <button
              onClick={() => setShowQrCode(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800"
            >
              Close
            </button>
          </div>
          
          {/* Hidden element for printing */}
          <div id="qr-code-print" className="hidden">
            <QRCodeSVG value={publicUrl} size={400} />
          </div>
        </div>
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

  if (!localEmployeeData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">No employee information found. Please contact your administrator.</span>
      </div>
    );
  }

  // Set appropriate title based on whether this is an admin view or employee view
  const title = isAdminView 
    ? `Employee Information: ${localEmployeeData.emp_name}`
    : "My Information";

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg h-[calc(100vh-120px)] max-h-[900px]">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <button 
          onClick={() => setShowQrCode(true)}
          className="flex items-center bg-white/20 hover:bg-white/30 rounded-md px-3 py-1 text-white text-sm"
        >
          <Share2 size={16} className="mr-2" />
          Share QR
        </button>
      </div>

      <div className="p-6 overflow-y-auto h-[calc(100%-60px)]">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Employee Details */}
          <div className="bg-purple-50 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-medium text-purple-800 mb-4">Employee Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-800">{localEmployeeData.emp_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Employee ID:</span>
                <span className="font-medium text-gray-800">{localEmployeeData.emp_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-800">{localEmployeeData?.email || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium text-gray-800">{localEmployeeData.location}</span>
              </div>
              {/* Role field removed to prevent displaying and changing roles */}
            </div>
          </div>

          {/* Assets List */}
          <div className="bg-indigo-50 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-medium text-indigo-800 mb-4">{isAdminView ? 'Assets' : 'My Assets'}</h3>
            {localEmployeeData.assets && localEmployeeData.assets.length > 0 ? (
              <div className="space-y-4 max-h-[460px] overflow-y-auto">
                {localEmployeeData.assets.map((asset, index) => (
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
                          {asset.VendorName && (
                            <div className="text-gray-600">
                              Vendor: {asset.VendorName}
                            </div>
                          )}
                          {asset.VendorContactNo && (
                            <div className="text-gray-600">
                              Vendor Contact: {asset.VendorContactNo}
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
      </div>
      
      {/* QR Code Modal - shown only when showQrCode is true */}
      {showQrCode && <QrCodeModal />}
    </div>
  );
};

export default MyInformation;