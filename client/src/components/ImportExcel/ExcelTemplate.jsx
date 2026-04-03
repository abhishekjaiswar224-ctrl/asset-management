import React from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import Toast from '../../Toast';


const ExcelTemplate = () => {
  const downloadImportTemplate = () => {
    try {
      const templateData = [
        {
          'Employee Name': 'John Doe',
          'Employee ID': '12345',
          'Location': 'New York',
          'Employee Role': 'Developer',
          'Asset Item': 'Laptop',
          'Specification': 'MacBook Pro M1',
          'Purchase Date': '2023-01-15',
          'Warranty Period': '2 years',
          'Vendor Name': 'Apple Store',
          'Vendor Contact No': '123-456-7890'
        },
        {
          'Employee Name': 'John Doe',
          'Employee ID': '12345',
          'Location': 'New York',
          'Employee Role': 'Developer',
          'Asset Item': 'Mobile',
          'Specification': 'iPhone 13',
          'Purchase Date': '2023-02-20',
          'Warranty Period': '1 year',
          'Vendor Name': 'AT&T',
          'Vendor Contact No': '987-654-3210'
        },
        {
          'Employee Name': 'Jane Smith',
          'Employee ID': '67890',
          'Location': 'San Francisco',
          'Employee Role': 'Manager',
          'Asset Item': 'Laptop',
          'Specification': 'Dell XPS 15',
          'Purchase Date': '2023-03-10',
          'Warranty Period': '3 years',
          'Vendor Name': 'Dell',
          'Vendor Contact No': '555-123-4567'
        }
      ];
      
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // Set column widths for better readability
      const wscols = [
        {wch: 15}, // Employee Name
        {wch: 12}, // Employee ID
        {wch: 15}, // Location
        {wch: 15}, // Employee Role
        {wch: 12}, // Asset Item
        {wch: 20}, // Specification
        {wch: 12}, // Purchase Date
        {wch: 15}, // Warranty Period
        {wch: 15}, // Vendor Name
        {wch: 15}  // Vendor Contact
      ];
      worksheet['!cols'] = wscols;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
      
      // Add instructions in a second sheet
      const instructions = [
        ['Instructions for importing employee data:'],
        [''],
        ['1. Each row represents one employee-asset combination'],
        ['2. For employees with multiple assets, repeat employee information in multiple rows (see example)'],
        ['3. Employee Name and Employee ID are required fields'],
        ['4. Date format should be YYYY-MM-DD'],
        ['5. Do not change the column headers'],
        ['6. For data with many employees or assets, consider splitting into multiple imports'],
        ['7. Maximum recommended import size is 500 rows at a time']
      ];
      
      const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
      // Set column width for instructions
      instructionSheet['!cols'] = [{wch: 80}];
      
      XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');
      
      XLSX.writeFile(workbook, 'employee_assets_template.xlsx');
      Toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      Toast.error('Failed to download template');
    }
  };

  return (
    <button
      onClick={downloadImportTemplate}
      className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
      title="Download Import Template"
    >
      <Download size={16} />
      <span className="text-sm">Template</span>
    </button>
  );
};

export default ExcelTemplate;