import React from 'react';
import { X, AlertCircle, CheckCircle2, FileWarning } from 'lucide-react';

const ImportProgress = ({ 
  importing, 
  progress, 
  error, 
  success,
  onClose, 
  successCount = 0,
  failCount = 0,
  totalCount = 0
}) => {
  return (
    <>
      {/* Import progress overlay */}
      {importing && (
        <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Importing Employees</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">{progress}% complete</p>
              {totalCount > 0 && (
                <p className="text-sm text-gray-600">
                  Processing {Math.min(successCount + failCount, totalCount)} of {totalCount} records
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-start space-x-4">
              <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-red-800">Import Failed</h3>
                <p className="text-red-700 text-sm mt-2">{error}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={onClose} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-green-800">Import Complete</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <p className="text-gray-700">Total records:</p>
                    <p className="font-medium">{totalCount}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-700">Successfully imported:</p>
                    <p className="font-medium text-green-600">{successCount}</p>
                  </div>
                  {failCount > 0 && (
                    <div className="flex justify-between">
                      <p className="text-gray-700">Failed to import:</p>
                      <p className="font-medium text-red-600">{failCount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={onClose} 
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportProgress;