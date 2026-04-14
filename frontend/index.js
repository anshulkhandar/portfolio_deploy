const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://your-backend-name.onrender.com'; // Replace with your Render URL after deployment

// ===== DOM ELEMENTS =====
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const contactForm = document.getElementById('contactForm');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Loaded, initializing...');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    initNavbar();
    initSmoothScroll();
    loadAllData();
    initContactForm();
});

// ===== NAVBAR FUNCTIONALITY =====
function initNavbar() {
    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}



// ===== LOAD ALL DATA =====
async function loadAllData() {
    console.log('Loading all data...');
    try {
        await Promise.all([
            loadSkills(),
            loadEducation(),
            loadExperience(),
            loadProjects(),
            loadResume()
        ]);
        console.log('All data loaded successfully');
    } catch (error) {
        console.error('Error in loadAllData:', error);
    }
}

// ===== LOAD RESUME =====
async function loadResume() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/resume`);
        const data = await response.json();
        const downloadBtn = document.getElementById('downloadResumeBtn');
        if (data && data.url) {
            downloadBtn.href = data.url;
            downloadBtn.style.display = 'inline-flex';
        }
    } catch (error) {
        console.error('Error loading resume:', error);
    }
}

// ===== LOAD SKILLS =====
async function loadSkills() {
    const container = document.getElementById('skillsContent');
    if (!container) {
        console.error('skillsContent container not found');
        return;
    }
    
    console.log('Fetching skills from:', `${API_BASE_URL}/api/skills`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/skills`);
        console.log('Skills response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const skills = await response.json();
        console.log('Skills data received:', skills);
        console.log('Skills count:', skills.length);
        
        if (!Array.isArray(skills)) {
            console.error('Skills data is not an array:', skills);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Invalid data format received</p>
                </div>
            `;
            return;
        }
        
        if (skills.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code"></i>
                    <p>No skills found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = skills.map((skill, index) => `
            <div class="skill-card fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="skill-icon">
                    <i class="${skill.icon || 'fas fa-code'}"></i>
                </div>
                <h3 class="skill-name">${escapeHtml(skill.name)}</h3>
                <span class="skill-level">${escapeHtml(skill.level)}</span>
            </div>
        `).join('');
        
        // Apply fade-in animation to newly created elements
        applyFadeInAnimation();
        
    } catch (error) {
        console.error('Error loading skills:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load skills: ${error.message}</p>
            </div>
        `;
    }
}

// ===== LOAD EDUCATION =====
async function loadEducation() {
    const container = document.getElementById('educationContent');
    if (!container) {
        console.error('educationContent container not found');
        return;
    }
    
    console.log('Fetching education from:', `${API_BASE_URL}/api/education`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/education`);
        console.log('Education response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const education = await response.json();
        console.log('Education data received:', education);
        console.log('Education count:', education.length);
        
        if (!Array.isArray(education)) {
            console.error('Education data is not an array:', education);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Invalid data format received</p>
                </div>
            `;
            return;
        }
        
        if (education.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <p>No education entries found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = education.map((edu, index) => `
            <div class="education-card fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="education-icon">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="education-details">
                    <h3>${escapeHtml(edu.institution)}</h3>
                    <p class="education-degree">${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ''}</p>
                    <p class="education-date">
                        <i class="far fa-calendar-alt"></i>
                        ${escapeHtml(edu.startDate)} - ${escapeHtml(edu.endDate)}
                    </p>
                    ${edu.description ? `<p class="education-description">${escapeHtml(edu.description)}</p>` : ''}
                </div>
            </div>
        `).join('');
        
        applyFadeInAnimation();
        
    } catch (error) {
        console.error('Error loading education:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load education: ${error.message}</p>
            </div>
        `;
    }
}

// ===== LOAD EXPERIENCE =====
async function loadExperience() {
    const container = document.getElementById('experienceContent');
    if (!container) {
        console.error('experienceContent container not found');
        return;
    }
    
    console.log('Fetching experience from:', `${API_BASE_URL}/api/experience`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/experience`);
        console.log('Experience response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const experiences = await response.json();
        console.log('Experience data received:', experiences);
        console.log('Experience count:', experiences.length);
        
        if (!Array.isArray(experiences)) {
            console.error('Experience data is not an array:', experiences);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Invalid data format received</p>
                </div>
            `;
            return;
        }
        
        if (experiences.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <p>No experience entries found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = experiences.map((exp, index) => `
            <div class="experience-card fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="experience-header">
                    <div>
                        <h3 class="experience-title">${escapeHtml(exp.position)}</h3>
                        <p class="experience-company">${escapeHtml(exp.company)}${exp.location ? ` • ${escapeHtml(exp.location)}` : ''}</p>
                    </div>
                    <span class="experience-date">${escapeHtml(exp.startDate)} - ${escapeHtml(exp.endDate)}</span>
                </div>
                ${exp.description ? `<p class="experience-description">${escapeHtml(exp.description)}</p>` : ''}
                ${exp.technologies && exp.technologies.length > 0 ? `
                    <div class="experience-tech">
                        ${exp.technologies.map(tech => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        applyFadeInAnimation();
        
    } catch (error) {
        console.error('Error loading experience:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load experience: ${error.message}</p>
            </div>
        `;
    }
}

// ===== LOAD PROJECTS =====
async function loadProjects() {
    const container = document.getElementById('projectsContent');
    if (!container) {
        console.error('projectsContent container not found');
        return;
    }
    
    console.log('Fetching projects from:', `${API_BASE_URL}/api/projects`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects`);
        console.log('Projects response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const projects = await response.json();
        console.log('Projects data received:', projects);
        console.log('Projects count:', projects.length);
        
        if (!Array.isArray(projects)) {
            console.error('Projects data is not an array:', projects);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Invalid data format received</p>
                </div>
            `;
            return;
        }
        
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No projects found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = projects.map((project, index) => {
            const hasImages = project.images && project.images.length > 0;
            const videoId = project.videoLink ? project.videoLink.split('/').pop().split('?')[0] : '';
            
            return `
                <div class="project-card fade-in" style="animation-delay: ${index * 0.1}s" onclick="location.href='project.html?id=${project._id}'">
                    <div class="project-media ${!project.videoLink ? 'no-video' : ''}">
                        ${project.videoLink ? `
                            <div class="project-video">
                                <iframe 
                                    src="${escapeHtml(project.videoLink)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&showinfo=0&rel=0&enablejsapi=1" 
                                    frameborder="0" 
                                    allow="autoplay; encrypted-media" 
                                    allowfullscreen
                                    style="width: 100%; height: 100%; scale: 1.5;">
                                </iframe>
                            </div>
                        ` : ''}
                        
                        <div class="project-carousel" id="carousel-${project._id}">
                            ${hasImages ? project.images.map((img, i) => `
                                <img src="${escapeHtml(img.url)}" class="carousel-slide ${i === 0 ? 'active' : ''}" alt="${escapeHtml(project.title)}">
                            `).join('') : '<div class="project-image-placeholder"><i class="fas fa-folder-open"></i></div>'}
                        </div>
                    </div>
                    <div class="project-content">
                        <h3 class="project-title">${escapeHtml(project.title)}</h3>
                        <p class="project-description">${escapeHtml(project.description)}</p>
                        ${project.technologies && project.technologies.length > 0 ? `
                            <div class="project-tech">
                                ${project.technologies.map(tech => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join('')}
                            </div>
                        ` : ''}
                        <div class="project-links">
                            ${project.githubLink ? `<a href="${escapeHtml(project.githubLink)}" target="_blank" rel="noopener" class="project-link" onclick="event.stopPropagation()"><i class="fab fa-github"></i> Code</a>` : ''}
                            <a href="project.html?id=${project._id}" class="project-link"><i class="fas fa-info-circle"></i> Details</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        initProjectCarousels();
        applyFadeInAnimation();
        
    } catch (error) {
        console.error('Error loading projects:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load projects: ${error.message}</p>
            </div>
        `;
    }
}

// ===== APPLY FADE IN ANIMATION =====
function applyFadeInAnimation() {
    const fadeElements = document.querySelectorAll('.skill-card, .education-card, .experience-card, .project-card');
    
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeObserver.observe(el);
    });
}

// ===== PROJECT CAROUSEL LOGIC =====
function initProjectCarousels() {
    const carousels = document.querySelectorAll('.project-carousel');
    console.log(`Initializing ${carousels.length} project carousels...`);
    
    carousels.forEach(carousel => {
        const slides = carousel.querySelectorAll('.carousel-slide');
        if (slides.length <= 1) return;
        
        let interval;
        const card = carousel.closest('.project-card');
        
        if (!card) return;

        card.addEventListener('mouseenter', () => {
            // Start scrolling
            interval = setInterval(() => {
                const currentActive = carousel.querySelector('.carousel-slide.active');
                if (!currentActive) {
                    slides[0].classList.add('active');
                    return;
                }

                currentActive.classList.remove('active');
                let nextSlide = currentActive.nextElementSibling;
                
                if (!nextSlide || !nextSlide.classList.contains('carousel-slide')) {
                    nextSlide = slides[0];
                }
                
                nextSlide.classList.add('active');
            }, 2000);
        });
        
        card.addEventListener('mouseleave', () => {
            clearInterval(interval);
            // Reset to first slide for consistency
            slides.forEach(s => s.classList.remove('active'));
            if (slides[0]) slides[0].classList.add('active');
        });
    });
}

// ===== CONTACT FORM =====
function initContactForm() {
    if (!contactForm) {
        console.error('Contact form not found');
        return;
    }
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            subject: document.getElementById('subject').value.trim(),
            message: document.getElementById('message').value.trim()
        };
        
        // Validation
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        if (!isValidEmail(formData.email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        
        if (formData.message.length < 10) {
            showToast('Message must be at least 10 characters long', 'error');
            return;
        }
        
        // Check for spam
        const spamWords = ['viagra', 'casino', 'lottery', 'winner', 'click here', 'buy now'];
        const content = (formData.message + formData.subject).toLowerCase();
        if (spamWords.some(word => content.includes(word))) {
            showToast('Your message contains spam content', 'error');
            return;
        }
        
        try {
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            const response = await fetch(`${API_BASE_URL}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showToast('Message sent successfully!');
                contactForm.reset();
            } else {
                showToast(result.error || 'Failed to send message', 'error');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Failed to send message. Please try again.', 'error');
        } finally {
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Send Message</span>';
            submitBtn.disabled = false;
        }
    });
}

// ===== UTILITY FUNCTIONS =====
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    const icon = toast.querySelector('i');
    
    if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
        icon.style.color = '#ef4444';
    } else {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#22c55e';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
