import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';



// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' ? true : false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const generateTokenAndSetCookie = (userId, role, res) => {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET_KEY, {
    expiresIn: '30d'
  });
  
  // Cookie settings optimized for IP-based access
  res.cookie("assets_token", token, {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
    httpOnly: true,
    sameSite: 'lax', // Changed from 'none' to 'lax'
    secure: false     // Since you're likely using HTTP on EC2
  });

  return token;
};

const signup = async (req, res) => {
  // Destructure empId instead of username
  const { empId,email,password, role: requestedRole } = req.body; 
  // Set role to 'employee' by default if no role specified
  const role = requestedRole || 'employee';

  // Validate empId, password, email
  if (!empId || !password || !email) {
    return res.status(400).json({ message: 'Employee ID, password, and email are required' }); // Updated message
  }

  try {
    // Check if emp_id already exists in users table
    const [existingUser] = await pool.query('SELECT * FROM users WHERE emp_id = ?', [empId]);
    
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Employee ID already registered' }); // Updated message
    }
    
    // Check if email already exists
    const [existingEmail] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert data into users table, removing username column which doesn't exist
    const [newUser] = await pool.query(
      'INSERT INTO users (emp_id, password, role, email) VALUES (?, ?, ?, ?)', 
      [empId, hashedPassword, role, email]
    );

    const token = generateTokenAndSetCookie(newUser.insertId, role, res);

    res.status(201).json({ 
      message: 'User created successfully', 
      role,
      userId: newUser.insertId 
      // Consider returning empId or username (which is empId now) if needed by frontend immediately
    }); 
  } catch (error) {
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
};

const login = async (req, res) => {
  const { empId, password } = req.body; // Changed from username to empId

  if (!empId || !password) {
    return res.status(400).json({ message: 'Employee ID and password are required' }); // Updated message
  }

  try {
    // Query by emp_id instead of username
    const [users] = await pool.query('SELECT * FROM users WHERE emp_id = ?', [empId]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateTokenAndSetCookie(user.id, user.role, res);

    res.status(200).json({ 
      message: 'Login successful', 
      role: user.role, 
      userId: user.id,
      email: user.email,
      emp_id: user.emp_id,  // Include emp_id in the response
      username: user.emp_id // Use emp_id as username for consistency
    }); 
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const authCheck = async (req, res) => {
  try {
    // Get user's email and emp_id information using async/await for better error handling
    const [users] = await pool.query('SELECT email, emp_id FROM users WHERE id = ?', [req.user.userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        authenticated: false,
        message: "User data not found"
      });
    }
    
    // Return the complete user information
    return res.status(200).json({
      authenticated: true,
      userId: req.user.userId,
      role: req.user.role,
      email: users[0].email,
      emp_id: users[0].emp_id,
      username: users[0].emp_id  // Use emp_id as username for consistency
    });
  } catch (error) {
    console.error("Error fetching user data in authCheck:", error);
    return res.status(500).json({
      authenticated: false,
      message: "Error fetching user data",
      error: error.message
    });
  }
};

const logout = (req, res) => {
  try {
    // Clear cookie with same settings
    res.clearCookie('assets_token', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax', // Changed from 'none' to 'lax'
      secure: false
    });
    
    // Force expiration
    res.cookie('assets_token', '', { 
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      sameSite: 'lax', // Changed from 'none' to 'lax'
      secure: false
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};

/**
 * Request a password reset by generating and sending OTP
 */
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if user exists with that email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    // Always return success for security (even if user not found)
    if (users.length === 0) {
      return res.status(200).json({ message: 'If your account exists, you will receive an OTP' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60000); // 15 minutes
    
    // Save OTP to database
    await pool.query(
      'UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE id = ?',
      [otp, otpExpires, users[0].id]
    );
    
    // Send OTP via email
    try {
      await transporter.sendMail({
        from: `"Asset Management System" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset OTP",
        html: `
          <h1>Password Reset Code</h1>
          <p>You requested a password reset for your Asset Management System account.</p>
          <p>Your verification code is:</p>
          <h2 style="font-size: 36px; letter-spacing: 5px; background-color: #f2f2f2; padding: 10px; text-align: center;">${otp}</h2>
          <p>This code is valid for 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      // Don't expose email sending failures to the client for security
    }
    
    // In development mode, include the OTP in the response
    // This is helpful for testing when email delivery is not configured
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
      return res.status(200).json({ 
        message: 'If your account exists, you will receive an OTP',
        devOtp: otp // Only included in development mode
      });
    }
    
    res.status(200).json({ message: 'If your account exists, you will receive an OTP' });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred' });
  }
};

/**
 * Verify OTP and create a temporary session token
 */
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    // Find user with matching email and non-expired OTP
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND reset_otp = ? AND reset_otp_expires > ?',
      [email, otp, new Date()]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Generate a reset token (for frontend to use in reset password call)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store the reset token but keep the original expiration time intact
    await pool.query(
      'UPDATE users SET reset_otp = ? WHERE id = ?',
      [resetToken, users[0].id]
    );
    
    res.status(200).json({ 
      message: 'OTP verified successfully',
      resetToken: resetToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed' });
  }
};

/**
 * Reset password with token from OTP verification
 */
const resetPassword = async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ message: 'Email, reset token and new password are required' });
  }

  try {
    const currentDate = new Date();
    
    // First, get the user to check their token details without the expiration check
    const [userData] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    // Find user with matching email and reset token that hasn't expired
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND reset_otp = ? AND reset_otp_expires > ?',
      [email, resetToken, currentDate]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset fields
    await pool.query(
      'UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );
    
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Password reset failed' });
  }
};

/**
 * Get user account details by emp_id (admin only)
 */
const getUserByEmpId = async (req, res) => {
  const { emp_id } = req.params;

  if (!emp_id) {
    return res.status(400).json({ message: 'Employee ID is required' });
  }

  try {
    // Get user details excluding password
    const [users] = await pool.query(
      'SELECT id, emp_id, email, role, last_login, isactive FROM users WHERE emp_id = ?',
      [emp_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
};

/**
 * Reset user password (admin only)
 */
const resetPasswordAdmin = async (req, res) => {
  console.log('resetPasswordAdmin: Function called');
  console.log('resetPasswordAdmin: Request body:', JSON.stringify(req.body, null, 2));
  console.log('resetPasswordAdmin: Request user:', req.user ? JSON.stringify({ userId: req.user.userId, role: req.user.role }, null, 2) : 'No user');
  
  const { emp_id, newPassword } = req.body;

  if (!emp_id || !newPassword) {
    console.log('resetPasswordAdmin: Missing required fields:', { 
      emp_id: emp_id ? 'provided' : 'missing', 
      newPassword: newPassword ? 'provided' : 'missing' 
    });
    return res.status(400).json({ message: 'Employee ID and new password are required' });
  }

  try {
    // Find user by emp_id
    console.log(`resetPasswordAdmin: Looking for user with emp_id: ${emp_id}`);
    const [users] = await pool.query('SELECT * FROM users WHERE emp_id = ?', [emp_id]);
    
    if (users.length === 0) {
      console.log(`resetPasswordAdmin: User with emp_id ${emp_id} not found`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`resetPasswordAdmin: User found with id: ${users[0].id}`);

    // Hash new password
    console.log('resetPasswordAdmin: Hashing password');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    console.log(`resetPasswordAdmin: Updating password for user with emp_id: ${emp_id}`);
    const [updateResult] = await pool.query(
      'UPDATE users SET password = ? WHERE emp_id = ?',
      [hashedPassword, emp_id]
    );
    
    console.log('resetPasswordAdmin: Update result:', JSON.stringify(updateResult, null, 2));
    
    if (updateResult.affectedRows === 0) {
      console.log('resetPasswordAdmin: No rows affected by update');
      return res.status(500).json({ message: 'Failed to update password' });
    }
    
    console.log('resetPasswordAdmin: Password updated successfully');
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('resetPasswordAdmin: Error:', error);
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
};

/**
 * Admin-only endpoint to create user accounts without logging in
 */
const adminCreateUser = async (req, res) => {
  // Destructure request body
  const { empId, email, password, role: requestedRole } = req.body;
  
  // Set role to 'employee' by default if no role specified
  const role = requestedRole || 'employee';

  // Validate inputs
  if (!empId || !password || !email) {
    return res.status(400).json({ message: 'Employee ID, password, and email are required' });
  }

  try {
    // Check if emp_id already exists in users table
    const [existingUser] = await pool.query('SELECT * FROM users WHERE emp_id = ?', [empId]);
    
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Employee ID already registered' });
    }
    
    // Check if email already exists
    const [existingEmail] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert data into users table
    const [newUser] = await pool.query(
      'INSERT INTO users (emp_id, password, role, email) VALUES (?, ?, ?, ?)', 
      [empId, hashedPassword, role, email]
    );

    // Return success but don't set any cookies or login the user
    res.status(201).json({ 
      message: 'User account created successfully', 
      userId: newUser.insertId,
      role
    });
  } catch (error) {
    res.status(500).json({ message: 'Account creation failed', error: error.message });
  }
};

export { 
  signup, 
  login, 
  authCheck, 
  logout, 
  requestPasswordReset, 
  verifyOtp, 
  resetPassword,
  getUserByEmpId,
  resetPasswordAdmin,
  adminCreateUser
};
