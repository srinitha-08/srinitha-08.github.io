/**
 * APP.JS - Application Controller, Router & Event Orchestrator
 */

import { store } from './store.js';
import { ui } from './ui.js';
import { chartManager } from './charts.js';

class App {
  constructor() {
    this.currentView = 'dashboard';
    this.editingExpenseId = null;
    
    // Filter & Sort State
    this.filterSearch = '';
    this.filterCategory = 'ALL';
    this.filterSort = 'date-desc';

    this.init();
  }

  init() {
    this.bindNavigation();
    this.bindFormEvents();
    this.bindFilterEvents();
    this.bindSettingsEvents();
    this.bindSuggestionChips();
    this.bindKeyboardShortcuts();

    // Default form date to today
    this.resetFormDateToToday();

    // Load initial budget into settings input
    const settings = store.getSettings();
    const budgetInput = document.getElementById('monthly-budget-input');
    if (budgetInput) budgetInput.value = settings.monthlyBudget;

    // Initial render
    this.refreshAll();
  }

  /**
   * Re-computes statistics, refreshes UI tables, and updates charts
   */
  refreshAll() {
    const stats = store.getStats();
    const allExpenses = store.getAllExpenses();

    // 1. Update KPI metrics and budget bar
    ui.renderDashboardMetrics(stats);

    // 2. Update Charts
    chartManager.updateCharts(stats);

    // 3. Update Dashboard Recent Transactions
    ui.renderRecentExpenses(
      allExpenses,
      (id) => this.handleEditExpense(id),
      (id) => this.handleDeletePrompt(id)
    );

    // 4. Update Filtered Expenses Table
    this.applyFiltersAndRender();
  }

  /**
   * Apply Search, Category, and Sort filters
   */
  applyFiltersAndRender() {
    let list = store.getAllExpenses();

    // 1. Search Query filter
    if (this.filterSearch.trim()) {
      const q = this.filterSearch.toLowerCase().trim();
      list = list.filter(exp => 
        (exp.name && exp.name.toLowerCase().includes(q)) ||
        (exp.category && exp.category.toLowerCase().includes(q)) ||
        (exp.notes && exp.notes.toLowerCase().includes(q))
      );
    }

    // 2. Category filter
    if (this.filterCategory !== 'ALL') {
      list = list.filter(exp => exp.category === this.filterCategory);
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (this.filterSort === 'date-desc') {
        return new Date(b.date) - new Date(a.date);
      } else if (this.filterSort === 'date-asc') {
        return new Date(a.date) - new Date(b.date);
      } else if (this.filterSort === 'amount-desc') {
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      } else if (this.filterSort === 'amount-asc') {
        return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      }
      return 0;
    });

    ui.renderAllExpenses(
      list,
      (id) => this.handleEditExpense(id),
      (id) => this.handleDeletePrompt(id)
    );
  }

  /**
   * Router & Navigation Switching
   */
  navigateTo(viewId) {
    this.currentView = viewId;

    // Update main container view visibility
    document.querySelectorAll('.view-container').forEach(view => {
      view.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.add('active');

    // Update active nav buttons (Sidebar)
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
    });

    // Update active mobile bottom buttons
    document.querySelectorAll('.mobile-bottom-nav .mobile-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
    });

    // Update top header titles
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    if (viewId === 'dashboard') {
      if (pageTitle) pageTitle.textContent = 'Dashboard';
      if (pageSubtitle) pageSubtitle.textContent = 'Welcome back! Here is your college spending overview.';
    } else if (viewId === 'expenses') {
      if (pageTitle) pageTitle.textContent = 'All Expenses';
      if (pageSubtitle) pageSubtitle.textContent = 'Search, filter, edit and manage your expense logs.';
    } else if (viewId === 'add-expense') {
      if (pageTitle) pageTitle.textContent = this.editingExpenseId ? 'Edit Expense' : 'Add Expense';
      if (pageSubtitle) pageSubtitle.textContent = this.editingExpenseId ? 'Update this expense details.' : 'Log a new expense to keep your budget on track.';
    } else if (viewId === 'settings') {
      if (pageTitle) pageTitle.textContent = 'Budget & Settings';
      if (pageSubtitle) pageSubtitle.textContent = 'Configure monthly allowance limits and export data.';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh charts if entering dashboard
    if (viewId === 'dashboard') {
      setTimeout(() => {
        chartManager.updateCharts(store.getStats());
      }, 50);
    }
  }

  bindNavigation() {
    // Sidebar nav items
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const viewId = btn.getAttribute('data-view');
        if (viewId === 'add-expense' && this.editingExpenseId) {
          this.resetFormToAddMode();
        }
        this.navigateTo(viewId);
      });
    });

    // Mobile bottom nav buttons
    document.querySelectorAll('.mobile-bottom-nav .mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const viewId = btn.getAttribute('data-view');
        if (viewId === 'add-expense' && this.editingExpenseId) {
          this.resetFormToAddMode();
        }
        this.navigateTo(viewId);
      });
    });

    // Quick Add buttons in headers
    const topQuickAdd = document.getElementById('top-quick-add-btn');
    if (topQuickAdd) {
      topQuickAdd.addEventListener('click', () => {
        this.resetFormToAddMode();
        this.navigateTo('add-expense');
      });
    }

    const mobileQuickAdd = document.getElementById('mobile-quick-add-btn');
    if (mobileQuickAdd) {
      mobileQuickAdd.addEventListener('click', () => {
        this.resetFormToAddMode();
        this.navigateTo('add-expense');
      });
    }

    const listAddBtn = document.getElementById('list-add-expense-btn');
    if (listAddBtn) {
      listAddBtn.addEventListener('click', () => {
        this.resetFormToAddMode();
        this.navigateTo('add-expense');
      });
    }

    const emptyAddBtn = document.getElementById('empty-add-btn');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => {
        this.resetFormToAddMode();
        this.navigateTo('add-expense');
      });
    }

    const dashViewAll = document.getElementById('dash-view-all-btn');
    if (dashViewAll) {
      dashViewAll.addEventListener('click', () => {
        this.navigateTo('expenses');
      });
    }
  }

  /**
   * Form Handling: Add & Edit Expenses
   */
  bindFormEvents() {
    const form = document.getElementById('expense-form');
    const btnCancel = document.getElementById('btn-cancel-expense');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        this.resetFormToAddMode();
        this.navigateTo('expenses');
      });
    }
  }

  handleFormSubmit() {
    const nameInput = document.getElementById('expense-name');
    const amountInput = document.getElementById('expense-amount');
    const dateInput = document.getElementById('expense-date');
    const categorySelect = document.getElementById('expense-category');
    const notesInput = document.getElementById('expense-notes');

    // Clear prior errors
    this.clearFormErrors();

    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const category = categorySelect.value;
    const notes = notesInput.value.trim();

    let isValid = true;

    if (!name || name.length < 2) {
      this.showFieldError('error-expense-name', nameInput, 'Please enter a valid expense name (min 2 chars).');
      isValid = false;
    }

    if (isNaN(amount) || amount <= 0) {
      this.showFieldError('error-expense-amount', amountInput, 'Please enter an amount greater than ₹0.');
      isValid = false;
    }

    if (!date) {
      this.showFieldError('error-expense-date', dateInput, 'Please select a valid date.');
      isValid = false;
    }

    if (!category) {
      this.showFieldError('error-expense-category', categorySelect, 'Please select a category.');
      isValid = false;
    }

    if (!isValid) return;

    const payload = { name, amount, date, category, notes };

    if (this.editingExpenseId) {
      // Update existing
      const updated = store.updateExpense(this.editingExpenseId, payload);
      if (updated) {
        ui.showToast(`Updated "${name}" successfully!`, 'success');
      } else {
        ui.showToast('Failed to update expense', 'error');
      }
    } else {
      // Add new
      store.addExpense(payload);
      ui.showToast(`Added ₹${amount.toLocaleString('en-IN')} for "${name}"!`, 'success');
    }

    this.resetFormToAddMode();
    this.refreshAll();
    this.navigateTo('expenses');
  }

  handleEditExpense(id) {
    const exp = store.getExpenseById(id);
    if (!exp) return;

    this.editingExpenseId = id;

    // Populate Form
    const nameInput = document.getElementById('expense-name');
    const amountInput = document.getElementById('expense-amount');
    const dateInput = document.getElementById('expense-date');
    const categorySelect = document.getElementById('expense-category');
    const notesInput = document.getElementById('expense-notes');
    const formTitle = document.getElementById('form-view-title');
    const submitText = document.getElementById('btn-submit-text');

    if (nameInput) nameInput.value = exp.name;
    if (amountInput) amountInput.value = exp.amount;
    if (dateInput) dateInput.value = exp.date;
    if (categorySelect) categorySelect.value = exp.category;
    if (notesInput) notesInput.value = exp.notes || '';

    if (formTitle) formTitle.innerHTML = '<i class="fa-solid fa-pen-to-square text-indigo"></i> Edit Expense';
    if (submitText) submitText.textContent = 'Update Expense';

    this.navigateTo('add-expense');
  }

  handleDeletePrompt(id) {
    const exp = store.getExpenseById(id);
    if (!exp) return;

    ui.openDeleteModal(exp, () => {
      const deleted = store.deleteExpense(id);
      if (deleted) {
        ui.showToast(`Deleted "${exp.name}"`, 'info');
        this.refreshAll();
      }
    });
  }

  resetFormToAddMode() {
    this.editingExpenseId = null;
    const form = document.getElementById('expense-form');
    if (form) form.reset();
    this.resetFormDateToToday();

    const formTitle = document.getElementById('form-view-title');
    const submitText = document.getElementById('btn-submit-text');
    if (formTitle) formTitle.innerHTML = '<i class="fa-solid fa-circle-plus text-indigo"></i> Add New Expense';
    if (submitText) submitText.textContent = 'Add Expense';

    this.clearFormErrors();
  }

  resetFormDateToToday() {
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }

  showFieldError(errorElemId, inputElem, message) {
    const err = document.getElementById(errorElemId);
    if (err) err.textContent = message;
    if (inputElem) inputElem.classList.add('is-invalid');
  }

  clearFormErrors() {
    document.querySelectorAll('.form-error-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));
  }

  /**
   * Search, Category & Sort Filters
   */
  bindFilterEvents() {
    const searchInput = document.getElementById('expense-search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const catFilter = document.getElementById('expense-category-filter');
    const sortSelect = document.getElementById('expense-sort-select');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterSearch = e.target.value;
        if (clearSearchBtn) {
          clearSearchBtn.classList.toggle('visible', Boolean(this.filterSearch.length));
        }
        this.applyFiltersAndRender();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          this.filterSearch = '';
          clearSearchBtn.classList.remove('visible');
          this.applyFiltersAndRender();
          searchInput.focus();
        }
      });
    }

    if (catFilter) {
      catFilter.addEventListener('change', (e) => {
        this.filterCategory = e.target.value;
        this.applyFiltersAndRender();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.filterSort = e.target.value;
        this.applyFiltersAndRender();
      });
    }
  }

  /**
   * Quick Suggestion Chips on Add Expense Form
   */
  bindSuggestionChips() {
    document.querySelectorAll('.suggestion-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const name = chip.getAttribute('data-name');
        const cat = chip.getAttribute('data-cat');
        const amount = chip.getAttribute('data-amount');

        const nameInput = document.getElementById('expense-name');
        const amountInput = document.getElementById('expense-amount');
        const categorySelect = document.getElementById('expense-category');

        if (nameInput) nameInput.value = name;
        if (amountInput) amountInput.value = amount;
        if (categorySelect) categorySelect.value = cat;

        this.resetFormDateToToday();
        this.clearFormErrors();
        if (amountInput) amountInput.focus();
      });
    });
  }

  /**
   * Settings View Events: Budget, CSV Export, JSON Backup, Reset
   */
  bindSettingsEvents() {
    // Save Budget Form
    const budgetForm = document.getElementById('budget-settings-form');
    if (budgetForm) {
      budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const budgetInput = document.getElementById('monthly-budget-input');
        const val = parseFloat(budgetInput.value);
        if (isNaN(val) || val < 100) {
          ui.showToast('Please enter a valid monthly budget limit (min ₹100)', 'error');
          return;
        }
        store.saveSettings({ monthlyBudget: val });
        ui.showToast(`Monthly budget set to ₹${val.toLocaleString('en-IN')}`, 'success');
        this.refreshAll();
      });
    }

    // Export CSV
    const btnCsv = document.getElementById('btn-export-csv');
    if (btnCsv) {
      btnCsv.addEventListener('click', () => {
        store.exportCSV();
        ui.showToast('CSV export downloaded!', 'info');
      });
    }

    // Export JSON
    const btnJson = document.getElementById('btn-export-json');
    if (btnJson) {
      btnJson.addEventListener('click', () => {
        store.exportJSON();
        ui.showToast('JSON backup file created!', 'info');
      });
    }

    // Reset to Sample Expenses
    const btnReset = document.getElementById('btn-reset-sample');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Reset all expenses back to the default sample student data?')) {
          store.resetToSample();
          ui.showToast('Reset to sample student data', 'info');
          this.refreshAll();
        }
      });
    }

    // Clear All Expenses
    const btnClearAll = document.getElementById('btn-clear-all');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        if (confirm('Are you sure you want to permanently clear ALL expenses? This cannot be undone!')) {
          store.clearAll();
          ui.showToast('All expense records deleted', 'error');
          this.refreshAll();
        }
      });
    }
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Escape closes delete modal
      if (e.key === 'Escape') {
        ui.closeDeleteModal();
      }
    });
  }
}

// Initialize Application once DOM is fully ready
document.addEventListener('DOMContentLoaded', () => {
  window.campusSpendApp = new App();
});
