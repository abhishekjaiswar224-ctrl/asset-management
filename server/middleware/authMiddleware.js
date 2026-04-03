import jwt from 'jsonwebtoken';
import pool from '../db.js';

const verifyToken = (req, res, next) => {
  console.log('verifyToken: Starting token verification');
  console.log('verifyToken: Request path:', req.path);
  
  try {
    const token = req.cookies['assets_token'];
    
    // If no token in cookies, try to get from Authorization header
    if (!token) {
      console.log('verifyToken: No token found in cookies, checking headers');
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const headerToken = authHeader.substring(7);
        console.log('verifyToken: Found token in Authorization header');
        req.user = jwt.verify(headerToken, process.env.JWT_SECRET_KEY);
        console.log('verifyToken: Token verified from header for user:', req.user.userId, 'with role:', req.user.role);
        next();
        return;
      }
      console.log('verifyToken: No valid token found in cookies or headers');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    if (!process.env.JWT_SECRET_KEY) {
      console.error('verifyToken: JWT_SECRET_KEY is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    console.log('verifyToken: Verifying token from cookies');
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    console.log('verifyToken: Token verified successfully for user:', decoded.userId, 'with role:', decoded.role);
    next();
  } catch (error) {
    console.error('verifyToken: Token verification failed:', error.message);
    return res.status(403).json({ message: 'Failed to authenticate token' });
  }
};

const authorizeRole = (roles) => {
  return async (req, res, next) => {
    console.log(`authorizeRole: Checking if user has one of these roles: ${roles.join(', ')}`);
    console.log(`authorizeRole: Request path: ${req.path}`);
    console.log(`authorizeRole: Request method: ${req.method}`);
    console.log(`authorizeRole: Request body keys: ${Object.keys(req.body)}`);
    
    verifyToken(req, res, async () => {
      if (!req.user) {
        console.log('authorizeRole: No user object found after token verification');
        return; // verifyToken already handles unauthorized cases
      }
      
      console.log(`authorizeRole: User ID: ${req.user.userId}, Role: ${req.user.role}, Required roles: ${roles.join(', ')}`);
      
      // Check if user has the required role
      if (roles.includes(req.user.role)) {
        // For employees, check if they're accessing their own data when using routes with emp_id parameter
        if (req.user.role === 'employee' && req.params.emp_id) {
          try {
            console.log(`authorizeRole: Employee role user trying to access emp_id: ${req.params.emp_id}`);
            // Check if this employee_id belongs to the current user by checking the users table
            const [userEmployeeLink] = await pool.query(
              "SELECT * FROM users WHERE id = ? AND emp_id = ?",
              [req.user.userId, req.params.emp_id]
            );
            
            console.log(`authorizeRole: Employee access check result: ${userEmployeeLink.length > 0 ? 'Authorized' : 'Unauthorized'}`);
            
            // Check if the employee is trying to access their own record
            if (userEmployeeLink.length === 0) {
              console.log(`authorizeRole: Access denied - Employee (${req.user.userId}) tried to access different emp_id: ${req.params.emp_id}`);
              return res.status(403).json({ 
                message: "Unauthorized: Employees can only access their own information" 
              });
            }
          } catch (error) {
            console.error("authorizeRole: Error checking employee authorization:", error);
            return res.status(500).json({ error: "Internal server error during authorization" });
          }
        }
        
        console.log(`authorizeRole: User ${req.user.userId} with role ${req.user.role} authorized for this action`);
        next(); // Role is authorized, proceed
      } else {
        console.log(`authorizeRole: User ${req.user.userId} with role ${req.user.role} not authorized (needs one of: ${roles.join(', ')})`);
        res.status(403).json({ message: "Unauthorized role" }); // Forbidden
      }
    });
  };
};

export { verifyToken, authorizeRole };
