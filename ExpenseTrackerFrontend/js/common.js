// --- API Base URLs ---
const BASE_API_URL = 'http://localhost:8080';
const AUTH_API_URL = `${BASE_API_URL}/api/auth`;
const USER_API_URL = `${BASE_API_URL}/api/users`;
const CATEGORY_API_URL = `${BASE_API_URL}/api/categories`;
const BUDGET_API_URL = `${BASE_API_URL}/api/budget`;
const EXPENSE_API_URL = `${BASE_API_URL}/api/expenses`;
const REPORT_API_URL = `${BASE_API_URL}/api/reports`;

// --- NEW AI API URL ---
const AI_API_URL = `${BASE_API_URL}/api/ai`;


// --- Loader Functions ---
const loader = document.getElementById('loader');

function showLoader() {
    if (loader) loader.style.display = 'flex';
}

function hideLoader() {
    if (loader) loader.style.display = 'none';
}


// --- Auth & User Helper Functions ---

/**
 * Gets the logged-in user's info from localStorage.
 * This is the central source of user data for the app.
 * @returns {object | null} The user object or null if not logged in.
 */
function getAuthInfo() {
    const userString = localStorage.getItem('loggedInUser'); 
    if (!userString) {
        // This is a protected page, so redirect to login
        alert('You are not logged in. Redirecting to login page.');
        window.location.href = '../html/login.html'; 
        return null;
    }
    
    const user = JSON.parse(userString);
    
    // Check for the critical userID property
    if (!user.userID) { 
        console.error('User object in localStorage is missing "userID" property.', user);
        alert('Login data is corrupted. Please log in again.');
        localStorage.removeItem('loggedInUser');
        window.location.href = '../html/login.html';
        return null;
    }
    
    return user; 
}

/**
 * Saves the user object to localStorage.
 * @param {object | null} user - The user object to save, or null to clear.
 */
function setAuthInfo(user) {
    if (user) {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('loggedInUser');
    }
}


// --- Utility Functions ---

/**
 * Displays a success or error message in a standard response element.
 * @param {string} elementId - The ID of the element to show the message in
 * @param {string} message - The message text
 * @param {boolean} isError - True for error (red), false for success (green)
 */
function showResponseMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    if (!element) return; // Guard against missing elements
    
    element.textContent = message;
    element.className = isError ? 'response-message error' : 'response-message success';
    
    // Clear the message after 3 seconds
    setTimeout(() => {
        if (element.textContent === message) {
            element.textContent = '';
            element.className = 'response-message';
        }
    }, 3000);
}

/**
 * Formats a number as USD currency.
 * @param {number} amount - The number to format
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}