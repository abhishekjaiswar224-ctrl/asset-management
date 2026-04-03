import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, Eye, Edit, Trash2, FileSpreadsheet, Filter, Upload } from 'lucide-react';
import useEmployeeStore from '../utils/employeeStore';
import { exportToExcel, parseExcelFile, processExcelData, useExcelImportStore } from '../utils/excelExport';
import ExcelTemplate from './ImportExcel/ExcelTemplate';
import ImportProgress from './ImportExcel/ImportProgress';
import Toast from '../Toast';

const EmployeeTable = () => {
  // Use state from the store
  const { employees, loading, error, fetchEmployees, deleteEmployee } = useEmployeeStore();
  const navigate = useNavigate();
  
  // Import state from Excel store
  const { 
    importing, 
    importProgress, 
    importError, 
    importSuccess, 
    importStats, 
    handleImportFromExcel: handleImport,
    resetImport 
  } = useExcelImportStore();
  
  // Local state only for table functionality
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [assetTypeFilter, setAssetTypeFilter] = useState('');
  
  // Asset types array
  const assetTypes = [
    "Laptop", "Desktop", "Mobile", "Four Wheeler", "Two Wheeler", 
    "TV", "AC", "Freez", "Cooler", "Inverter", "Fan", "Flat", 
    "Geyser", "Wooden Bed", "Chair", "Cupboard", "Others"
  ];

  // Handle import from Excel
  const handleImportFromExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      console.log('Starting Excel import process...', { fileName: file.name, fileSize: file.size });
      await handleImport(file, fetchEmployees);
      console.log('Excel import process completed successfully');
    } catch (error) {
      console.error('Error in Excel import:', error);
    } finally {
      e.target.value = ''; // Reset file input
    }
  };

  // Modified filtered data to include asset type filtering
  const filteredData = React.useMemo(() => {
    if (!assetTypeFilter) return employees;
    
    return employees.filter(employee => 
      employee.assets && 
      employee.assets.some(asset => asset.Item === assetTypeFilter)
    ).map(employee => {
      // Create a new employee object with only the filtered assets
      if (assetTypeFilter) {
        return {
          ...employee,
          assets: employee.assets.filter(asset => asset.Item === assetTypeFilter)
        };
      }
      return employee;
    });
  }, [employees, assetTypeFilter]);
  
  // For display purpose - to show all assets of employees who have the filtered asset type
  const displayData = React.useMemo(() => {
    if (!assetTypeFilter) return employees;
    
    return employees.filter(employee => 
      employee.assets && 
      employee.assets.some(asset => asset.Item === assetTypeFilter)
    );
  }, [employees, assetTypeFilter]);

  // Table columns definition
  const columns = [
    {
      header: 'Name',
      accessorKey: 'emp_name',
      cell: ({ row }) => (
        <div className="capitalize">{row.original.emp_name}</div>
      ),
    },
    {
      header: 'Employee ID',
      accessorKey: 'emp_id',
    },
    {
      header: 'Location',
      accessorKey: 'location',
    },
    {
      header: 'Role',
      accessorKey: 'employee_role',
      cell: ({ row }) => (
        <div className="capitalize">{row.original.employee_role}</div>
      ),
    },
    {
      header: 'Assets',
      accessorKey: 'assets',
      cell: ({ row }) => {
        return (
          <div>
            {row.original.assets && row.original.assets.length > 0 ? (
              <div className="text-sm">
                {row.original.assets.map((asset, index) => (
                  <div key={`${row.original.emp_id}_asset_${index}`} className="mb-1">
                    <span className="font-medium">{asset.Item}</span>
                    {asset.Specification && <span className="text-gray-500 ml-1">({asset.Specification})</span>}
                  </div>
                ))}
              </div>
            ) : (
              'N/A'
            )}
          </div>
        );
      },
    },
    {
      header: 'Purchase Details',
      accessorKey: 'purchaseDetails',
      cell: ({ row }) => {
        if (!row.original.assets || row.original.assets.length === 0) return 'N/A';
        
        return (
          <div className="text-sm">
            {row.original.assets.map((asset, index) => (
              <div key={`${row.original.emp_id}_purchase_${index}`} className="mb-1">
                <div>
                  <span className="font-medium">{asset.Item}: </span>
                  {asset.PurchaseDate ? (
                    <span>{new Date(asset.PurchaseDate).toLocaleDateString()}</span>
                  ) : (
                    <span className="text-gray-500">No date</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Warranty',
      accessorKey: 'warranty',
      cell: ({ row }) => {
        if (!row.original.assets || row.original.assets.length === 0) return 'N/A';
        
        return (
          <div className="text-sm">
            {row.original.assets.map((asset, index) => (
              <div key={`${row.original.emp_id}_warranty_${index}`} className="mb-1">
                {asset.WarrantyPeriod ? (
                  <span><span className="font-medium">{asset.Item}:</span> {asset.WarrantyPeriod}</span>
                ) : null}
              </div>
            )).filter(Boolean)}
          </div>
        );
      },
    },
    {
      header: 'Vendor Name',
      accessorKey: 'vendorName',
      cell: ({ row }) => {
        if (!row.original.assets || row.original.assets.length === 0) return 'N/A';
        
        return (
          <div className="text-sm">
            {row.original.assets.map((asset, index) => (
              <div key={`${row.original.emp_id}_vendorName_${index}`} className="mb-1">
                {asset.VendorName ? (
                  <span>
                    <span className="font-medium">{asset.Item}:</span> {asset.VendorName}
                  </span>
                ) : null}
              </div>
            )).filter(Boolean)}
          </div>
        );
      },
    },
    {
      header: 'Vendor Contact',
      accessorKey: 'vendorContact',
      cell: ({ row }) => {
        if (!row.original.assets || row.original.assets.length === 0) return 'N/A';
        
        return (
          <div className="text-sm">
            {row.original.assets.map((asset, index) => (
              <div key={`${row.original.emp_id}_vendorContact_${index}`} className="mb-1">
                {asset.VendorContactNo ? (
                  <span>
                    <span className="font-medium">{asset.Item}:</span> {asset.VendorContactNo}
                  </span>
                ) : null}
              </div>
            )).filter(Boolean)}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleView(row.original.emp_id)}
            className="p-1 rounded hover:bg-blue-100"
            title="View"
          >
            <Eye size={16} className="text-blue-500" />
          </button>
          <button
            onClick={() => handleEdit(row.original.emp_id)}
            className="p-1 rounded hover:bg-green-100"
            title="Edit"
          >
            <Edit size={16} className="text-green-500" />
          </button>
          <button
            onClick={() => handleDelete(row.original.emp_id)}
            className="p-1 rounded hover:bg-red-100"
            title="Delete"
          >
            <Trash2 size={16} className="text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  // Initialize table
  const table = useReactTable({
    data: displayData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageSize: 7,
      },
    },
  });

  // Action handlers
  const handleView = (id) => {
    navigate(`/dashboard/view/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/dashboard/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        // Store handles state update automatically
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  // Handle export to Excel
  const handleExportToExcel = () => {
    if (filteredData.length === 0) {
      Toast.error('No data to export');
      return;
    }

    // Define columns for export
    const exportColumns = [
      { header: 'Name', key: 'emp_name' },
      { header: 'Employee ID', key: 'emp_id' },
      { header: 'Location', key: 'location' },
      { header: 'Role', key: 'employee_role' },
      // Prepare data for assets (a separate row for each asset)
      { header: 'Asset Item', key: 'Item' },
      { header: 'Specification', key: 'Specification' },
      { header: 'Purchase Date', key: 'PurchaseDate' },
      { header: 'Warranty Period', key: 'WarrantyPeriod' },
      { header: 'Vendor Name', key: 'VendorName' },
      { header: 'Vendor Contact', key: 'VendorContactNo' }
    ];

    // Prepare data for export - flattening the assets
    const flatData = [];
    filteredData.forEach(employee => {
      if (employee.assets && employee.assets.length > 0) {
        // Create a row for each asset
        employee.assets.forEach(asset => {
          flatData.push({
            emp_name: employee.emp_name,
            emp_id: employee.emp_id,
            location: employee.location,
            employee_role: employee.employee_role,
            Item: asset.Item || 'N/A',
            Specification: asset.Specification || 'N/A',
            PurchaseDate: asset.PurchaseDate || 'N/A',
            WarrantyPeriod: asset.WarrantyPeriod || 'N/A',
            VendorName: asset.VendorName || 'N/A',
            VendorContactNo: asset.VendorContactNo || 'N/A'
          });
        });
      } else {
        // Create a row with just the employee data
        flatData.push({
          emp_name: employee.emp_name,
          emp_id: employee.emp_id,
          location: employee.location,
          employee_role: employee.employee_role,
          Item: 'N/A',
          Specification: 'N/A',
          PurchaseDate: 'N/A',
          WarrantyPeriod: 'N/A',
          VendorName: 'N/A',
          VendorContactNo: 'N/A'
        });
      }
    });

    const success = exportToExcel(flatData, 'Employee_Asset_Data', exportColumns);
    if (success) {
      Toast.success('Employee data exported successfully');
    }
  };

  // Fetch employees data from the store
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg h-full flex flex-col relative">
      {/* Import Progress Component */}
      <ImportProgress 
        importing={importing}
        progress={importProgress}
        error={importError}
        success={importSuccess}
        successCount={importStats.successCount}
        failCount={importStats.failCount}
        totalCount={importStats.totalCount}
        onClose={resetImport}
      />
      
      {/* Search Bar and Export Button */}
      <div className="p-3 border-b border-gray-100 flex justify-between items-center">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
          <input
            type="text"
            value={globalFilter || ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search employees..."
            className="pl-10 pr-4 py-3 w-full border border-purple-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50/50"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
            <select
              value={assetTypeFilter}
              onChange={(e) => setAssetTypeFilter(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-purple-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50/50"
            >
              <option value="">Filter by asset type</option>
              {assetTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Excel template download button */}
          <ExcelTemplate />
          
          {/* Import from Excel button */}
          <label htmlFor="excel-upload" className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer">
            <Upload size={18} />
            <span>Import</span>
            <input 
              id="excel-upload" 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              onChange={handleImportFromExcel}
            />
          </label>
          
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            title="Export to Excel"
          >
            <FileSpreadsheet size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-purple-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted()] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.original.emp_id} className="hover:bg-purple-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-6 py-4 text-sm text-gray-700 ${
                        cell.column.columnDef.accessorKey === 'emp_id' ? 'font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded' : ''
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-purple-50/50">
        <div className="flex-1 text-sm text-gray-700">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-full bg-white border border-purple-200 hover:bg-purple-100 disabled:opacity-50 transition-colors"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={18} className="text-purple-600" />
          </button>
          <span className="px-4 py-2 rounded-full bg-white border border-purple-200 text-sm text-purple-800">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            className="p-2 rounded-full bg-white border border-purple-200 hover:bg-purple-100 disabled:opacity-50 transition-colors"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight size={18} className="text-purple-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTable;