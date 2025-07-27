// Global variables
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
let pieChart = null;
let barChart = null;

// Categories for transactions
const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other Income'],
    expense: ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Education', 'Other Expense']
};

// DOM elements
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateDashboard();
    updateBudgetSection();
    updateHistorySection();
});

function initializeApp() {
    // Set current date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
    
    // Populate category dropdowns
    populateCategoryDropdowns();
    
    // Initialize charts
    initializeCharts();
}

function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            showSection(targetSection);
            
            // Update active nav link
            navLinks.forEach(nl => nl.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu
            navMenu.classList.remove('active');
        });
    });

    // Mobile hamburger menu
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Transaction modals - separate income and expense buttons
    document.getElementById('addIncomeBtn').addEventListener('click', () => {
        document.getElementById('transactionType').value = 'income';
        updateCategoryOptions();
        showModal('addTransactionModal');
    });

    document.getElementById('addExpenseBtn').addEventListener('click', () => {
        document.getElementById('transactionType').value = 'expense';
        updateCategoryOptions();
        showModal('addTransactionModal');
    });

    document.getElementById('closeModal').addEventListener('click', () => {
        hideModal('addTransactionModal');
    });

    document.getElementById('cancelTransaction').addEventListener('click', () => {
        hideModal('addTransactionModal');
    });

    // Budget modal
    document.getElementById('addBudgetBtn').addEventListener('click', () => {
        showModal('addBudgetModal');
    });

    document.getElementById('closeBudgetModal').addEventListener('click', () => {
        hideModal('addBudgetModal');
    });

    document.getElementById('cancelBudget').addEventListener('click', () => {
        hideModal('addBudgetModal');
    });

    // Forms
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    document.getElementById('budgetForm').addEventListener('submit', handleBudgetSubmit);

    // Transaction type change
    document.getElementById('transactionType').addEventListener('change', updateCategoryOptions);

    // Import/Export
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('csvFileInput').click();
    });

    document.getElementById('csvFileInput').addEventListener('change', handleCSVImport);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);

    // Bank connection (feature coming soon)
    document.getElementById('connectBankBtn').addEventListener('click', () => {
        showNotification('Feature coming soon! Bank account integration will be available in the next update.', 'success');
    });

    // Search and filter
    document.getElementById('searchTransactions').addEventListener('input', filterTransactions);
    document.getElementById('filterCategory').addEventListener('change', filterTransactions);
    document.getElementById('filterType').addEventListener('change', filterTransactions);

    // Close notification
    document.getElementById('closeNotification').addEventListener('click', hideNotification);

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Reset forms
    if (modalId === 'addTransactionModal') {
        document.getElementById('transactionForm').reset();
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    } else if (modalId === 'addBudgetModal') {
        document.getElementById('budgetForm').reset();
    }
}

function populateCategoryDropdowns() {
    const transactionCategorySelect = document.getElementById('transactionCategory');
    const budgetCategorySelect = document.getElementById('budgetCategory');
    const filterCategorySelect = document.getElementById('filterCategory');
    
    // Clear existing options (except first one)
    transactionCategorySelect.innerHTML = '<option value="">Select Category</option>';
    budgetCategorySelect.innerHTML = '<option value="">Select Category</option>';
    filterCategorySelect.innerHTML = '<option value="">All Categories</option>';
    
    // Add all categories
    const allCategories = [...categories.income, ...categories.expense];
    allCategories.forEach(category => {
        transactionCategorySelect.innerHTML += `<option value="${category}">${category}</option>`;
        budgetCategorySelect.innerHTML += `<option value="${category}">${category}</option>`;
        filterCategorySelect.innerHTML += `<option value="${category}">${category}</option>`;
    });
}

function updateCategoryOptions() {
    const type = document.getElementById('transactionType').value;
    const categorySelect = document.getElementById('transactionCategory');
    
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    if (type && categories[type]) {
        categories[type].forEach(category => {
            categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
        });
    }
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transaction = {
        id: Date.now(),
        type: document.getElementById('transactionType').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        description: document.getElementById('transactionDescription').value,
        category: document.getElementById('transactionCategory').value,
        date: document.getElementById('transactionDate').value
    };
    
    // Validate transaction (description is optional now)
    if (!transaction.type || !transaction.amount || !transaction.category || !transaction.date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Set default description if empty
    if (!transaction.description.trim()) {
        transaction.description = 'Transaction';
    }
    
    if (transaction.amount <= 0) {
        showNotification('Amount must be greater than 0', 'error');
        return;
    }
    
    // Add transaction
    transactions.push(transaction);
    saveTransactions();
    
    // Update UI
    updateDashboard();
    updateBudgetSection();
    updateHistorySection();
    
    hideModal('addTransactionModal');
    showNotification('Transaction added successfully!', 'success');
}

function handleBudgetSubmit(e) {
    e.preventDefault();
    
    const category = document.getElementById('budgetCategory').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    
    if (!category || !amount || amount <= 0) {
        showNotification('Please provide valid category and amount', 'error');
        return;
    }
    
    budgets[category] = amount;
    saveBudgets();
    
    updateBudgetSection();
    hideModal('addBudgetModal');
    showNotification('Budget added successfully!', 'success');
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function saveBudgets() {
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

function updateDashboard() {
    // Calculate totals
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    // Update summary cards
    document.getElementById('totalIncome').textContent = formatCurrency(income);
    document.getElementById('totalExpenses').textContent = formatCurrency(expenses);
    document.getElementById('balance').textContent = formatCurrency(balance);
    
    // Update balance color
    const balanceElement = document.getElementById('balance');
    balanceElement.className = balance >= 0 ? 'amount income' : 'amount expense';
    
    // Update charts
    updateCharts();
}

function updateCharts() {
    updatePieChart();
    updateBarChart();
}

function initializeCharts() {
    // Initialize Pie Chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Initialize Bar Chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Income',
                    data: [],
                    backgroundColor: '#48BB78'
                },
                {
                    label: 'Expenses',
                    data: [],
                    backgroundColor: '#F56565'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function updatePieChart() {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};
    
    expenseTransactions.forEach(transaction => {
        categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
    });
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    pieChart.data.labels = labels;
    pieChart.data.datasets[0].data = data;
    pieChart.update();
}

function updateBarChart() {
    // Get last 6 months of data
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthYear);
        
        const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === date.getMonth() && 
                   transactionDate.getFullYear() === date.getFullYear();
        });
        
        const monthIncome = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthExpenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        incomeData.push(monthIncome);
        expenseData.push(monthExpenses);
    }
    
    barChart.data.labels = months;
    barChart.data.datasets[0].data = incomeData;
    barChart.data.datasets[1].data = expenseData;
    barChart.update();
}

function updateBudgetSection() {
    // Update overall budget progress
    const totalBudget = Object.values(budgets).reduce((sum, amount) => sum + amount, 0);
    const totalSpent = Object.keys(budgets).reduce((sum, category) => {
        const categorySpent = transactions
            .filter(t => t.type === 'expense' && t.category === category)
            .reduce((catSum, t) => catSum + t.amount, 0);
        return sum + categorySpent;
    }, 0);
    
    const remaining = totalBudget - totalSpent;
    const progressPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    document.getElementById('totalBudget').textContent = formatCurrency(totalBudget);
    document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('budgetRemaining').textContent = formatCurrency(remaining);
    document.getElementById('budgetProgressFill').style.width = Math.min(progressPercentage, 100) + '%';
    
    // Update individual budget categories
    const categoriesContainer = document.getElementById('budgetCategories');
    categoriesContainer.innerHTML = '';
    
    if (Object.keys(budgets).length === 0) {
        categoriesContainer.innerHTML = '<div class="empty-state">No budgets set. Add your first budget to get started!</div>';
        return;
    }
    
    Object.keys(budgets).forEach(category => {
        const budgetAmount = budgets[category];
        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === category)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const categoryRemaining = budgetAmount - spent;
        const categoryProgress = (spent / budgetAmount) * 100;
        
        const budgetItem = document.createElement('div');
        budgetItem.className = 'budget-item';
        budgetItem.innerHTML = `
            <h4>${category}</h4>
            <div class="budget-item-progress">
                <div class="progress-item">
                    <span>Budget</span>
                    <span>${formatCurrency(budgetAmount)}</span>
                </div>
                <div class="progress-item">
                    <span>Spent</span>
                    <span>${formatCurrency(spent)}</span>
                </div>
                <div class="progress-item">
                    <span>Remaining</span>
                    <span class="${categoryRemaining >= 0 ? 'transaction-income' : 'transaction-expense'}">
                        ${formatCurrency(categoryRemaining)}
                    </span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(categoryProgress, 100)}%; 
                         background: ${categoryProgress > 100 ? '#e53e3e' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}">
                    </div>
                </div>
            </div>
            <div class="budget-item-actions">
                <button class="btn btn-small btn-danger" onclick="deleteBudget('${category}')">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        `;
        
        categoriesContainer.appendChild(budgetItem);
    });
}

function deleteBudget(category) {
    if (confirm(`Are you sure you want to delete the budget for ${category}?`)) {
        delete budgets[category];
        saveBudgets();
        updateBudgetSection();
        showNotification('Budget deleted successfully!', 'success');
    }
}

function updateHistorySection() {
    const tbody = document.getElementById('transactionsBody');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="6">No transactions found. Add your first transaction to get started!</td></tr>';
        return;
    }
    
    displayTransactions(transactions);
}

function displayTransactions(transactionsToShow) {
    const tbody = document.getElementById('transactionsBody');
    
    if (transactionsToShow.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="5">No transactions match your search criteria.</td></tr>';
        return;
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = transactionsToShow.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sortedTransactions.map(transaction => `
        <tr>
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td>
                <span class="transaction-${transaction.type}">
                    ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </span>
            </td>
            <td class="transaction-${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </td>
        </tr>
    `).join('');
}



function filterTransactions() {
    const searchTerm = document.getElementById('searchTransactions').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const typeFilter = document.getElementById('filterType').value;
    
    let filteredTransactions = transactions;
    
    // Apply search filter
    if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(t => 
            t.description.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    if (categoryFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    
    // Apply type filter
    if (typeFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    
    displayTransactions(filteredTransactions);
}

function handleCSVImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showNotification('Please select a valid CSV file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const csv = event.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            // Validate headers
            const requiredHeaders = ['date', 'description', 'category', 'type', 'amount'];
            const hasAllHeaders = requiredHeaders.every(header => 
                headers.some(h => h.includes(header))
            );
            
            if (!hasAllHeaders) {
                showNotification('CSV must contain columns: Date, Description, Category, Type, Amount', 'error');
                return;
            }
            
            const importedTransactions = [];
            let validCount = 0;
            let errorCount = 0;
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                
                try {
                    const transaction = {
                        id: Date.now() + i,
                        date: values[headers.indexOf('date')] || values[headers.findIndex(h => h.includes('date'))],
                        description: values[headers.indexOf('description')] || values[headers.findIndex(h => h.includes('description'))],
                        category: values[headers.indexOf('category')] || values[headers.findIndex(h => h.includes('category'))],
                        type: values[headers.indexOf('type')] || values[headers.findIndex(h => h.includes('type'))],
                        amount: parseFloat(values[headers.indexOf('amount')] || values[headers.findIndex(h => h.includes('amount'))])
                    };
                    
                    // Validate transaction
                    if (transaction.date && transaction.description && transaction.category && 
                        transaction.type && !isNaN(transaction.amount) && transaction.amount > 0 &&
                        ['income', 'expense'].includes(transaction.type.toLowerCase())) {
                        
                        transaction.type = transaction.type.toLowerCase();
                        importedTransactions.push(transaction);
                        validCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                }
            }
            
            if (validCount > 0) {
                transactions.push(...importedTransactions);
                saveTransactions();
                updateDashboard();
                updateBudgetSection();
                updateHistorySection();
                showNotification(`Imported ${validCount} transactions successfully! ${errorCount > 0 ? `${errorCount} rows had errors and were skipped.` : ''}`, 'success');
            } else {
                showNotification('No valid transactions found in the CSV file', 'error');
            }
            
        } catch (error) {
            showNotification('Error reading CSV file. Please check the format.', 'error');
        }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
}

function exportToCSV() {
    if (transactions.length === 0) {
        showNotification('No transactions to export', 'error');
        return;
    }
    
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const csvContent = [
        headers.join(','),
        ...transactions.map(t => [
            t.date,
            `"${t.description}"`,
            t.category,
            t.type,
            t.amount
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Transactions exported successfully!', 'success');
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notificationMessage');
    
    messageElement.textContent = message;
    notification.className = `notification ${type} show`;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('show');
}

function formatCurrency(amount) {
    return '$' + Math.abs(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Make functions globally available for onclick handlers
window.deleteBudget = deleteBudget;
