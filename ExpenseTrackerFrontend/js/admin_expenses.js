// Global variables
let allExpenses = [];
let allUsers = [];
let allCategories = [];
let allBudgets = []; // <-- NEW: To store all budget data
const modal = document.getElementById('expenseModal');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        fetchAllExpenses(),
        loadAllUsers(),
        loadAllCategories(),
        loadAllBudgets() 
    ]).then(() => {
        populateModalDropdowns();
    }).catch(error => {
        console.error("Error during initial data load:", error);
    });
});


async function fetchAllExpenses() {
    showLoader();
    const tableBody = document.getElementById('expensesTableBody');
    tableBody.innerHTML = `<tr><td colspan="8">Loading expenses...</td></tr>`;

    try {
        const response = await fetch(EXPENSE_API_URL);
        if (response.status === 204) {
            tableBody.innerHTML = `<tr><td colspan="8">No expenses found in the system.</td></tr>`;
            allExpenses = [];
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch expenses');
        
        allExpenses = await response.json();
        renderExpensesTable(allExpenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        tableBody.innerHTML = `<tr><td colspan="8">Error loading expenses.</td></tr>`;
    } finally {
        hideLoader();
    }
}


async function loadAllUsers() {
    try {
        const response = await fetch(USER_API_URL);
        if (response.status === 204) {
            allUsers = [];
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch users');
        allUsers = await response.json();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}


async function loadAllCategories() {
    try {
        const response = await fetch(CATEGORY_API_URL);
        if (response.status === 204) {
            allCategories = [];
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch categories');
        allCategories = await response.json();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

/**
 * --- NEW FUNCTION ---
 * Fetches all budgets and stores them in the global variable.
 */
async function loadAllBudgets() {
    try {
        const response = await fetch(BUDGET_API_URL); // From common.js
        if (response.status === 204) {
            allBudgets = [];
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch budgets');
        //allBudgets = await response.json();
        //console.log('All budgets loaded:', allBudgets); // For debugging
    } catch (error) {
        console.error('Error loading budgets:', error);
    }
}
// --- END NEW FUNCTION ---

/**
 * Populates the User and Category dropdowns in the modal.
 */
function populateModalDropdowns() {
    const userDropdown = document.getElementById('modalUser');
    const categoryDropdown = document.getElementById('modalCategory');
    
    userDropdown.innerHTML = '<option value="">Select a User</option>';
    allUsers.forEach(user => {
        userDropdown.innerHTML += `<option value="${user.userID}">${user.name} (ID: ${user.userID})</option>`;
    });

    categoryDropdown.innerHTML = '<option value="">Select a Category</option>';
    allCategories.forEach(category => {
        categoryDropdown.innerHTML += `<option value="${category.categoryId}">${category.categoryName}</option>`;
    });
}

/**
 * Renders the provided list of expenses into the HTML table.
 */
function renderExpensesTable(expenses) {
    const tableBody = document.getElementById('expensesTableBody');
    tableBody.innerHTML = '';

    if (expenses.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8">No expenses found matching your search.</td></tr>`;
        return;
    }

    expenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${expense.expenseId}</td>
            <td>${expense.user ? expense.user.userId : 'N/A'}</td>
            <td>${expense.user ? expense.user.name : 'N/A'}</td>
            <td>${expense.category ? expense.category.categoryName : 'N/A'}</td>
            <td>${formatCurrency(expense.expenseAmount)}</td>
            <td>${expense.expenseDate}</td>
            <td>${expense.note || ''}</td>
            <td>
                <button class="btn btn-action btn-action-edit" onclick="openEditModal(${expense.expenseId})">Edit</button>
                <button class="btn btn-action btn-action-delete" onclick="deleteExpense(${expense.expenseId})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Filters the displayed expenses based on the search bar input.
 */
function filterExpenses() {
    const searchTerm = document.getElementById('expenseSearch').value.trim();
    
    if (!searchTerm) {
        renderExpensesTable(allExpenses);
        return;
    }
    
    const searchId = parseInt(searchTerm);
    const filteredExpenses = allExpenses.filter(expense => {
        const userId = expense.user ? expense.user.userId : null;
        return userId === searchId;
    });
    
    renderExpensesTable(filteredExpenses);
}

/**
 * Clears the search input and shows all expenses.
 */
function clearSearch() {
    document.getElementById('expenseSearch').value = '';
    renderExpensesTable(allExpenses);
}

/**
 * Deletes an expense after confirmation.
 */
async function deleteExpense(expenseId) {
    if (!confirm(`Are you sure you want to delete expense ID: ${expenseId}? This will refund the user's wallet.`)) return;
    
    showLoader();
    try {
        const response = await fetch(`${EXPENSE_API_URL}/${expenseId}`, { method: 'DELETE' });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to delete expense');
        }
        
        // Refresh all data
        await fetchAllExpenses();
        await loadAllUsers(); // Reload users to get updated wallet balance

    } catch (error) {
        console.error('Error deleting expense:', error);
        alert(`Error: ${error.message}`);
    } finally {
        hideLoader();
    }
}

// --- MODAL FUNCTIONS ---

/**
 * Opens the modal in "Create" mode.
 */
function openCreateModal() {
    document.getElementById('expenseForm').reset();
    document.getElementById('modalTitle').textContent = 'Create New Expense';
    document.getElementById('modalExpenseId').value = ''; 
    document.getElementById('modalWalletDisplay').classList.add('hidden');
    document.getElementById('modalBudgetDisplay').classList.add('hidden'); // <-- NEW
    showModalResponse('', false); 
    modal.style.display = 'flex';
}

/**
 * Opens the modal in "Edit" mode and populates it with data.
 */
function openEditModal(expenseId) {
    const expense = allExpenses.find(e => e.expenseId === expenseId);
    if (!expense) {
        alert('Error: Could not find expense data.');
        return;
    }
    
    document.getElementById('expenseForm').reset();
    document.getElementById('modalTitle').textContent = `Edit Expense ID: ${expense.expenseId}`;
    document.getElementById('modalExpenseId').value = expense.expenseId;
    document.getElementById('modalUser').value = expense.user.userId;
    document.getElementById('modalCategory').value = expense.category.categoryId;
    document.getElementById('modalAmount').value = expense.expenseAmount;
    document.getElementById('modalDate').value = expense.expenseDate;
    document.getElementById('modalNote').value = expense.note || '';
    
    onModalSelectionChange(); // <-- NEW: Call the combined function
    showModalResponse('', false);
    modal.style.display = 'flex';
}

/**
 * Closes the modal and resets the form.
 */
function closeExpenseModal() {
    modal.style.display = 'none';
    document.getElementById('expenseForm').reset();
    document.getElementById('modalWalletDisplay').classList.add('hidden');
    document.getElementById('modalBudgetDisplay').classList.add('hidden'); // <-- NEW
    showModalResponse('', false);
}

/**
 * --- UPDATED: This function now handles BOTH wallet and budget displays ---
 * Called when the user or category dropdown in the modal changes.
 */
function onModalSelectionChange() {
    const userId = document.getElementById('modalUser').value;
    const categoryId = document.getElementById('modalCategory').value;
    
    // --- 1. Handle Wallet Display ---
    const walletDisplay = document.getElementById('modalWalletDisplay');
    const walletBalanceEl = document.getElementById('modalWalletBalance');
    if (!userId) {
        walletDisplay.classList.add('hidden');
    } else {
        const user = allUsers.find(u => u.userID === parseInt(userId));
        if (user) {
            walletBalanceEl.textContent = formatCurrency(user.walletBalance || 0);
            walletBalanceEl.className = (user.walletBalance || 0) < 0 ? 'wallet-amount negative' : 'wallet-amount';
            walletDisplay.classList.remove('hidden');
        } else {
            walletDisplay.classList.add('hidden');
        }
    }

    // --- 2. Handle Budget Display ---
    const budgetDisplay = document.getElementById('modalBudgetDisplay');
    const budgetBalanceEl = document.getElementById('modalBudgetBalance');
    
    // Both user and category must be selected
    if (!userId || !categoryId) {
        budgetDisplay.classList.add('hidden');
        return;
    }

    const numUserId = parseInt(userId);
    const numCategoryId = parseInt(categoryId);

    // Find the specific budget for this user AND category
    const matchingBudget = allBudgets.find(b => 
        b.user && b.category && // Add safe checks
        b.user.userId === numUserId && 
        b.category.categoryId === numCategoryId
    );

    if (matchingBudget) {
        // Find all expenses for this user AND category
        const expensesForCategory = allExpenses.filter(e => 
            e.user && e.category && // Add safe checks
            e.user.userId === numUserId && 
            e.category.categoryId === numCategoryId
        );
        
        // Calculate remaining budget
        const totalSpent = expensesForCategory.reduce((sum, expense) => sum + expense.expenseAmount, 0);
        const remaining = matchingBudget.budgetAmount - totalSpent;

        budgetBalanceEl.textContent = `${formatCurrency(remaining)} remaining`;
        budgetBalanceEl.className = remaining >= 0 ? 'budget-amount positive' : 'budget-amount negative';
        budgetDisplay.classList.remove('hidden');
    } else {
        // No budget set for this category
        budgetBalanceEl.textContent = "N/A (No Budget Set)";
        budgetBalanceEl.className = 'budget-amount'; // No color
        budgetDisplay.classList.remove('hidden');
    }
}


async function submitExpenseForm() {
    showLoader();
    
    const expenseId = document.getElementById('modalExpenseId').value;
    const userId = document.getElementById('modalUser').value;
    const categoryId = document.getElementById('modalCategory').value;
    const amount = document.getElementById('modalAmount').value;
    const date = document.getElementById('modalDate').value;
    const note = document.getElementById('modalNote').value;

    if (!userId || !categoryId || !amount || !date) {
        showModalResponse('User, Category, Amount, and Date are required.', true);
        hideLoader();
        return;
    }

    const isEditing = expenseId !== '';
    const user = allUsers.find(u => u.userID === parseInt(userId));
    const newExpenseAmount = parseFloat(amount);
    const walletBalance = user ? (user.walletBalance || 0) : 0;

    if (isEditing) {
        const originalExpense = allExpenses.find(e => e.expenseId === parseInt(expenseId));
        const originalAmount = originalExpense ? originalExpense.expenseAmount : 0;
        const amountDifference = newExpenseAmount - originalAmount;
        
        if (amountDifference > walletBalance) {
             showModalResponse(`This edit costs ${formatCurrency(amountDifference)}, but wallet only has ${formatCurrency(walletBalance)}.`, true);
             hideLoader();
             return;
        }
    } else {
        if (newExpenseAmount > walletBalance) {
             showModalResponse(`Expense exceeds wallet balance of ${formatDsc(walletBalance)}.`, true);
             hideLoader();
             return;
        }
    }

    const expenseData = {
        userId: parseInt(userId),
        categoryId: parseInt(categoryId),
        expenseAmount: amount,
        expenseDate: date,
        note: note
    };

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${EXPENSE_API_URL}/${expenseId}` : EXPENSE_API_URL;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to save expense.');
        }
        
        closeExpenseModal();
        await loadAllUsers();
        await loadAllBudgets();
        await fetchAllExpenses(); 
        
    } catch (error) {
        console.error('Error saving expense:', error);
        showModalResponse(error.message, true);
    } finally {
        hideLoader();
    }
}


function showModalResponse(message, isError = false) {
    const element = document.getElementById('modalResponse');
    element.textContent = message;
    element.className = isError ? 'response-message error' : 'response-message success';
    
    if (!message) {
        element.className = 'response-message';
    }
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeExpenseModal();
    }
}