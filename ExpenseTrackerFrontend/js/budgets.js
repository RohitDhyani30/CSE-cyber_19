// Global state
let userExpenses = [];
let userBudgets = [];

document.addEventListener('DOMContentLoaded', () => {
    // Get user info from common.js
    const user = getAuthInfo();
    if (user) {

        // Populate the wallet balance display as soon as the page loads
        const walletBalanceEl = document.getElementById('walletBalanceDisplay');
        if (walletBalanceEl) {
            // Use the formatCurrency function from common.js
            walletBalanceEl.textContent = formatCurrency(user.walletBalance || 0);
        }

        loadCategories();
        fetchAllData(); // This loads both budgets and expenses
        
        // Set default date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('startDate').value = today;
    }
});

/**
 * Fetches all categories and populates the dropdown
 */
async function loadCategories() {
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
    }
}

/**
 * Fetches all expenses for the user and stores them globally.
 */
async function loadUserExpenses() {
    const user = getAuthInfo();
    if (!user) return;
    try {
        const response = await fetch(`${EXPENSE_API_URL}/user/${user.userID}`); // From common.js
        if (response.status === 204) {
            userExpenses = [];
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch expenses');
        userExpenses = await response.json();
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

/**
 * Fetches all budgets AND expenses, then renders the budget list.
 */
async function fetchAllData() {
    showLoader();
    const user = getAuthInfo();
    if (!user) return;

    const container = document.getElementById("budgetsList");
    container.innerHTML = "<p class='empty-message'>Loading budgets...</p>";

    try {
        // Fetch budgets and expenses at the same time
        const [budgetResponse, _] = await Promise.all([
            fetch(`${BUDGET_API_URL}/user/${user.userID}`), // From common.js
            loadUserExpenses() // Populates the global userExpenses array
        ]);
        
        if (budgetResponse.status === 204) {
             container.innerHTML = "<p class='empty-message'>No budgets found. Create one!</p>";
             userBudgets = []; // Ensure budgets array is empty
             return;
        }
        if (!budgetResponse.ok) throw new Error('Failed to load budgets.');

        userBudgets = await budgetResponse.json(); // Store budgets globally
        container.innerHTML = ""; // Clear "Loading"

        // Now render the budget cards
        userBudgets.forEach(budget => {
            const card = document.createElement("div");
            card.className = "card";

            // Calculate remaining amount for this budget
            const categoryId = budget.category.categoryId;
            const expensesForCategory = userExpenses.filter(e => e.category.categoryId === categoryId);
            const totalSpent = expensesForCategory.reduce((sum, expense) => sum + expense.expenseAmount, 0);
            const remaining = budget.budgetAmount - totalSpent;
            const remainingClass = remaining >= 0 ? 'positive' : 'negative';
            
            // Populate the card's HTML
            card.innerHTML = `
                <h2>${budget.category.categoryName}</h2>
                <p><strong>Budgeted:</strong> ${formatCurrency(budget.budgetAmount)}</p>
                <p><strong>Start Date:</strong> ${budget.startDate}</p>
                <p><strong>End Date:</strong> ${budget.endDate}</p>
                <p class="remaining">
                    Remaining: <span class="${remainingClass}">${formatCurrency(remaining)}</span>
                </p>
                <button class="btn btn-danger" onclick="deleteBudget(${budget.budgetId})">Delete</button>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = "<p class='empty-message'>Error fetching budgets.</p>";
    } finally {
        hideLoader();
    }
}

/**
 * Creates a new budget after checking against the wallet.
 */
async function createBudget() {
    showLoader();
    const user = getAuthInfo();
    const categoryId = document.getElementById('categoryDropdown').value;
    const amount = document.getElementById('budgetAmount').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!categoryId || !amount || !startDate || !endDate) {
        showResponseMessage('createResponse', 'Please fill in all fields.', true);
        hideLoader();
        return;
    }

    const newBudgetAmount = parseFloat(amount);
    // Recalculate existing budget sum from the global 'userBudgets' array
    const existingBudgetSum = userBudgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const walletBalance = user.walletBalance || 0;

    // Check against wallet
    if ((existingBudgetSum + newBudgetAmount) > walletBalance) {
        const available = walletBalance - existingBudgetSum;
        showResponseMessage('createResponse', `Budget exceeds wallet balance. You only have ${formatCurrency(available)} available to budget.`, true);
        hideLoader();
        return;
    }

    const budgetData = {
        userId: user.userID,
        categoryId: parseInt(categoryId),
        budgetAmount: amount, // Send as string for BigDecimal
        startDate: startDate,
        endDate: endDate
    };

    try {
        const response = await fetch(BUDGET_API_URL, { // From common.js
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(budgetData),
        });

        if (!response.ok) {
            const errorText = await response.text(); 
            throw new Error(errorText || 'Error creating budget.');
        }
        
        showResponseMessage('createResponse', 'Budget created successfully!', false);
        document.getElementById('budgetForm').reset();
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('startDate').value = today;
        
        fetchAllData(); // This will reload budgets and re-calculate remaining amounts

    } catch (error) {
        showResponseMessage('createResponse', `Error: ${error.message}`, true);
        console.error('Error creating budget:', error);
    } finally {
        hideLoader();
    }
}

/**
 * Deletes a budget.
 */
async function deleteBudget(budgetId) {
    if (!confirm('Are you sure you want to delete this budget?')) {
        return;
    }
    
    showLoader();
    try {
        const response = await fetch(`${BUDGET_API_URL}/${budgetId}`, { // From common.js
            method: 'DELETE',
        });

        if (response.status !== 204 && !response.ok) {
            throw new Error('Error deleting budget');
        }

        showResponseMessage('createResponse', 'Budget deleted successfully.', false);
        fetchAllData(); // This will reload budgets and re-calculate remaining amounts

    } catch (error) {
        showResponseMessage('createResponse', `Error deleting budget: ${error.message}`, true);
        console.error('Error deleting budget:', error);
    } finally {
        hideLoader();
    }
}