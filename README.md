# 🏢 Asset Management System

A modern, full-stack web application designed to streamline the tracking, assignment, and management of company assets. Built with a React frontend and a Node.js/Express backend, this system is production-ready and optimized for deployment on AWS (EC2 & RDS).

## ✨ Key Features

- **🔐 Secure Authentication:** JWT-based login and registration with bcrypt password hashing.
- **👥 Role-Based Access Control (RBAC):** Distinct dashboards and permissions for `Admin` and `Employee` roles.
- **💻 Asset Tracking:** Assign and monitor various assets (Laptops, Cars, Real Estate, etc.) with detailed metadata.
- **📁 Batch Import & Export:** Seamlessly import employee and asset data from Excel files, and export current records to `.xlsx`.
- **📧 Password Recovery:** Secure password reset flow using email-based OTP verification (via Nodemailer).
- **📱 Modern UI/UX:** Fully responsive, aesthetically pleasing interface built with Tailwind CSS, featuring smooth animations, toast notifications, and intuitive forms.
- **⚡ Performance & Security:** Optimized with React Code Splitting (Lazy Loading), Express Rate Limiting, Helmet.js for security headers, and Gzip Compression.
- **☁️ Cloud-Ready Monorepo:** Unified build scripts and routing for seamless deployment to AWS EC2 and RDS MySQL.

## 🛠️ Tech Stack

**Frontend (Client):**
- React (Vite)
- Tailwind CSS
- Zustand (State Management)
- React Router DOM
- Axios
- Lucide React (Icons)
- SheetJS / XLSX (Data Export/Import)

**Backend (Server):**
- Node.js & Express.js
- MySQL2 (Connection Pooling)
- JSON Web Tokens (JWT)
- Bcrypt (Cryptography)
- Nodemailer (Email Services)
- Helmet, Compression, Express-Rate-Limit

**Infrastructure:**
- AWS EC2 (Application Hosting)
- AWS RDS (MySQL Database)

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v20 or higher)
- MySQL Server (Local or AWS RDS)

### 1. Database Setup
1. Create a new MySQL database.
2. Execute the required SQL script to generate the `users`, `employees`, and `AssetManagement` tables.

### 2. Environment Configuration
Navigate to the `server` directory and create a `.env` file based on the provided example:

```bash
cd server
cp .env.example .env
```

Update the `server/.env` file with your actual database and email credentials:
```env
PORT=3000
DB_HOST=localhost # Or your AWS RDS Endpoint
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=your_database_name

JWT_SECRET_KEY=your_super_secret_jwt_key
NODE_ENV=development

# For OTP Password Resets
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

### 3. Build and Run (Development)
The project uses a unified monorepo structure. From the root directory, run:

```bash
# Install all dependencies (root, client, and server)
npm run install-all

# Run both frontend and backend concurrently in development mode
npm run dev
```

---

## ☁️ AWS EC2 Production Deployment Guide

Follow these steps to deploy the application on an AWS EC2 instance using PM2 and NGINX.

### 1. Provision Infrastructure
1. **RDS:** Create an AWS RDS MySQL instance. Ensure the Security Group allows inbound traffic on port `3306` from your EC2 instance.
2. **EC2:** Launch an Ubuntu 22.04/24.04 EC2 instance. Open ports `80` (HTTP), `443` (HTTPS), and `22` (SSH) in its Security Group.

### 2. Install Node.js (v20) & Git on EC2
SSH into your EC2 instance and run:
```bash
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Clone & Configure
```bash
git clone <your-repository-url> asset-management
cd asset-management

# Configure environment variables
cd server
cp .env.example .env
nano .env # Add your RDS credentials, JWT secret, and set PORT=3000
cd ..
```

### 4. Build the Project
Run the unified build command from the root directory. This installs all dependencies, builds the React frontend, and moves the optimized static files to `server/public`.
```bash
npm run install-all
npm run build
```

### 5. Setup PM2 (Process Manager)
PM2 ensures your Node.js application stays alive forever and restarts automatically if the server reboots.
```bash
sudo npm install -g pm2

# Start the application
cd server
pm2 start server.js --name "asset-app"

# Configure PM2 to start on boot
pm2 startup
# (Run the command PM2 outputs, then save)
pm2 save
```

### 6. Optional: Setup NGINX Reverse Proxy
To serve your application on port 80 and easily add SSL later, use NGINX.
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/default
```
Replace the contents with:
```nginx
server {
    listen 80;
    server_name your_domain_or_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Restart NGINX:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

Your application is now live and production-ready!

---

## 🔒 Security & Performance Best Practices Implemented
- **Helmet.js:** Secures Express apps by setting various HTTP headers.
- **Express Rate Limit:** Protects APIs against brute-force and DDoS attacks.
- **Compression:** Gzip compression reduces the size of the response body and increases the speed of the web app.
- **React Code Splitting:** `React.lazy` and `Suspense` are used to split the frontend bundle, reducing initial load times.
- **Relative API Routing:** The frontend automatically routes `/api/*` requests to the host, eliminating hardcoded URLs and CORS issues in production.
