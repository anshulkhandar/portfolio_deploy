# Portfolio System - Comprehensive Project Map

This document provides the complete file structure and setup instructions for the Portfolio & Admin Management system, including all core server, logic, and dependency directories.

## 📂 Complete File Structure

```text
Portfolio/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js         # Cloudinary configuration
│   │   └── mongodb.js            # MongoDB database connection
│   ├── DBschema/
│   │   ├── Admin.js              # Admin user model (Hashed password)
│   │   ├── Contact.js            # Contact messages schema
│   │   ├── Education.js          # Education history schema
│   │   ├── Experience.js         # Professional experience schema
│   │   ├── Gallery.js            # Image gallery schema
│   │   ├── Project.js            # Portfolio projects schema
│   │   └── Skill.js              # Technical skills schema
│   ├── node_modules/             # Project dependencies (Example: express, mongoose, etc.)
│   │   ├── axios/
│   │   ├── bcrypt/
│   │   ├── cloudinary/
│   │   ├── cors/
│   │   ├── dotenv/
│   │   ├── express/
│   │   ├── jsonwebtoken/
│   │   ├── mongoose/
│   │   ├── multer/
│   │   ├── nodemailer/
│   │   ├── passport/
│   │   └── [120+ other packages...]
│   ├── .env                      # [PRIVATE] Environment variables
│   ├── package.json              # Main project configuration
│   ├── seedAdmin.js              # Initial admin account setup script
│   └── server.js                 # Main server entry & API routes
├── frontend/
│   ├── dashboard_74829.css       # Private admin portal styles
│   ├── dashboard_74829.html      # Private admin portal page
│   ├── dashboard_74829.js        # Dashboard logic & state management
│   ├── index.css                 # Public portfolio landing styles
│   ├── index.html                # Public portfolio landing page
│   ├── index.js                  # Landing page interactivity
│   ├── panel_access_98342.css    # Secure login page styles
│   ├── panel_access_98342.html   # Secure login page interface
│   ├── panel_access_98342.js     # JWT & OAuth login logic
│   ├── project.css               # Project detail view styles
│   ├── project.html              # Dynamic project detail page
│   └── project.js                # Media carousel & project details logic
├── requirement.txt               # Base OS environment dependencies
└── README.md                     # This documentation map
```

## 🚀 Setup Guide (Step-by-Step)

### Step 1: Base Environment
Run the following in your command prompt to bootstrap the Node.js runtime:
```bash
pip install -r requirement.txt
```

### Step 2: Install Libraries
Navigate to the `backend` folder and download all the project parts (Mongoose, Express, etc.):
```bash
cd backend
npm install
```

### Step 3: Secret Configuration (.env)
Create a `.env` file in the `backend` directory with your private keys. You can use the provided `.env.example` file as a template:
```bash
# Server Configuration
PORT=5000

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_key_here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# Google SMTP (For sending emails)
EMAIL_USER=your_email_address@gmail.com
EMAIL_PASS=your_email_app_password_here
```

### Step 4: Admin Initialization
Run the seeding script to create your first secure account:
```bash
node seedAdmin.js
```

### Step 5: Start the Server
```bash
node server.js
```
The application will be live at `http://localhost:5000`.
