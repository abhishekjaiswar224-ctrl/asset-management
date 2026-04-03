import express from 'express';
import { createEmp, getAllEmployees, deleteEmployee, getEmployeeById, updateEmployee, getEmployeeByUserId, batchImportEmployees, getPublicEmployeeInfo } from '../controllers/empController.js';
import { authorizeRole, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin can create any employee, employees can only create their own record
router.post('/', authorizeRole(['admin', 'employee']), createEmp);

// Only admins can see all employees
router.get('/', authorizeRole(['admin']), getAllEmployees);

// Get employee info for current logged in user - accessible by any authenticated user
router.get('/me', authorizeRole(['admin', 'employee']), getEmployeeByUserId);

// Public endpoint - no auth required
router.get('/public/:token', getPublicEmployeeInfo);

// Employees can only access their own data, admins can access any
router.get('/:emp_id', authorizeRole(['admin', 'employee']), getEmployeeById);

// Admin can update any employee, employees can only update their own record
router.put('/:emp_id', authorizeRole(['admin', 'employee']), updateEmployee);

// Admin can delete any employee, employees can only delete their own record
router.delete('/:emp_id', authorizeRole(['admin', 'employee']), deleteEmployee);

// Add the batch import route
router.post('/batch-import', authorizeRole(['admin']), batchImportEmployees);

export default router;
