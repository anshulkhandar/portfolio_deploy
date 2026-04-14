const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://your-backend-name.onrender.com'; // Replace with your Render URL after deployment

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');

    if (!projectId) {
        window.location.href = 'index.html';
        return;
    }

    loadProjectDetails(projectId);
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
    
    document.getElementById('projectTitle').textContent = project.title;
    document.getElementById('projectCategory').textContent = project.category;
    document.getElementById('projectDescription').textContent = project.description;

    // Handle Video
    const videoIframe = document.getElementById('projectVideo');
    if (project.videoLink) {
        // Ensure it's the embed version for iframe
        let embedUrl = project.videoLink;
        if (embedUrl.includes('watch?v=')) {
            embedUrl = embedUrl.replace('watch?v=', 'embed/');
        }
        videoIframe.src = `${embedUrl}?autoplay=1&mute=0&controls=1`;
    } else {
        document.querySelector('.project-media-showcase').style.display = 'none';
    }

    // Handle Tech Tags
    const techContainer = document.getElementById('projectTech');
    if (project.technologies && project.technologies.length > 0) {
        techContainer.innerHTML = project.technologies.map(tech => `
            <span class="tech-tag">${escapeHtml(tech)}</span>
        `).join('');
    }

    // Handle Links
    const githubBtn = document.getElementById('githubBtn');
    const liveBtn = document.getElementById('liveBtn');

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

    // Handle Gallery
    const galleryContainer = document.getElementById('projectGallery');
    if (project.images && project.images.length > 0) {
        galleryContainer.innerHTML = project.images.map(img => `
            <img src="${img.url}" class="gallery-img" onclick="window.open('${img.url}', '_blank')" alt="Project screenshot">
        `).join('');
    } else {
        document.querySelector('.gallery-sidebar').style.display = 'none';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
