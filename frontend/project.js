const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://portfolio-deploy-7mxn.onrender.com'; // backend link

// ===== STATE =====
let currentCarouselIndex = 0;
let projectImages = [];
let lightboxIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');

    if (!projectId) {
        window.location.href = 'index.html';
        return;
    }

    loadProjectDetails(projectId);
    initLightbox();
});

async function loadProjectDetails(id) {
    const loader = document.getElementById('loader');
    const content = document.getElementById('projectContent');

    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/${id}`);
        if (!response.ok) throw new Error('Project not found');

        const project = await response.json();
        renderProject(project);

        loader.style.display = 'none';
        content.style.display = 'block';
    } catch (error) {
        console.error('Error loading project details:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 100px; color: white;">
                <h1>Project Not Found</h1>
                <p>${error.message}</p>
                <a href="index.html" style="color: #8b5cf6;">Go Back</a>
            </div>
        `;
    }
}

function renderProject(project) {
    document.title = `${project.title} | Portfolio`;
    
    // Hero Header
    document.getElementById('projectTitle').textContent = project.title;
    document.getElementById('projectCategory').textContent = project.category || 'Project';
    
    // Summary: first 2 sentences of description
    const summaryEl = document.getElementById('projectSummary');
    if (project.description) {
        const sentences = project.description.match(/[^.!?]+[.!?]+/g);
        summaryEl.textContent = sentences ? sentences.slice(0, 2).join(' ').trim() : project.description.substring(0, 200);
    }

    // Full Description
    document.getElementById('projectDescription').textContent = project.description || '';

    // Image Carousel
    projectImages = (project.images && project.images.length > 0) ? project.images.map(img => img.url) : [];
    if (projectImages.length > 0) {
        initCarousel(projectImages);
    } else {
        document.getElementById('imageCarouselSection').style.display = 'none';
    }

    // Video
    const videoSection = document.getElementById('videoSection');
    const videoIframe = document.getElementById('projectVideo');
    if (project.videoLink) {
        let embedUrl = project.videoLink;
        if (embedUrl.includes('watch?v=')) {
            embedUrl = embedUrl.replace('watch?v=', 'embed/');
        }
        videoIframe.src = `${embedUrl}?autoplay=0&mute=1&controls=1`;
    } else {
        videoSection.style.display = 'none';
    }

    // Tech Tags
    const techContainer = document.getElementById('projectTech');
    const techCard = document.getElementById('techStackCard');
    if (project.technologies && project.technologies.length > 0) {
        techContainer.innerHTML = project.technologies.map(tech => `
            <span class="tech-tag">${escapeHtml(tech)}</span>
        `).join('');
    } else {
        techCard.style.display = 'none';
    }

    // Links
    const githubBtn = document.getElementById('githubBtn');
    const liveBtn = document.getElementById('liveBtn');
    const linksCard = document.getElementById('linksCard');

    if (project.githubLink) {
        githubBtn.href = project.githubLink;
    } else {
        githubBtn.style.display = 'none';
    }

    if (project.liveLink) {
        liveBtn.href = project.liveLink;
    } else {
        liveBtn.style.display = 'none';
    }

    if (!project.githubLink && !project.liveLink) {
        linksCard.style.display = 'none';
    }

    // Gallery Sidebar
    const galleryContainer = document.getElementById('projectGallery');
    const gallerySidebarCard = document.getElementById('gallerySidebarCard');
    if (project.images && project.images.length > 0) {
        galleryContainer.innerHTML = project.images.map((img, i) => `
            <img src="${escapeHtml(img.url)}" class="gallery-img" data-index="${i}" alt="Project screenshot">
        `).join('');

        // Clicking gallery thumbnails opens lightbox
        galleryContainer.querySelectorAll('.gallery-img').forEach(img => {
            img.addEventListener('click', () => {
                openLightbox(parseInt(img.dataset.index));
            });
        });
    } else {
        gallerySidebarCard.style.display = 'none';
    }
}

// ===== IMAGE CAROUSEL =====
function initCarousel(images) {
    const viewport = document.getElementById('carouselViewport');
    const thumbsContainer = document.getElementById('carouselThumbnails');

    // Create slides
    viewport.innerHTML = images.map((url, i) => `
        <img src="${escapeHtml(url)}" class="${i === 0 ? 'active' : ''}" alt="Project image ${i + 1}" data-index="${i}">
    `).join('');

    // Create thumbnails
    thumbsContainer.innerHTML = images.map((url, i) => `
        <img src="${escapeHtml(url)}" class="carousel-thumb ${i === 0 ? 'active' : ''}" data-index="${i}" alt="Thumbnail ${i + 1}">
    `).join('');

    // Carousel slide click opens lightbox
    viewport.querySelectorAll('img').forEach(img => {
        img.addEventListener('click', () => {
            openLightbox(parseInt(img.dataset.index));
        });
    });

    // Thumbnail clicks
    thumbsContainer.querySelectorAll('.carousel-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            goToSlide(parseInt(thumb.dataset.index));
        });
    });

    // Nav buttons
    document.getElementById('carouselPrev').addEventListener('click', () => {
        goToSlide((currentCarouselIndex - 1 + images.length) % images.length);
    });

    document.getElementById('carouselNext').addEventListener('click', () => {
        goToSlide((currentCarouselIndex + 1) % images.length);
    });
}

function goToSlide(index) {
    const viewport = document.getElementById('carouselViewport');
    const thumbs = document.getElementById('carouselThumbnails');

    // Update slides
    viewport.querySelector('img.active')?.classList.remove('active');
    viewport.querySelectorAll('img')[index]?.classList.add('active');

    // Update thumbnails
    thumbs.querySelector('.carousel-thumb.active')?.classList.remove('active');
    thumbs.querySelectorAll('.carousel-thumb')[index]?.classList.add('active');

    // Scroll thumbnail into view
    const activeThumb = thumbs.querySelectorAll('.carousel-thumb')[index];
    if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    currentCarouselIndex = index;
}

// ===== LIGHTBOX =====
function initLightbox() {
    const overlay = document.getElementById('lightbox');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLightbox();
    });

    prevBtn.addEventListener('click', () => {
        lightboxIndex = (lightboxIndex - 1 + projectImages.length) % projectImages.length;
        updateLightbox();
    });

    nextBtn.addEventListener('click', () => {
        lightboxIndex = (lightboxIndex + 1) % projectImages.length;
        updateLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!overlay.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') {
            lightboxIndex = (lightboxIndex - 1 + projectImages.length) % projectImages.length;
            updateLightbox();
        }
        if (e.key === 'ArrowRight') {
            lightboxIndex = (lightboxIndex + 1) % projectImages.length;
            updateLightbox();
        }
    });
}

function openLightbox(index) {
    lightboxIndex = index;
    updateLightbox();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
}

function updateLightbox() {
    document.getElementById('lightboxImg').src = projectImages[lightboxIndex];
    document.getElementById('lightboxCounter').textContent = `${lightboxIndex + 1} / ${projectImages.length}`;
}

// ===== UTILITIES =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
