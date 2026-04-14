// ===== API BASE URL =====
const API_BASE_URL = 'http://localhost:5000'; // Explicitly set as requested

// ===== DOM ELEMENTS =====
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const loginBtn = document.getElementById('loginBtn');
const loginAttemptsDiv = document.getElementById('loginAttempts');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// ===== BRUTE FORCE PROTECTION =====
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
    initPasswordToggle();
    initLoginForm();
    checkLockoutStatus();
    checkAuthError();
});

// ===== GOOGLE LOGIN =====
function googleLogin() {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
}

function checkAuthError() {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error === 'unauthorized') {
        showToast('Unauthorized Gmail account. Access denied.');
    }
}

// ===== CHECK EXISTING SESSION =====
function checkExistingSession() {
    const token = localStorage.getItem('token');
    if (token) {
        // Simple verification by trying to fetch stats
        fetch(`${API_BASE_URL}/api/stats`, {
            headers: {
                'Authorization': token
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = 'dashboard_74829.html';
            } else {
                localStorage.removeItem('token');
            }
        })
        .catch(() => {
            localStorage.removeItem('token');
        });
    }
}

// ===== PASSWORD TOGGLE =====
function initPasswordToggle() {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = togglePassword.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
}

// ===== CHECK LOCKOUT STATUS =====
function checkLockoutStatus() {
    const lockoutEnd = localStorage.getItem('loginLockoutEnd');
    
    if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
        showLockoutScreen(parseInt(lockoutEnd));
        return true;
    }
    
    // Clear expired lockout
    if (lockoutEnd && Date.now() >= parseInt(lockoutEnd)) {
        localStorage.removeItem('loginLockoutEnd');
        localStorage.removeItem('loginAttempts');
    }
    
    return false;
}

// ===== SHOW LOCKOUT SCREEN =====
function showLockoutScreen(lockoutEnd) {
    const loginCard = document.querySelector('.login-card');
    const remainingTime = Math.ceil((lockoutEnd - Date.now()) / 1000);
    
    loginCard.innerHTML = `
        <div class="lock-message">
            <i class="fas fa-lock"></i>
            <h3>Account Temporarily Locked</h3>
            <p>Too many failed login attempts. Please try again later.</p>
            <div class="lock-timer" id="lockTimer">${formatTime(remainingTime)}</div>
            <p>Time remaining</p>
        </div>
    `;
    
    loginCard.classList.add('locked');
    
    // Update timer
    const timerInterval = setInterval(() => {
        const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            location.reload();
            return;
        }
        
        const timerElement = document.getElementById('lockTimer');
        if (timerElement) {
            timerElement.textContent = formatTime(remaining);
        }
    }, 1000);
}

// ===== FORMAT TIME =====
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ===== LOGIN FORM =====
function initLoginForm() {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check lockout again
        if (checkLockoutStatus()) {
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validation
        if (!username || !password) {
            showToast('Please enter both username and password');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: username, password }) // Mapping username field to email
            });
            
            const result = await response.json();
            
            if (response.ok && result.token) {
                // Clear any previous failed attempts
                localStorage.removeItem('loginAttempts');
                
                // Store token
                localStorage.setItem('token', result.token);
                
                // Redirect to dashboard
                window.location.href = 'dashboard_74829.html';
            } else {
                handleLoginError(response.status, result);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showToast('Network error. Please try again.');
        } finally {
            setLoadingState(false);
        }
    });
}

// ===== HANDLE LOGIN ERROR =====
function handleLoginError(status, result) {
    // Track failed attempts
    let attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
    attempts++;
    localStorage.setItem('loginAttempts', attempts.toString());
    
    const remainingAttempts = MAX_ATTEMPTS - attempts;
    
    if (status === 423) {
        // Account locked
        const lockoutEnd = result.lockUntil || (Date.now() + LOCKOUT_DURATION);
        localStorage.setItem('loginLockoutEnd', lockoutEnd.toString());
        showLockoutScreen(lockoutEnd);
    } else if (remainingAttempts <= 0) {
        // Max attempts reached, trigger lockout
        const lockoutEnd = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem('loginLockoutEnd', lockoutEnd.toString());
        showLockoutScreen(lockoutEnd);
    } else {
        // Show error with remaining attempts
        const errorMessage = result.error || 'Invalid credentials';
        showToast(errorMessage);
        
        // Update attempts display
        loginAttemptsDiv.textContent = `${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining`;
        loginAttemptsDiv.classList.add('show');
        
        // Clear attempts display after 3 seconds
        setTimeout(() => {
            loginAttemptsDiv.textContent = '';
            loginAttemptsDiv.classList.remove('show');
        }, 3000);
        
        // Shake animation on inputs
        usernameInput.parentElement.classList.add('shake');
        passwordInput.parentElement.classList.add('shake');
        
        setTimeout(() => {
            usernameInput.parentElement.classList.remove('shake');
            passwordInput.parentElement.classList.remove('shake');
        }, 500);
    }
}

// ===== SET LOADING STATE =====
function setLoadingState(loading) {
    if (loading) {
        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    } else {
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
        loginBtn.innerHTML = '<span>Access Portal</span><i class="fas fa-arrow-right"></i>';
    }
}

// ===== SHOW TOAST =====
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== SECURITY: CLEAR SENSITIVE DATA ON PAGE UNLOAD =====
window.addEventListener('beforeunload', () => {
    // Don't clear token here as it's needed for session
    // Only clear if explicitly logging out
});

// ===== SECURITY: PREVENT BACK BUTTON AFTER LOGOUT =====
if (window.history && window.history.pushState) {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function() {
        window.history.pushState(null, null, window.location.href);
    };
}
