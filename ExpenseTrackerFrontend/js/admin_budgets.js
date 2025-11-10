let allBudgets = [];
let allUsers = [];
let allCategories = [];
const modal = document.getElementById('budgetModal');

document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        fetchAllBudgets(),
        loadAllUsers(),
        loadAllCategories()
    ]).then(() => {
        populateModalDropdowns();
    }).catch(error => {
        console.error("Error during initial data load:", error);
    });
});

async function fetchAllBudgets() {
    showLoader();
    const tableBody = document.getElementById('budgetsTableBody');
    tableBody.innerHTML = `<tr><td colspan="8">Loading budgets...</td></tr>`;

    try {
        const response = await fetch(BUDGET_API_URL);
        if (response.status === 204) {
            tableBody.innerHTML = `<tr><td colspan="8">No budgets found in the system.</td></tr>`;
            allBudgets = [];
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch budgets');
        
        allBudgets = await response.json();
        renderBudgetsTable(allBudgets);
    } catch (error) {
        console.error('Error fetching budgets:', error);
        tableBody.innerHTML = `<tr><td colspan="8">Error loading budgets.</td></tr>`;
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

function renderBudgetsTable(budgets) {
    const tableBody = document.getElementById('budgetsTableBody');
    tableBody.innerHTML = '';

    if (budgets.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8">No budgets found matching your search.</td></tr>`;
        return;
    }

    budgets.forEach(budget => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${budget.budgetId}</td>
            <td>${budget.user ? budget.user.userId : 'N/A'}</td>
            <td>${budget.user ? budget.user.name : 'N/A'}</td>
            <td>${budget.category ? budget.category.categoryName : 'N/A'}</td>
            <td>${formatCurrency(budget.budgetAmount)}</td>
            <td>${budget.startDate}</td>
            <td>${budget.endDate}</td>
            <td>
                <button class="btn btn-action btn-action-edit" onclick="openEditModal(${budget.budgetId})">Edit</button>
                <button class="btn btn-action btn-action-delete" onclick="deleteBudget(${budget.budgetId})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function filterBudgets() {
    const searchTerm = document.getElementById('budgetSearch').value.trim();
    
    if (!searchTerm) {
        renderBudgetsTable(allBudgets);
        return;
    }
    
    const searchId = parseInt(searchTerm);
    const filteredBudgets = allBudgets.filter(budget => {
        const userId = budget.user ? budget.user.userId : null;
        return userId === searchId;
    });
    
    renderBudgetsTable(filteredBudgets);
}

function clearSearch() {
    document.getElementById('budgetSearch').value = '';
    renderBudgetsTable(allBudgets);
}

async function deleteBudget(budgetId) {
    if (!confirm(`Are you sure you want to delete budget ID: ${budgetId}?`)) return;
    
    showLoader();
    try {
        const response = await fetch(`${BUDGET_API_URL}/${budgetId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete budget');
        fetchAllBudgets();
    } catch (error) {
        console.error('Error deleting budget:', error);
        alert('Error deleting budget. See console for details.');
        hideLoader();
    }
}

function openCreateModal() {
    document.getElementById('budgetForm').reset();
    document.getElementById('modalTitle').textContent = 'Create New Budget';
    document.getElementById('modalBudgetId').value = ''; 
    document.getElementById('modalWalletDisplay').classList.add('hidden');
    showModalResponse('', false); 
    modal.style.display = 'flex';
}

function openEditModal(budgetId) {
    const budget = allBudgets.find(b => b.budgetId === budgetId);
    if (!budget) {
        alert('Error: Could not find budget data.');
        return;
    }
    
    document.getElementById('budgetForm').reset();
    document.getElementById('modalTitle').textContent = `Edit Budget ID: ${budget.budgetId}`;
    document.getElementById('modalBudgetId').value = budget.budgetId;
    document.getElementById('modalUser').value = budget.user.userId;
    document.getElementById('modalCategory').value = budget.category.categoryId;
    document.getElementById('modalAmount').value = budget.budgetAmount;
    document.getElementById('modalStartDate').value = budget.startDate;
    document.getElementById('modalEndDate').value = budget.endDate;
    
    onUserChange();
    showModalResponse('', false);
    modal.style.display = 'flex';
}

function closeBudgetModal() {
    modal.style.display = 'none';
    document.getElementById('budgetForm').reset();
    document.getElementById('modalWalletDisplay').classList.add('hidden');
    showModalResponse('', false);
}

function onUserChange() {
    const userId = document.getElementById('modalUser').value;
    const walletDisplay = document.getElementById('modalWalletDisplay');
    const walletBalanceEl = document.getElementById('modalWalletBalance');

    if (!userId) {
        walletDisplay.classList.add('hidden');
        return;
    }
    
    const user = allUsers.find(u => u.userID === parseInt(userId));
    
    if (user) {
        walletBalanceEl.textContent = formatCurrency(user.walletBalance || 0);
        walletDisplay.classList.remove('hidden');
    } else {
        walletDisplay.classList.add('hidden');
    }
}

async function submitBudgetForm() {
    showLoader();
    
    const budgetId = document.getElementById('modalBudgetId').value;
    const userId = document.getElementById('modalUser').value;
    const categoryId = document.getElementById('modalCategory').value;
    const amount = document.getElementById('modalAmount').value;
    const startDate = document.getElementById('modalStartDate').value;
    const endDate = document.getElementById('modalEndDate').value;

    if (!userId || !categoryId || !amount || !startDate || !endDate) {
        showModalResponse('All fields are required.', true);
        hideLoader();
        return;
    }

    const user = allUsers.find(u => u.userID === parseInt(userId));
    
    let existingBudgetSum = 0;
    allBudgets.forEach(b => {
        if (b.user && b.user.userId === parseInt(userId) && b.budgetId !== parseInt(budgetId)) {
            existingBudgetSum += b.budgetAmount;
        }
    });
    
    const newBudgetAmount = parseFloat(amount);
    const walletBalance = user ? (user.walletBalance || 0) : 0;

    if (user && (existingBudgetSum + newBudgetAmount) > walletBalance) {
        const available = walletBalance - existingBudgetSum;
        showModalResponse(`Budget exceeds wallet. Only ${formatCurrency(available)} available.`, true);
        hideLoader();
        return;
    }

    const budgetData = {
        userId: parseInt(userId),
        categoryId: parseInt(categoryId),
        budgetAmount: amount,
        startDate: startDate,
        endDate: endDate
    };

    const isEditing = budgetId !== '';
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${BUDGET_API_URL}/${budgetId}` : BUDGET_API_URL;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(budgetData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to save budget.');
        }
        
        closeBudgetModal();
        fetchAllBudgets();
    } catch (error) {
        console.error('Error saving budget:', error);
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
        closeBudgetModal();
    }
}