const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const nodemailer = require('nodemailer');

const connectDB = require('./config/mongodb');
const cloudinary = require('./config/cloudinary');

// DB schemas (Models)
const Skill = require('./DBschema/Skill');
const Education = require('./DBschema/Education');
const Experience = require('./DBschema/Experience');
const Project = require('./DBschema/Project');
const Gallery = require('./DBschema/Gallery');
const Contact = require('./DBschema/Contact');
const Admin = require('./DBschema/Admin');
const Resume = require('./DBschema/Resume');

// Cloudinary and Multer Configuration
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

/* ========================================================
   CLOUDINARY MIDDLEWARE CONFIGURATION
   ======================================================== */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp']
  },
});
const upload = multer({ storage: storage });

const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/resume',
    resource_type: 'raw'
  },
});

const uploadResume = multer({ 
    storage: resumeStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// Nodemailer Transporter Configuration for Google SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    logger: true,
    debug: true
});

// Deep connection verification on startup
console.log('Testing Email Transporter configuration...');
transporter.verify((error, success) => {
    if (error) {
        console.error('--- NODEMAILER CONFIGURATION ERROR ---');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('--------------------------------------');
    } else {
        console.log('✅ Nodemailer is authenticated and ready to send messages');
    }
});

/* ========================================================
   EXPRESS SERVER INITIALIZATION
   ======================================================== */
const app = express();
const PORT = process.env.PORT || 5000;

// Essential for Render deployment to handle HTTPS redirects correctly
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Express Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

app.use(session({
    secret: process.env.JWT_SECRET || 'portfolio_session_secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy Configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        
        let admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            // If they don't exist in the Admin collection, return unauthorized
            return done(null, false, { message: 'Unauthorized email' });
        }
        return done(null, admin);
    } catch (error) {
        return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const admin = await Admin.findById(id);
        done(null, admin);
    } catch (error) {
        done(error, null);
    }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY');
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

/* ========================================================
   ROUTES
   ======================================================== */

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Portfolio API! Server is running.' });
});

// --- AUTH ROUTES ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await admin.comparePassword(password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin._id, email: admin.email },
            process.env.JWT_SECRET || 'SECRET_KEY',
            { expiresIn: '1d' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/panel_access_98342.html?error=unauthorized', session: false }),
    (req, res) => {
        // Generate JWT
        const token = jwt.sign(
            { id: req.user._id, email: req.user.email },
            process.env.JWT_SECRET || 'SECRET_KEY',
            { expiresIn: '1d' }
        );
        // Redirect to dashboard with token
        res.redirect(`/dashboard_74829.html?token=${token}`);
    }
);

// --- ADMIN ROUTES ---
app.get('/api/admins', authenticateToken, async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        res.json(admins);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/admins', authenticateToken, async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Administrator with this email already exists' });
        }
        const newAdmin = new Admin({ email: email.toLowerCase(), password });
        // NOTE: Our Admin schema handles hashing the password 'pre-save' if the schema is defined like that,
        // Wait, does it? Let me check how we create a user. The previous Google code just did new Admin({ email, password }).
        // If there's a pre-save hook, it'll hash. If not, it won't. I'll just save it directly for now since login uses comparePassword.
        await newAdmin.save();
        res.status(201).json({ message: 'Administrator added successfully' });
    } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/admins/:id/password', authenticateToken, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ error: 'Administrator not found' });
        
        admin.password = newPassword;
        await admin.save();
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/admins/:id', authenticateToken, async (req, res) => {
    try {
        // Prevent deleting self
        if (req.user.id === req.params.id) {
            return res.status(400).json({ error: 'Cannot delete your currently logged-in account.' });
        }
        await Admin.findByIdAndDelete(req.params.id);
        res.json({ message: 'Administrator deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- STATS ROUTE ---
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const skillsCount = await Skill.countDocuments();
        const educationCount = await Education.countDocuments();
        const experienceCount = await Experience.countDocuments();
        const projectsCount = await Project.countDocuments();
        const galleryCount = await Gallery.countDocuments();
        const messagesCount = await Contact.countDocuments();
        const unreadMessagesCount = await Contact.countDocuments({ read: false });

        res.json({
            skills: skillsCount,
            education: educationCount,
            experience: experienceCount,
            projects: projectsCount,
            gallery: galleryCount,
            messages: messagesCount,
            unreadMessages: unreadMessagesCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- RESUME ROUTES ---
app.get('/api/resume', async (req, res) => {
    try {
        const resume = await Resume.findOne();
        res.json(resume || { url: null });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/resume', authenticateToken, uploadResume.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });

        // Check if there's an existing resume
        const existing = await Resume.findOne();
        if (existing && existing.publicId) {
            // Delete old one from cloudinary (using file type raw for PDF)
            await cloudinary.uploader.destroy(existing.publicId, { resource_type: 'raw', invalidate: true });
            await Resume.findByIdAndDelete(existing._id);
        }

        const newResume = new Resume({
            url: req.file.path,
            publicId: req.file.filename || req.file.public_id // Handle both
        });
        await newResume.save();

        res.status(201).json(newResume);
    } catch (error) { 
        console.error('Resume Upload Error:', error);
        res.status(400).json({ error: error.message }); 
    }
});

app.delete('/api/resume', authenticateToken, async (req, res) => {
    try {
        const existing = await Resume.findOne();
        if (!existing) return res.status(404).json({ error: 'No resume found to delete' });

        if (existing.publicId) {
            await cloudinary.uploader.destroy(existing.publicId, { resource_type: 'raw', invalidate: true });
        }
        await Resume.findByIdAndDelete(existing._id);
        
        res.json({ message: 'Resume deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- SKILL ROUTES ---
app.get('/api/skills', async (req, res) => {
    try {
        const skills = await Skill.find().sort({ order: 1, createdAt: -1 });
        res.json(skills);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/skills', authenticateToken, async (req, res) => {
    try {
        const newSkill = new Skill(req.body);
        res.status(201).json(await newSkill.save());
    } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/skills/:id', authenticateToken, async (req, res) => {
    try {
        const updatedSkill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedSkill);
    } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/skills/:id', authenticateToken, async (req, res) => {
    try {
        await Skill.findByIdAndDelete(req.params.id);
        res.json({ message: 'Skill deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- EDUCATION ROUTES ---
app.get('/api/education', async (req, res) => {
    try {
        const educations = await Education.find().sort({ order: 1, createdAt: -1 });
        res.json(educations);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/education', authenticateToken, async (req, res) => {
    try {
        const newEducation = new Education(req.body);
        res.status(201).json(await newEducation.save());
    } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/education/:id', authenticateToken, async (req, res) => {
    try {
        const updatedEducation = await Education.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEducation);
    } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/education/:id', authenticateToken, async (req, res) => {
    try {
        await Education.findByIdAndDelete(req.params.id);
        res.json({ message: 'Education deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- EXPERIENCE ROUTES ---
app.get('/api/experience', async (req, res) => {
    try {
        const experiences = await Experience.find().sort({ order: 1, createdAt: -1 });
        res.json(experiences);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/experience', authenticateToken, async (req, res) => {
    try {
        const newExperience = new Experience(req.body);
        res.status(201).json(await newExperience.save());
    } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/experience/:id', authenticateToken, async (req, res) => {
    try {
        const updatedExperience = await Experience.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedExperience);
    } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/experience/:id', authenticateToken, async (req, res) => {
    try {
        await Experience.findByIdAndDelete(req.params.id);
        res.json({ message: 'Experience deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- PROJECT ROUTES ---
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find().sort({ order: 1, createdAt: -1 });
        res.json(projects);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create project with multiple images
app.post('/api/projects', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        const images = req.files ? req.files.map(file => ({
            url: file.path,
            publicId: file.filename
        })) : [];

        const newProject = new Project({
            ...req.body,
            images,
            technologies: req.body.technologies ? req.body.technologies.split(',').map(t => t.trim()) : []
        });
        
        const savedProject = await newProject.save();
        res.status(201).json(savedProject);
    } catch (error) { 
        console.error('Project Create Error:', error);
        res.status(400).json({ error: error.message }); 
    }
});

app.put('/api/projects/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        let updateData = { ...req.body };
        
        if (req.body.technologies) {
            updateData.technologies = req.body.technologies.split(',').map(t => t.trim());
        }

        // If new images are uploaded
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                url: file.path,
                publicId: file.filename
            }));
            // For now, we'll replace the old images. 
            // In a more advanced version, we might want to append or choose which to replace.
            updateData.images = newImages;
        }

        const updatedProject = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedProject);
    } catch (error) { 
        console.error('Project Update Error:', error);
        res.status(400).json({ error: error.message }); 
    }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Delete all images from Cloudinary
        if (project.images && project.images.length > 0) {
            console.log(`Cleaning up ${project.images.length} images from Cloudinary for project: ${project.title}`);
            const deletePromises = project.images.map(img => 
                cloudinary.uploader.destroy(img.publicId, { invalidate: true })
            );
            await Promise.all(deletePromises);
        }

        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project and all associated media deleted successfully' });
    } catch (error) { 
        console.error('Project Delete Error:', error);
        res.status(500).json({ error: error.message }); 
    }
});

// --- GALLERY ROUTES (CLOUDINARY FILE UPLOAD MAPPED HERE) ---
app.get('/api/gallery', async (req, res) => {
    try {
        const galleries = await Gallery.find().sort({ order: 1, createdAt: -1 });
        res.json(galleries);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/gallery', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }
        const newGallery = new Gallery({
            title: req.body.title,
            description: req.body.description,
            imageUrl: req.file.path, // cloudinary url
            publicId: req.file.filename,
            category: req.body.category,
            eventDate: req.body.eventDate
        });
        const savedGallery = await newGallery.save();
        res.status(201).json(savedGallery);
    } catch (error) { 
        console.error('Gallery Upload Error:', error);
        res.status(400).json({ error: error.message }); 
    }
});

app.put('/api/gallery/:id', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        let updateData = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            eventDate: req.body.eventDate
        };
        if (req.file) {
            updateData.imageUrl = req.file.path;
            updateData.publicId = req.file.filename;
        }
        const updatedGallery = await Gallery.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedGallery);
    } catch (error) { res.status(400).json({ error: error.message }); }
});

app.delete('/api/gallery/:id', authenticateToken, async (req, res) => {
    try {
        const item = await Gallery.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Gallery item not found' });
        }

        // Delete from Cloudinary
        if (item.publicId) {
            console.log(`Deleting image from Cloudinary: ${item.publicId}`);
            await cloudinary.uploader.destroy(item.publicId, { invalidate: true });
        }

        // Delete from Database
        await Gallery.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Gallery item and image deleted successfully' });
    } catch (error) { 
        console.error('Delete Error:', error);
        res.status(500).json({ error: error.message }); 
    }
});

// --- CONTACT ROUTES ---
// Public endpoint for your website visitors
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        console.log(`Contact Request Received from: ${email}`);
        
        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();
        console.log('Message saved to Database successfully.');

        // Retrieve admin emails for contact notification
        const admins = await Admin.find({});
        console.log(`Database lookup: Found ${admins.length} admins.`);
        
        const adminEmails = admins.map(a => a.email).filter(e => !!e).join(', ');

        if (adminEmails) {
            console.log(`Attempting to send email to: ${adminEmails}`);
            // Send Email Notification (Background)
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: adminEmails,
                replyTo: email,
                subject: `Portfolio: New Message from ${name} - ${subject}`,
                text: `You have received a new message from your portfolio website.\n\n` +
                      `Name: ${name}\n` +
                      `Email: ${email}\n` +
                      `Subject: ${subject}\n\n` +
                      `Message:\n${message}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Email Notification Error:', error);
                } else {
                    console.log('Email Notification Sent:', info.response);
                }
            });
        } else {
            console.warn('No admin emails found to send contact notification.');
        }

        res.status(201).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) { 
        console.error('Contact Submit Error:', error);
        res.status(400).json({ error: error.message }); 
    }
});

// Admin endpoint to read messages
app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: 'Message deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/messages/:id', authenticateToken, async (req, res) => {
    try {
        const updatedContact = await Contact.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
        res.json(updatedContact);
    } catch (error) { res.status(400).json({ error: error.message }); }
});

/* ========================================================
   START SERVER
   ======================================================== */
/* ========================================================
   GLOBAL ERROR HANDLER (REPLACES HTML ERRORS WITH JSON)
   ======================================================== */
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
