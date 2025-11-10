// Global state
let userBudgets = [];
let userExpenses = [];

// --- Loader Functions ---
//const loader = document.getElementById('loader');

function showLoader() {
    if (loader) loader.style.display = 'flex';
}

function hideLoader() {
    if (loader) loader.style.display = 'none';
}

function getAuthInfo() {
    const userString = localStorage.getItem('loggedInUser'); 
    if (!userString) {
        alert('You are not logged in. Redirecting to login page.');
        window.location.href = 'login.html'; 
        return null;
    }
    const user = JSON.parse(userString);
    if (!user.userID) { 
        console.error('User object in localStorage is missing "userID" property.', user);
        alert('Login data is corrupted. Please log in again.');
        localStorage.removeItem('loggedInUser');
        window.location.href = 'login.html';
        return null;
    }
    return user; 
}

/**
 * Displays a success or error message
 */
function showResponseMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = isError ? 'error' : 'success';
    setTimeout(() => {
        element.textContent = '';
        element.className = '';
    }, 3000);
}

/**
 * Formats a number as USD currency.
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}


// --- Main Functions (called from HTML) ---

/**
 * Runs when the page is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const user = getAuthInfo();
    if (user) {

        // Populate the wallet balance display as soon as the page loads
        const walletBalanceEl = document.getElementById('walletBalanceDisplay');
        if (walletBalanceEl) {
            walletBalanceEl.textContent = formatCurrency(user.walletBalance || 0);
        }

        loadCategories();
        
        Promise.all([
            loadUserBudgets(),
            getAllExpenses() 
        ]).then(() => {
            updateBudgetInfo();
        });

        document.getElementById('expenseDate').valueAsDate = new Date();
        document.getElementById('categoryDropdown').addEventListener('change', updateBudgetInfo);
    }
});

/**
 * Fetches all categories and populates the dropdown
 */
async function loadCategories() {
    showLoader();
    const dropdown = document.getElementById('categoryDropdown');
    dropdown.innerHTML = '<option value="">Loading...</option>'; 

    try {
        const response = await fetch(CATEGORY_API_URL); // From common.js
        if (!response.ok) throw new Error('Failed to fetch categories');
        const categories = await response.json();

        dropdown.innerHTML = '<option value="">Select category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.categoryId;
            option.textContent = category.categoryName;
            dropdown.appendChild(option);
        });

    } catch (error) {
        dropdown.innerHTML = '<option value="">Error loading</option>';
        console.error('Error loading categories:', error);
    } finally {
        hideLoader();
    }
}

/**
 * Fetches all budgets for the user and stores them in the global variable.
 */
async function loadUserBudgets() {
    const user = getAuthInfo();
    if (!user) return;
    
    try {
        const response = await fetch(`${BUDGET_API_URL}/user/${user.userID}`); // From common.js
        if (response.status === 204) {
            userBudgets = []; 
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch budgets');
        userBudgets = await response.json();
        console.log('Budgets loaded:', userBudgets);
    } catch (error) {
        console.error('Error loading budgets:', error);
    }
}

/**
 * Fetches all expenses FOR THE CURRENT USER and populates the table
 */
async function getAllExpenses() {
    showLoader();
    const user = getAuthInfo();
    if (!user) return; 

    const tableBody = document.getElementById('expenseTableBody');
    tableBody.innerHTML = `<tr><td colspan="5">Loading expenses...</td></tr>`;

    try {
        const response = await fetch(`${EXPENSE_API_URL}/user/${user.userID}`); // From common.js
        if (response.status === 204) {
             tableBody.innerHTML = `<tr><td colspan="5">No expenses found. Add one!</td></tr>`;
             userExpenses = [];
             return;
        }
        if (!response.ok) throw new Error('Failed to fetch expenses');
        const expenses = await response.json();
        userExpenses = expenses;
        console.log('Expenses loaded:', userExpenses);
        
        tableBody.innerHTML = ''; 
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.expenseDate}</td>
                <td>${expense.category.categoryName}</td>
                <td>${formatCurrency(expense.expenseAmount)}</td>
                <td>${expense.note || ''}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteExpense(${expense.expenseId})">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="5">Error loading expenses.</td></tr>`;
        console.error('Error loading expenses:', error);
    } finally {
        hideLoader();
    }
}

/**
 * Calculates the remaining budget for a specific category.
 * Returns the remaining amount, or null if no budget is set.
 */
function getRemainingBudget(selectedCategoryId) {
    if (!selectedCategoryId) {
        return null;
    }
    const matchingBudget = userBudgets.find(b => b.category.categoryId === selectedCategoryId);
    if (!matchingBudget) {
        return null; 
    }
    const expensesForCategory = userExpenses.filter(e => e.category.categoryId === selectedCategoryId);
    const totalSpent = expensesForCategory.reduce((sum, expense) => sum + expense.expenseAmount, 0);
    const budgetAmount = matchingBudget.budgetAmount;
    return budgetAmount - totalSpent;
}

/**
 * Calculates and displays the remaining budget for the selected category.
 */
function updateBudgetInfo() {
    const categoryDropdown = document.getElementById('categoryDropdown');
    const selectedCategoryId = parseInt(categoryDropdown.value);
    
    const budgetInfoEl = document.getElementById('budgetInfoDisplay');
    const remainingValueEl = document.getElementById('remainingBudgetValue');

    if (!selectedCategoryId) {
        budgetInfoEl.classList.add('hidden');
        return;
    }

    const remaining = getRemainingBudget(selectedCategoryId);

    if (remaining === null) {
        remainingValueEl.textContent = "N/A (No Budget Set)";
        remainingValueEl.className = '';
    } else {
        remainingValueEl.textContent = formatCurrency(remaining);
        remainingValueEl.className = remaining >= 0 ? 'positive' : 'negative';
    }
    budgetInfoEl.classList.remove('hidden');
}

/**
 * Creates a new expense
 */
async function createExpense() {
    showLoader();
    const user = getAuthInfo();
    const categoryId = document.getElementById('categoryDropdown').value; 
    const amount = document.getElementById('expenseAmount').value; 
    const date = document.getElementById('expenseDate').value;
    const description = document.getElementById('expenseDescription').value;

    if (categoryId === "" || !amount || !date) { 
        showResponseMessage('createResponse', 'Please fill in Category, Amount, and Date.', true);
        hideLoader();
        return;
    }

    const newExpenseAmount = parseFloat(amount);
    const remainingBudget = getRemainingBudget(parseInt(categoryId));

    // 1. Budget Overrun Warning
    if (remainingBudget !== null && newExpenseAmount > remainingBudget) {
        const overage = newExpenseAmount - remainingBudget;
        const warningMessage = `You are about to exceed your budget for this category by ${formatCurrency(overage)}.
        
Are you sure you want to create this expense?`;
        
        if (!confirm(warningMessage)) {
            hideLoader();
            return; 
        }
    }
    
    // 2. Wallet Balance Check
    const walletBalance = user.walletBalance || 0;
    if (newExpenseAmount > walletBalance) {
         showResponseMessage('createResponse', `This expense exceeds your wallet balance. You only have ${formatCurrency(walletBalance)} left.`, true);
         hideLoader();
         return;
    }

    const expenseData = {
        userId: user.userID, 
        categoryId: parseInt(categoryId),
        expenseAmount: amount, 
        expenseDate: date,
        note: description
    };

    try {
        const response = await fetch(EXPENSE_API_URL, { // From common.js
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData),
        });

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const newExpense = await response.json();
        
        showResponseMessage('createResponse', `Expense created! (ID: ${newExpense.expenseId})`, false);
        
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseDate').valueAsDate = new Date();
        
        // Refresh wallet balance in localStorage and display
        const updatedUser = { ...user, walletBalance: walletBalance - newExpenseAmount };
        localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
        document.getElementById('walletBalanceDisplay').textContent = formatCurrency(updatedUser.walletBalance);
        
        // Refresh expense list and remaining budget display
        await getAllExpenses(); 
        updateBudgetInfo(); 

    } catch (error) {
        showResponseMessage('createResponse', `Error creating expense: ${error.message}`, true);
        console.error('Error creating expense:', error);
        hideLoader();
    }
}

/**
 * Deletes an expense
 */
async function deleteExpense(expenseId) { 
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    showLoader();
    try {
        const response = await fetch(`${EXPENSE_API_URL}/${expenseId}`, { // From common.js
            method: 'DELETE',
        });

        if (response.status !== 204 && !response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        showResponseMessage('createResponse', 'Expense deleted successfully.', false);
        
        // Find the amount of the deleted expense to refund the wallet
        const deletedExpense = userExpenses.find(e => e.expenseId === expenseId);
        const refundAmount = deletedExpense ? deletedExpense.expenseAmount : 0;

        // Refresh wallet balance in localStorage and display
        const user = getAuthInfo();
        const updatedUser = { ...user, walletBalance: (user.walletBalance || 0) + refundAmount };
        localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
        document.getElementById('walletBalanceDisplay').textContent = formatCurrency(updatedUser.walletBalance);

        // Refresh expense list and remaining budget display
        await getAllExpenses(); 
        updateBudgetInfo(); 

    } catch (error) {
        showResponseMessage('createResponse', `Error deleting expense: ${error.message}`, true);
        console.error('Error deleting expense:', error);
        hideLoader();
    }
}


// --- Category Modal Functions (No changes needed) ---

const modal = document.getElementById('categoryModal');

function openCategoryModal() {
    modal.style.display = 'block';
}

function closeCategoryModal() {
    modal.style.display = 'none';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryResponse').textContent = '';
}

async function submitCategory() {
    const name = document.getElementById('categoryName').value;
    const description = document.getElementById('categoryDescription').value;

    if (!name) {
        showResponseMessage('categoryResponse', 'Category name is required.', true);
        return;
    }

    const categoryData = {
        categoryName: name,
        description: description
    };

    try {
        const response = await fetch(CATEGORY_API_URL, { // From common.js
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData),
        });

        if (!response.ok) throw new Error('Category already exists or invalid data.');
        const newCategory = await response.json();
        
        showResponseMessage('categoryResponse', `Category '${newCategory.categoryName}' created!`, false);
        loadCategories(); 
        setTimeout(closeCategoryModal, 1500);

    } catch (error) {
        showResponseMessage('categoryResponse', error.message, true);
        console.error('Error creating category:', error);
    }
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeCategoryModal();
    }
}
