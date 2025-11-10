// This file assumes common.js is loaded first
// It uses functions from common.js like getAuthInfo(), showLoader(), etc.

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const user = getAuthInfo(); 
    
    if (user) {
        // 1. Populate user info immediately
        populateUserInfo(user);
        
        // 2. Fetch AI prediction
        fetchPrediction(user.userID);
    }
});

/**
 * Populates the user card with info from localStorage.
 */
function populateUserInfo(user) {
    document.getElementById('userId').textContent = user.userID;
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('walletBalance').textContent = formatCurrency(user.walletBalance || 0);
}

/**
 * Fetches the next month's expense prediction from backend.
 */
async function fetchPrediction(userId) {
    const predictionEl = document.getElementById('aiPredictionValue');
    const noteEl = document.getElementById('aiPredictionNote');
    
    try {
        const response = await fetch(`${AI_API_URL}/predict-expense/${userId}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Prediction service failed' }));
            throw new Error(errorData.error || 'Prediction service failed');
        }

        const predictionData = await response.json();
        
        if (predictionData.error) {
            throw new Error(predictionData.error);
        }

        predictionEl.textContent = formatCurrency(predictionData.predicted_next_month_expense);
        noteEl.textContent = `Based on ${predictionData.based_on_month || 'recent data'}`;

    } catch (error) {
        console.error('Error fetching AI prediction:', error);
        predictionEl.textContent = "N/A";
        
        if (error.message.includes('unavailable')) {
            noteEl.textContent = "AI service unavailable";
        } else if (error.message.includes('data')) {
            noteEl.textContent = "Not enough data";
        } else {
            noteEl.textContent = "Prediction failed";
        }
    }
}

/**
 * Logs the user out by clearing localStorage and redirecting.
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        setAuthInfo(null);
        window.location.href = '../html/login.html';
    }
}

// --- Wallet Modal Functions ---

const modal = document.getElementById('walletModal');

function openWalletModal() {
    const user = getAuthInfo();
    document.getElementById('walletAmount').value = user.walletBalance || 0;
    showModalResponse('', false);
    modal.style.display = 'flex';
}

function closeWalletModal() {
    modal.style.display = 'none';
    document.getElementById('walletForm').reset();
    showModalResponse('', false);
}

async function submitWalletUpdate() {
    showLoader();
    const user = getAuthInfo();
    const newAmount = document.getElementById('walletAmount').value;

    if (newAmount === '' || parseFloat(newAmount) < 0) {
        showModalResponse('Please enter a valid, non-negative amount.', true);
        hideLoader();
        return;
    }

    try {
        const url = `${USER_API_URL}/${user.userID}/wallet?amount=${newAmount}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update wallet');
        }

        const updatedUserResponse = await response.json();
        
        setAuthInfo(updatedUserResponse);
        showModalResponse('Wallet updated successfully!', false);
        populateUserInfo(updatedUserResponse);
        
        setTimeout(closeWalletModal, 1500);

    } catch (error) {
        console.error('Error updating wallet:', error);
        showModalResponse(error.message, true);
    } finally {
        hideLoader();
    }
}

/**
 * Shows a success/error message inside the modal.
 */
function showModalResponse(message, isError = false) {
    const element = document.getElementById('walletResponse');
    element.textContent = message;
    element.className = isError ? 'response-message error' : 'response-message success';
    
    if (!message) {
        element.className = 'response-message';
    }
}

// Close modal if user clicks outside of it
window.onclick = function(event) {
    if (event.target == modal) {
        closeWalletModal();
    }
}