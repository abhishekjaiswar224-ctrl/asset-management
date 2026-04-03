import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Validate all required environment variables
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}. Please check your .env file.`);
}

// Check for placeholder values
if (process.env.DB_HOST.includes('your-') || process.env.DB_HOST === 'localhost') {
    console.warn(`Warning: Your DB_HOST is set to "${process.env.DB_HOST}". Make sure this is correct for your environment.`);
}

// MySQL configuration
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000
};

// Create connection pool
const pool = mysql.createPool(config);

// Export the pool directly
export default pool;
