// Global variable to hold the chart instance so we can destroy it
let spendingChartInstance = null;

// --- Main Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // getAuthInfo() is in common.js
    const user = getAuthInfo();
    if (user) {
        setDefaultDates();
        loadCategories();
    }
});

/**
 * Sets the start date to the 1st of the month and end date to today.
 */
function setDefaultDates() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    document.getElementById('startDate').value = firstDayOfMonth;
    document.getElementById('endDate').value = todayStr;
}

/**
 * Fetches all categories and populates the multi-select dropdown.
 */
async function loadCategories() {
    const dropdown = document.getElementById('categoryDropdown');
    dropdown.innerHTML = ''; // Clear "Loading"

    try {
        const response = await fetch(CATEGORY_API_URL); // From common.js
        if (!response.ok) throw new Error('Failed to fetch categories');
        const categories = await response.json();

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.categoryId;
            option.textContent = category.categoryName;
            dropdown.appendChild(option);
        });
    } catch (error) {
        dropdown.innerHTML = '<option value="">Error loading categories</option>';
        console.error('Error loading categories:', error);
    }
}

/**
 * Clears all selected options in the category dropdown.
 */
function clearCategories() {
    const dropdown = document.getElementById('categoryDropdown');
    for (const option of dropdown.options) {
        option.selected = false;
    }
}

/**
 * Main function called by the "Generate Report" button.
 */
async function generateReport() {
    showLoader(); // from common.js
    const user = getAuthInfo(); // from common.js
    if (!user) return;

    // Get filter values
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Get all selected category IDs
    const categoryOptions = document.getElementById('categoryDropdown').options;
    const categoryIds = [];
    for (const option of categoryOptions) {
        if (option.selected) {
            categoryIds.push(option.value);
        }
    }

    if (!startDate || !endDate) {
        alert('Please select a Start Date and End Date.');
        hideLoader(); // from common.js
        return;
    }

    // Build the URL with query parameters
    const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
    });
    categoryIds.forEach(id => params.append('categoryIds', id));

    const url = `${REPORT_API_URL}/user/${user.userID}?${params.toString()}`; // From common.js
    
    // Hide old report content
    document.getElementById('reportContent').classList.add('hidden');
    document.getElementById('noDataMessage').classList.add('hidden');

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const report = await response.json();

        // Check if we got any data
        if (report.totalTransactions === 0) {
            document.getElementById('noDataMessage').classList.remove('hidden');
        } else {
            // We have data, populate the page
            populateMetrics(report);
            renderSpendingChart(report.spendingByDay);
            renderCategoryTable(report.spendingByCategory);
            renderTopExpensesTable(report.topExpenses);
            
            // Show the report
            document.getElementById('reportContent').classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error generating report:', error);
        alert('Failed to generate report. Check the console for details.');
    } finally {
        hideLoader(); // from common.js
    }
}

/**
 * Fills in the 3 big metric cards at the top.
 */
function populateMetrics(report) {
    const totalBudgetEl = document.getElementById('totalBudget');
    const totalSpendingEl = document.getElementById('totalSpending');
    const remainingBudgetEl = document.getElementById('remainingBudget');

    // formatCurrency() is in common.js
    totalBudgetEl.textContent = formatCurrency(report.totalBudget);
    totalSpendingEl.textContent = formatCurrency(report.totalSpending);
    remainingBudgetEl.textContent = formatCurrency(report.remainingBudget);

    // Add color coding for remaining budget
    remainingBudgetEl.classList.remove('positive', 'negative');
    if (report.remainingBudget > 0) {
        remainingBudgetEl.classList.add('positive');
    } else if (report.remainingBudget < 0) {
        remainingBudgetEl.classList.add('negative');
    }
}

/**
 * Renders the line chart for spending over time.
 */
function renderSpendingChart(spendingByDay) {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    
    // Destroy the old chart if it exists
    if (spendingChartInstance) {
        spendingChartInstance.destroy();
    }
    
    // Map data for the chart
    const labels = spendingByDay.map(item => item.date);
    const data = spendingByDay.map(item => item.total);

    spendingChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Spending',
                data: data,
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/**
 * Renders the table for spending by category.
 * THIS IS THE CORRECTED FUNCTION.
 */
function renderCategoryTable(spendingByCategory) {
    const container = document.getElementById('categoryTableContainer');
    if (spendingByCategory.length === 0) {
        container.innerHTML = '<p class="empty-message">No category spending.</p>';
        return;
    }
    
    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Amount Spent</th>
                    <th>Budgeted</th>
                    <th>% of Budget Used</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    spendingByCategory.forEach(item => {
        // This line now correctly reads 'percentageOfBudgetUsed'
        const percentage = item.percentageOfBudgetUsed;
        let barColor = (percentage > 90) ? '#dc3545' : '#4facfe'; // Red if over 90%
        if (percentage > 100) barColor = '#dc3545'; // Also red if over 100
        
        tableHtml += `
            <tr>
                <td>${item.categoryName}</td>
                <td>${formatCurrency(item.totalSpent)}</td>
                <td>${formatCurrency(item.budgetedAmount)}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${Math.min(percentage, 100)}%; background: ${barColor};">
                            ${percentage.toFixed(1)}%
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHtml += '</tbody></table>';
    container.innerHTML = tableHtml;
}

/**
 * Renders the table for top 5 expenses.
 */
function renderTopExpensesTable(topExpenses) {
    const container = document.getElementById('topExpensesContainer');
    if (topExpenses.length === 0) {
        container.innerHTML = '<p class="empty-message">No expenses to show.</p>';
        return;
    }
    
    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Note</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    topExpenses.forEach(item => {
        tableHtml += `
            <tr>
                <td>${item.expenseDate}</td>
                <td>${item.categoryName}</td>
                <td>${formatCurrency(item.expenseAmount)}</td>
                <td>${item.note || ''}</td>
            </tr>
        `;
    });
    
    tableHtml += '</tbody></table>';
    container.innerHTML = tableHtml;
}