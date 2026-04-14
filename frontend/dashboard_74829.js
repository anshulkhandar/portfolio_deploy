const params = new URLSearchParams(window.location.search);
const urlToken = params.get("token");
if (urlToken) {
    localStorage.setItem("token", urlToken);
    window.location.href = "dashboard_74829.html";
}

const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "panel_access_98342.html";
}

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://your-backend-name.onrender.com'; // Replace with your Render URL after deployment

// ===== DOM ELEMENTS =====
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebarClose');
const menuToggle = document.getElementById('menuToggle');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const pageTitle = document.getElementById('pageTitle');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// ===== STATE =====
let authToken = localStorage.getItem('token');
let currentSection = 'overview';
let deleteCallback = null;
let editingId = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard DOM Loaded');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    initAuth();
    initSidebar();
    initNavigation();
    initLogout();
    initDeleteModal();
});

// ===== AUTHENTICATION =====
function initAuth() {
    authToken = localStorage.getItem('token');
    if (!authToken) {
        window.location.href = 'panel_access_98342.html';
        return;
    }
    userName.textContent = 'Admin';
    loadAllData();
}

// ===== SIDEBAR =====
function initSidebar() {
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }
    
    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }
}

// ===== NAVIGATION =====
function initNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
            sidebar.classList.remove('active');
        });
    });
}

function showSection(sectionName) {
    // Update nav items
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionName);
    });
    
    // Update sections
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update page title
    const titles = {
        overview: 'Dashboard Overview',
        skills: 'Manage Skills',
        education: 'Manage Education',
        experience: 'Manage Experience',
        projects: 'Manage Projects',
        gallery: 'Manage Gallery',
        messages: 'View Messages',
        settings: 'Settings'
    };
    pageTitle.textContent = titles[sectionName] || 'Dashboard';
    
    currentSection = sectionName;
    
    // Load section data
    loadSectionData(sectionName);
}

// ===== LOAD ALL DATA =====
async function loadAllData() {
    console.log('Loading all dashboard data...');
    try {
        await loadStats();
        await loadMessages();
    } catch (error) {
        console.error('Error in loadAllData:', error);
    }
}

async function loadSectionData(section) {
    console.log('Loading section data:', section);
    try {
        switch(section) {
            case 'skills':
                await loadSkills();
                break;
            case 'education':
                await loadEducation();
                break;
            case 'experience':
                await loadExperience();
                break;
            case 'projects':
                await loadProjects();
                break;
            case 'gallery':
                await loadGallery();
                break;
            case 'messages':
                await loadMessages();
                break;
            case 'settings':
                await loadAdmins();
                await loadResumeStatus();
                break;
        }
    } catch (error) {
        console.error('Error loading section data:', error);
    }
}

// ===== LOAD STATS =====
async function loadStats() {
    console.log('Fetching stats...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`, {
            headers: { 'Authorization': authToken }
        });
        
        console.log('Stats response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        console.log('Stats received:', stats);
        
        document.getElementById('statsSkills').textContent = stats.skills || 0;
        document.getElementById('statsEducation').textContent = stats.education || 0;
        document.getElementById('statsExperience').textContent = stats.experience || 0;
        document.getElementById('statsProjects').textContent = stats.projects || 0;
        document.getElementById('statsGallery').textContent = stats.gallery || 0;
        document.getElementById('statsMessages').textContent = stats.messages || 0;
        
        const badge = document.getElementById('messageBadge');
        if (badge) {
            badge.textContent = stats.unreadMessages || 0;
            badge.style.display = stats.unreadMessages > 0 ? 'inline-block' : 'none';
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ===== LOAD SKILLS =====
async function loadSkills() {
    const tbody = document.querySelector('#skillsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    console.log('Fetching skills...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/skills`, {
            headers: { 'Authorization': authToken }
        });
        console.log('Skills response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const skills = await response.json();
        console.log('Skills received:', skills);
        
        if (!Array.isArray(skills) || skills.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-code"></i><p>No skills found</p></td></tr>';
            return;
        }
        
        tbody.innerHTML = skills.map(skill => `
            <tr>
                <td>${escapeHtml(skill.name)}</td>
                <td>${escapeHtml(skill.category)}</td>
                <td>${escapeHtml(skill.level)}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn edit" onclick="editSkill('${skill._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="table-btn delete" onclick="confirmDelete('skill', '${skill._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading skills:', error);
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load skills: ${error.message}</p></td></tr>`;
    }
}

// ===== LOAD EDUCATION =====
async function loadEducation() {
    const tbody = document.querySelector('#educationTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    console.log('Fetching education...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/education`, {
            headers: { 'Authorization': authToken }
        });
        console.log('Education response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const education = await response.json();
        console.log('Education received:', education);
        
        if (!Array.isArray(education) || education.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-graduation-cap"></i><p>No education entries found</p></td></tr>';
            return;
        }
        
        tbody.innerHTML = education.map(edu => `
            <tr>
                <td>${escapeHtml(edu.institution)}</td>
                <td>${escapeHtml(edu.degree)}</td>
                <td>${escapeHtml(edu.startDate)} - ${escapeHtml(edu.endDate)}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn edit" onclick="editEducation('${edu._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="table-btn delete" onclick="confirmDelete('education', '${edu._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading education:', error);
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load education: ${error.message}</p></td></tr>`;
    }
}

// ===== LOAD EXPERIENCE =====
async function loadExperience() {
    const tbody = document.querySelector('#experienceTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    console.log('Fetching experience...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/experience`, {
            headers: { 'Authorization': authToken }
        });
        console.log('Experience response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const experience = await response.json();
        console.log('Experience received:', experience);
        
        if (!Array.isArray(experience) || experience.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-briefcase"></i><p>No experience entries found</p></td></tr>';
            return;
        }
        
        tbody.innerHTML = experience.map(exp => `
            <tr>
                <td>${escapeHtml(exp.company)}</td>
                <td>${escapeHtml(exp.position)}</td>
                <td>${escapeHtml(exp.startDate)} - ${escapeHtml(exp.endDate)}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn edit" onclick="editExperience('${exp._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="table-btn delete" onclick="confirmDelete('experience', '${exp._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading experience:', error);
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load experience: ${error.message}</p></td></tr>`;
    }
}

// ===== LOAD PROJECTS =====
async function loadProjects() {
    const tbody = document.querySelector('#projectsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    console.log('Fetching projects...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            headers: { 'Authorization': authToken }
        });
        console.log('Projects response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const projects = await response.json();
        console.log('Projects received:', projects);
        
        if (!Array.isArray(projects) || projects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-folder-open"></i><p>No projects found</p></td></tr>';
            return;
        }
        
        tbody.innerHTML = projects.map(project => `
            <tr>
                <td>${escapeHtml(project.title)}</td>
                <td>${escapeHtml(project.category)}</td>
                <td>${project.technologies ? project.technologies.join(', ') : '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn edit" onclick="editProject('${project._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="table-btn delete" onclick="confirmDelete('project', '${project._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading projects:', error);
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load projects: ${error.message}</p></td></tr>`;
    }
}

// ===== LOAD GALLERY =====
async function loadGallery() {
    const container = document.getElementById('galleryGridAdmin');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    console.log('Fetching gallery...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/gallery`, {
            headers: { 'Authorization': authToken }
        });
        console.log('Gallery response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const gallery = await response.json();
        console.log('Gallery received:', gallery);
        
        if (!Array.isArray(gallery) || gallery.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>No gallery items found</p></div>';
            return;
        }
        
        container.innerHTML = gallery.map(item => `
            <div class="gallery-item-admin">
                <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}">
                <div class="gallery-item-actions">
                    <button onclick="confirmDelete('gallery', '${item._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="gallery-item-info">
                    <h4>${escapeHtml(item.title)}</h4>
                    <p>${escapeHtml(item.category)}</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load gallery: ${error.message}</p></div>`;
    }
}

// ===== LOAD MESSAGES =====
async function loadMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    console.log('Fetching messages...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            headers: { 'Authorization': authToken }
        });
        
        console.log('Messages response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const messages = await response.json();
        console.log('Messages received:', messages);
        
        if (!Array.isArray(messages) || messages.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-envelope"></i><p>No messages found</p></div>';
            return;
        }
        
        container.innerHTML = messages.map(msg => `
            <div class="message-card ${msg.read ? '' : 'unread'}">
                <div class="message-header">
                    <div class="message-sender">
                        <div class="message-avatar">${msg.name.charAt(0).toUpperCase()}</div>
                        <div class="message-info">
                            <h4>${escapeHtml(msg.name)}</h4>
                            <p>${escapeHtml(msg.email)}</p>
                        </div>
                    </div>
                    <span class="message-date">${formatDate(msg.createdAt)}</span>
                </div>
                <div class="message-subject">${escapeHtml(msg.subject)}</div>
                <div class="message-content">${escapeHtml(msg.message)}</div>
                <div class="message-actions">
                    ${!msg.read ? `<button class="btn btn-sm btn-secondary" onclick="markMessageRead('${msg._id}')">Mark as Read</button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="confirmDelete('message', '${msg._id}')">Delete</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading messages:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load messages: ${error.message}</p></div>`;
    }
}

// ===== LOAD ADMINS =====
async function loadAdmins() {
    const tbody = document.querySelector('#adminsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="2" class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admins`, {
            headers: { 'Authorization': authToken }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const admins = await response.json();
        
        if (!Array.isArray(admins) || admins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="empty-state"><i class="fas fa-shield-alt"></i><p>No admins found</p></td></tr>';
            return;
        }
        
        tbody.innerHTML = admins.map(admin => `
            <tr>
                <td>${escapeHtml(admin.email)}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn edit" onclick="openModal('adminPassword', { _id: '${admin._id}', email: '${escapeHtml(admin.email)}' })" title="Edit Password">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="table-btn delete" onclick="confirmDelete('admin', '${admin._id}')" title="Delete Access">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading admins:', error);
        tbody.innerHTML = `<tr><td colspan="2" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load admins: ${error.message}</p></td></tr>`;
    }
}

// ===== MODAL FUNCTIONS =====
function openModal(type, data = null) {
    editingId = data ? data._id : null;
    modalTitle.textContent = data ? `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}` : `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    const forms = {
        skill: getSkillForm(data),
        education: getEducationForm(data),
        experience: getExperienceForm(data),
        project: getProjectForm(data),
        gallery: getGalleryForm(),
        admin: getAdminForm(),
        adminPassword: getAdminPasswordForm(data)
    };
    
    modalBody.innerHTML = forms[type] || '';
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    editingId = null;
}

function getSkillForm(data) {
    return `
        <form onsubmit="saveSkill(event)">
            <div class="form-group">
                <label>Skill Name</label>
                <input type="text" name="name" value="${data ? escapeHtml(data.name) : ''}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" name="category" value="${data ? escapeHtml(data.category) : 'Technical'}" required>
                </div>
                <div class="form-group">
                    <label>Level</label>
                    <select name="level" required>
                        <option value="Beginner" ${data && data.level === 'Beginner' ? 'selected' : ''}>Beginner</option>
                        <option value="Intermediate" ${data && data.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                        <option value="Advanced" ${data && data.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
                        <option value="Expert" ${data && data.level === 'Expert' ? 'selected' : ''}>Expert</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Icon Class (FontAwesome)</label>
                <input type="text" name="icon" value="${data ? escapeHtml(data.icon) : 'fas fa-code'}">
                <p class="form-hint">Example: fab fa-js, fas fa-database</p>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${data ? 'Update' : 'Add'} Skill</button>
            </div>
        </form>
    `;
}

function getEducationForm(data) {
    return `
        <form onsubmit="saveEducation(event)">
            <div class="form-group">
                <label>Institution</label>
                <input type="text" name="institution" value="${data ? escapeHtml(data.institution) : ''}" required>
            </div>
            <div class="form-group">
                <label>Degree</label>
                <input type="text" name="degree" value="${data ? escapeHtml(data.degree) : ''}" required>
            </div>
            <div class="form-group">
                <label>Field of Study</label>
                <input type="text" name="field" value="${data ? escapeHtml(data.field) : ''}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="text" name="startDate" value="${data ? escapeHtml(data.startDate) : ''}" placeholder="2020" required>
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="text" name="endDate" value="${data ? escapeHtml(data.endDate) : 'Present'}" placeholder="2024">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description">${data ? escapeHtml(data.description) : ''}</textarea>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${data ? 'Update' : 'Add'} Education</button>
            </div>
        </form>
    `;
}

function getExperienceForm(data) {
    return `
        <form onsubmit="saveExperience(event)">
            <div class="form-group">
                <label>Company</label>
                <input type="text" name="company" value="${data ? escapeHtml(data.company) : ''}" required>
            </div>
            <div class="form-group">
                <label>Position</label>
                <input type="text" name="position" value="${data ? escapeHtml(data.position) : ''}" required>
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" name="location" value="${data ? escapeHtml(data.location) : ''}" placeholder="Remote">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="text" name="startDate" value="${data ? escapeHtml(data.startDate) : ''}" placeholder="Jan 2023" required>
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="text" name="endDate" value="${data ? escapeHtml(data.endDate) : 'Present'}" placeholder="Dec 2023">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description">${data ? escapeHtml(data.description) : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Technologies (comma separated)</label>
                <input type="text" name="technologies" value="${data && data.technologies ? escapeHtml(data.technologies.join(', ')) : ''}" placeholder="React, Node.js, MongoDB">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${data ? 'Update' : 'Add'} Experience</button>
            </div>
        </form>
    `;
}

function getProjectForm(data) {
    return `
        <form onsubmit="saveProject(event)">
            <div class="form-group">
                <label>Project Title</label>
                <input type="text" name="title" value="${data ? escapeHtml(data.title) : ''}" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" required>${data ? escapeHtml(data.description) : ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" name="category" value="${data ? escapeHtml(data.category) : 'Web Development'}">
                </div>
                <div class="form-group">
                    <label>Video Link (YouTube Embed URL)</label>
                    <input type="text" name="videoLink" value="${data ? escapeHtml(data.videoLink) : ''}" placeholder="https://www.youtube.com/embed/...">
                    <p class="form-hint">Use embed URL for background play</p>
                </div>
            </div>
            <div class="form-group">
                <label>Project Images (Max 5)</label>
                <input type="file" name="images" multiple accept="image/*" ${data ? '' : 'required'}>
                <p class="form-hint">Select multiple images for the hover carousel</p>
            </div>
            <div class="form-group">
                <label>Technologies (comma separated)</label>
                <input type="text" name="technologies" value="${data && data.technologies ? escapeHtml(data.technologies.join(', ')) : ''}" placeholder="React, Node.js, MongoDB">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>GitHub Link</label>
                    <input type="text" name="githubLink" value="${data ? escapeHtml(data.githubLink) : ''}" placeholder="https://github.com/...">
                </div>
                <div class="form-group">
                    <label>Live Link</label>
                    <input type="text" name="liveLink" value="${data ? escapeHtml(data.liveLink) : ''}" placeholder="https://...">
                </div>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="featured" ${data && data.featured ? 'checked' : ''}>
                    Featured Project
                </label>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">${data ? 'Update' : 'Add'} Project</button>
            </div>
        </form>
    `;
}

function getGalleryForm() {
    return `
        <form onsubmit="saveGallery(event)" enctype="multipart/form-data">
            <div class="form-group">
                <label>Image</label>
                <input type="file" name="image" accept="image/*" required>
                <p class="form-hint">Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</p>
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="title" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Category</label>
                    <select name="category" required>
                        <option value="Event">Event</option>
                        <option value="Achievement">Achievement</option>
                        <option value="Certificate">Certificate</option>
                        <option value="Workshop">Workshop</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Event Date</label>
                    <input type="text" name="eventDate" placeholder="Jan 2024">
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Upload Image</button>
            </div>
        </form>
    `;
}

function getAdminForm() {
    return `
        <form onsubmit="saveAdmin(event)">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="admin@example.com">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Admin</button>
            </div>
        </form>
    `;
}

function getAdminPasswordForm(data) {
    if (!data) return '';
    return `
        <form onsubmit="saveAdminPassword(event)">
            <input type="hidden" name="id" value="${data._id}">
            <p>Editing password for: <strong>${escapeHtml(data.email)}</strong></p>
            <div class="form-group">
                <label>New Password</label>
                <input type="password" name="newPassword" id="newAdminPassword" required>
            </div>
            <div class="form-group">
                <label>Confirm New Password</label>
                <input type="password" id="confirmAdminPassword" required>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Password</button>
            </div>
        </form>
    `;
}

// ===== SAVE FUNCTIONS =====
async function saveSkill(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const url = editingId ? `${API_BASE_URL}/api/skills/${editingId}` : `${API_BASE_URL}/api/skills`;
    const method = editingId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast(editingId ? 'Skill updated successfully' : 'Skill added successfully');
            closeModal();
            loadSkills();
            loadStats();
        } else {
            const result = await response.json();
            showToast(result.error || 'Failed to save skill', 'error');
        }
    } catch (error) {
        console.error('Error saving skill:', error);
        showToast('Network error', 'error');
    }
}

async function saveEducation(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const url = editingId ? `${API_BASE_URL}/api/education/${editingId}` : `${API_BASE_URL}/api/education`;
    const method = editingId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast(editingId ? 'Education updated successfully' : 'Education added successfully');
            closeModal();
            loadEducation();
            loadStats();
        } else {
            const result = await response.json();
            showToast(result.error || 'Failed to save education', 'error');
        }
    } catch (error) {
        console.error('Error saving education:', error);
        showToast('Network error', 'error');
    }
}

async function saveExperience(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.technologies = data.technologies.split(',').map(t => t.trim()).filter(t => t);
    
    const url = editingId ? `${API_BASE_URL}/api/experience/${editingId}` : `${API_BASE_URL}/api/experience`;
    const method = editingId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast(editingId ? 'Experience updated successfully' : 'Experience added successfully');
            closeModal();
            loadExperience();
            loadStats();
        } else {
            const result = await response.json();
            showToast(result.error || 'Failed to save experience', 'error');
        }
    } catch (error) {
        console.error('Error saving experience:', error);
        showToast('Network error', 'error');
    }
}

async function saveProject(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Tech tags logic is now handled in backend or we could pre-process it here
    // But since we use FormData, we let the backend handle the split for multipart
    
    const url = editingId ? `${API_BASE_URL}/api/projects/${editingId}` : `${API_BASE_URL}/api/projects`;
    const method = editingId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': authToken
            },
            body: formData
        });
        
        if (response.ok) {
            showToast(editingId ? 'Project updated successfully' : 'Project added successfully');
            closeModal();
            loadProjects();
            loadStats();
        } else {
            const result = await response.json();
            showToast(result.error || 'Failed to save project', 'error');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        showToast('Network error', 'error');
    }
}

async function saveGallery(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/gallery`, {
            method: 'POST',
            headers: {
                'Authorization': authToken
            },
            body: formData
        });
        
        if (response.ok) {
            showToast('Image uploaded successfully');
            closeModal();
            loadGallery();
            loadStats();
        } else {
            const result = await response.json();
            showToast(result.error || 'Failed to upload image', 'error');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        showToast('Network error', 'error');
    }
}

async function saveAdmin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast('Administrator added successfully');
            closeModal();
            loadAdmins();
        } else {
            const result = await response.json();
            showToast(result.error || 'Failed to add administrator', 'error');
        }
    } catch (error) {
        console.error('Error adding admin:', error);
        showToast('Network error', 'error');
    }
}

async function saveAdminPassword(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');
    const newPassword = formData.get('newPassword');
    const confirmPassword = document.getElementById('confirmAdminPassword').value;
    
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admins/${id}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            },
            body: JSON.stringify({ newPassword })
        });
        
        if (response.ok) {
            showToast('Password updated successfully');
            closeModal();
        } else {
            const result = await response.json();
            showToast(result.error || 'Failed to update password', 'error');
        }
    } catch (error) {
        console.error('Error updating password:', error);
        showToast('Network error', 'error');
    }
}

// ===== EDIT FUNCTIONS =====
async function editSkill(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/skills`, {
            headers: { 'Authorization': authToken }
        });
        const skills = await response.json();
        const skill = skills.find(s => s._id === id);
        if (skill) {
            openModal('skill', skill);
        }
    } catch (error) {
        console.error('Error loading skill:', error);
        showToast('Failed to load skill data', 'error');
    }
}

async function editEducation(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/education`, {
            headers: { 'Authorization': authToken }
        });
        const education = await response.json();
        const edu = education.find(e => e._id === id);
        if (edu) {
            openModal('education', edu);
        }
    } catch (error) {
        console.error('Error loading education:', error);
        showToast('Failed to load education data', 'error');
    }
}

async function editExperience(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/experience`, {
            headers: { 'Authorization': authToken }
        });
        const experience = await response.json();
        const exp = experience.find(e => e._id === id);
        if (exp) {
            openModal('experience', exp);
        }
    } catch (error) {
        console.error('Error loading experience:', error);
        showToast('Failed to load experience data', 'error');
    }
}

async function editProject(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            headers: { 'Authorization': authToken }
        });
        const projects = await response.json();
        const project = projects.find(p => p._id === id);
        if (project) {
            openModal('project', project);
        }
    } catch (error) {
        console.error('Error loading project:', error);
        showToast('Failed to load project data', 'error');
    }
}

// ===== DELETE FUNCTIONS =====
function confirmDelete(type, id) {
    deleteCallback = () => performDelete(type, id);
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    deleteCallback = null;
}

function initDeleteModal() {
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (deleteCallback) {
                deleteCallback();
                closeDeleteModal();
            }
        });
    }
}

async function performDelete(type, id) {
    const endpoints = {
        skill: `${API_BASE_URL}/api/skills/${id}`,
        education: `${API_BASE_URL}/api/education/${id}`,
        experience: `${API_BASE_URL}/api/experience/${id}`,
        project: `${API_BASE_URL}/api/projects/${id}`,
        gallery: `${API_BASE_URL}/api/gallery/${id}`,
        message: `${API_BASE_URL}/api/messages/${id}`,
        admin: `${API_BASE_URL}/api/admins/${id}`
    };
    
    try {
        const response = await fetch(endpoints[type], {
            method: 'DELETE',
            headers: { 'Authorization': authToken }
        });
        
        if (response.ok) {
            showToast('Item deleted successfully');
            loadSectionData(currentSection);
            loadStats();
        } else {
            const result = await response.json();
            showToast(result.error || 'Failed to delete item', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Network error', 'error');
    }
}

// ===== MESSAGE FUNCTIONS =====
async function markMessageRead(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': authToken }
        });
        
        if (response.ok) {
            loadMessages();
            loadStats();
        } else {
            showToast('Failed to mark message as read', 'error');
        }
    } catch (error) {
        console.error('Error marking message as read:', error);
        showToast('Network error', 'error');
    }
}

// ===== CREDENTIALS FORM =====
function initCredentialsForm() {
    const form = document.getElementById('credentialsForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newUsername = document.getElementById('newUsername').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                showToast('New passwords do not match', 'error');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/change-credentials`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                        newEmail: newUsername // Mapping from frontend field name
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showToast('Credentials updated. Logging out for security...');
                    form.reset();
                    // Force logout after 2 seconds to allow toast visibility
                    setTimeout(() => {
                        localStorage.removeItem('token');
                        window.location.href = 'panel_access_98342.html';
                    }, 2000);
                } else {
                    showToast(result.error || 'Failed to update credentials', 'error');
                }
            } catch (error) {
                console.error('Error updating credentials:', error);
                showToast('Network error', 'error');
            }
        });
    }
}

// ===== LOGOUT =====
function initLogout() {
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'panel_access_98342.html';
        });
    }
}

// ===== RESUME FUNCTIONS =====
async function loadResumeStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/resume`);
        const data = await response.json();
        
        const statusDiv = document.getElementById('resumeStatus');
        const deleteBtn = document.getElementById('deleteResumeBtn');
        const uploadBtn = document.getElementById('uploadResumeBtn');
        
        if (data && data.url) {
            statusDiv.innerHTML = `<span style="color: var(--success-color);"><i class="fas fa-check-circle"></i> Resume is Active.</span> <a href="${data.url}" target="_blank" style="color: var(--primary-purple); margin-left: 10px; text-decoration: underline;">View File</a>`;
            deleteBtn.style.display = 'inline-block';
            uploadBtn.textContent = 'Replace Resume';
        } else {
            statusDiv.innerHTML = `<span style="color: var(--text-muted);"><i class="fas fa-times-circle"></i> No resume uploaded.</span>`;
            deleteBtn.style.display = 'none';
            uploadBtn.textContent = 'Upload Resume';
        }
    } catch (error) {
        console.error('Error loading resume status:', error);
        document.getElementById('resumeStatus').innerText = 'Failed to load status';
    }
}

async function uploadResume(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const btn = document.getElementById('uploadResumeBtn');
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/resume`, {
            method: 'POST',
            headers: {
                'Authorization': authToken
            },
            body: formData
        });
        
        if (response.ok) {
            showToast('Resume uploaded successfully');
            document.getElementById('resumeUploadForm').reset();
            loadResumeStatus();
        } else {
            const result = await response.json();
            showToast(result.error || 'Failed to upload resume', 'error');
            btn.textContent = 'Upload Resume';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error uploading resume:', error);
        showToast('Network error', 'error');
        btn.textContent = 'Upload Resume';
        btn.disabled = false;
    }
}

async function deleteResume() {
    if (!confirm('Are you sure you want to completely delete the active resume? Visitor downloads will be unavailable.')) return;
    
    const btn = document.getElementById('deleteResumeBtn');
    const originalText = btn.textContent;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/resume`, {
            method: 'DELETE',
            headers: {
                'Authorization': authToken
            }
        });
        
        if (response.ok) {
            showToast('Resume deleted successfully');
            loadResumeStatus();
        } else {
            const result = await response.json();
            showToast(result.error || 'Failed to delete resume', 'error');
            btn.textContent = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error deleting resume:', error);
        showToast('Network error', 'error');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// ===== UTILITY FUNCTIONS =====
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    const icon = toast.querySelector('i');
    icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    icon.style.color = type === 'error' ? 'var(--error-color)' : 'var(--success-color)';
    toast.style.borderColor = type === 'error' ? 'var(--error-color)' : 'var(--success-color)';
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
