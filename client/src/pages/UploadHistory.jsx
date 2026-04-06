import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Search, Download, FileSpreadsheet, Calendar, User, Database, Users, UploadCloud } from 'lucide-react';
import FileUpload from '../components/FileUpload';

const UploadHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAssets: 0, activeUsers: 0, uploadsCount: 0 });
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: ''
  });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`/api/files/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
      
      // Calculate basic stats from history (in a real app, this would come from a dedicated stats endpoint)
      setStats({
        totalAssets: response.data.length * 150, // Mock data based on uploads
        activeUsers: new Set(response.data.map(item => item.uploaded_by)).size || 1,
        uploadsCount: response.data.length
      });
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDownload = async (id, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/files/url/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Open presigned URL in new tab to download
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error('Failed to get download URL', error);
      alert('Failed to download file. It might have expired or been deleted.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Asset Data Management</h1>
        <p className="mt-1 text-sm text-gray-500">Upload new asset data and view historical uploads.</p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Assets Tracked</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalAssets}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Users</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Uploads</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.uploadsCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <FileUpload onUploadSuccess={fetchHistory} />
        </div>

        {/* History Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload History</h3>
              
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    placeholder="Search file or user..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                  />
                </div>
              </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No upload history found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileSpreadsheet className="flex-shrink-0 h-5 w-5 text-green-500 mr-3" />
                            <span className="text-sm font-medium text-gray-900">{item.file_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <User className="flex-shrink-0 h-4 w-4 mr-2" />
                            {item.uploaded_by}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="flex-shrink-0 h-4 w-4 mr-2" />
                            {format(new Date(item.upload_date), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDownload(item.id, item.file_name)}
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-end w-full"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadHistory;
