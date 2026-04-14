const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://your-backend-name.onrender.com'; // Replace with your Render URL after deployment

// ===== DOM ELEMENTS =====
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const galleryGrid = document.getElementById('galleryGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const lightbox = document.getElementById('lightbox');
const lightboxOverlay = document.getElementById('lightboxOverlay');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxDescription = document.getElementById('lightboxDescription');

// ===== STATE =====
let galleryItems = [];
let currentImageIndex = 0;
let filteredItems = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Gallery DOM Loaded');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    initNavbar();
    loadGallery();
    initFilter();
    initLightbox();
});

// ===== NAVBAR FUNCTIONALITY =====
function initNavbar() {
    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
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

// ===== LOAD GALLERY =====
async function loadGallery() {
    console.log('Fetching gallery from:', `${API_BASE_URL}/api/gallery`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/gallery`);
        console.log('Gallery response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        galleryItems = await response.json();
        console.log('Gallery data received:', galleryItems);
        console.log('Gallery count:', galleryItems.length);
        
        if (!Array.isArray(galleryItems)) {
            console.error('Gallery data is not an array:', galleryItems);
            showErrorState('Invalid data format received');
            return;
        }
        
        filteredItems = [...galleryItems];
        
        if (galleryItems.length === 0) {
            showEmptyState();
            return;
        }
        
        renderGallery(filteredItems);
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        showErrorState('Failed to load gallery: ' + error.message);
    }
}

// ===== RENDER GALLERY =====
function renderGallery(items) {
    if (!galleryGrid) {
        console.error('galleryGrid element not found');
        return;
    }
    
    if (items.length === 0) {
        galleryGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-images"></i>
                <h3>No items found</h3>
                <p>No gallery items match the selected filter.</p>
            </div>
        `;
        return;
    }
    
    galleryGrid.innerHTML = items.map((item, index) => `
        <div class="gallery-item" data-index="${index}" data-category="${escapeHtml(item.category)}" style="animation: fadeInUp 0.6s ease ${index * 0.1}s forwards; opacity: 0;">
            <div class="gallery-image">
                <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy">
                <div class="gallery-overlay"></div>
            </div>
            <div class="gallery-content">
                <span class="gallery-category">${escapeHtml(item.category)}</span>
                <h3 class="gallery-title">${escapeHtml(item.title)}</h3>
                ${item.eventDate ? `
                    <p class="gallery-date">
                        <i class="far fa-calendar-alt"></i>
                        ${escapeHtml(item.eventDate)}
                    </p>
                ` : ''}
                ${item.description ? `<p class="gallery-description">${escapeHtml(item.description)}</p>` : ''}
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.gallery-item').forEach((item, index) => {
        item.addEventListener('click', () => openLightbox(index));
    });
}

// ===== FILTER FUNCTIONALITY =====
function initFilter() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter items
            const filter = btn.dataset.filter;
            if (filter === 'all') {
                filteredItems = [...galleryItems];
            } else {
                filteredItems = galleryItems.filter(item => item.category === filter);
            }
            
            renderGallery(filteredItems);
        });
    });
}

// ===== LIGHTBOX FUNCTIONALITY =====
function initLightbox() {
    // Close lightbox
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', closeLightbox);
    
    // Navigation
    lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
    });
    
    lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                navigateLightbox(-1);
                break;
            case 'ArrowRight':
                navigateLightbox(1);
                break;
        }
    });
    
    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                navigateLightbox(1); // Swipe left, go next
            } else {
                navigateLightbox(-1); // Swipe right, go prev
            }
        }
    }
}

function openLightbox(index) {
    currentImageIndex = index;
    updateLightboxContent();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function navigateLightbox(direction) {
    currentImageIndex += direction;
    
    // Loop navigation
    if (currentImageIndex < 0) {
        currentImageIndex = filteredItems.length - 1;
    } else if (currentImageIndex >= filteredItems.length) {
        currentImageIndex = 0;
    }
    
    updateLightboxContent();
}

function updateLightboxContent() {
    const item = filteredItems[currentImageIndex];
    if (!item) return;
    
    lightboxImage.src = item.imageUrl;
    lightboxImage.alt = item.title;
    lightboxTitle.textContent = item.title;
    lightboxDescription.textContent = item.description || '';
    
    // Update navigation visibility
    lightboxPrev.style.display = filteredItems.length > 1 ? 'flex' : 'none';
    lightboxNext.style.display = filteredItems.length > 1 ? 'flex' : 'none';
}

// ===== EMPTY & ERROR STATES =====
function showEmptyState() {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <i class="fas fa-images"></i>
            <h3>No Gallery Items</h3>
            <p>The gallery is currently empty. Check back later for updates!</p>
        </div>
    `;
}

function showErrorState(message) {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Failed to Load Gallery</h3>
            <p>${message || 'Unable to load gallery items. Please refresh the page or try again later.'}</p>
        </div>
    `;
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
