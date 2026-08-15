/**
 * UI.JS - DOM Renderers, Formatting Utilities, Modal and Toast Handlers
 */

const CATEGORY_META = {
  Food: { icon: 'fa-utensils', emoji: '🍔', badgeClass: 'cat-Food' },
  Travel: { icon: 'fa-bus-simple', emoji: '🚆', badgeClass: 'cat-Travel' },
  Shopping: { icon: 'fa-bag-shopping', emoji: '🛍️', badgeClass: 'cat-Shopping' },
  College: { icon: 'fa-graduation-cap', emoji: '🎓', badgeClass: 'cat-College' },
  Entertainment: { icon: 'fa-film', emoji: '🎬', badgeClass: 'cat-Entertainment' },
  Other: { icon: 'fa-box', emoji: '📦', badgeClass: 'cat-Other' }
};

export function formatINR(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  return dateString;
}

export class UIManager {
  constructor() {
    this.deleteCallback = null;
    this.initElements();
    this.bindGlobalEvents();
  }

  initElements() {
    // KPI Elements
    this.kpiTotalSpend = document.getElementById('kpi-total-spend');
    this.kpiExpenseCount = document.getElementById('kpi-expense-count');
    this.kpiMonthSpend = document.getElementById('kpi-month-spend');
    this.kpiHighestSpend = document.getElementById('kpi-highest-spend');
    this.kpiHighestName = document.getElementById('kpi-highest-name');
    this.sidebarExpenseCount = document.getElementById('sidebar-expense-count');

    // Sidebar & Settings Budget
    this.sidebarBudgetPct = document.getElementById('sidebar-budget-pct');
    this.sidebarBudgetBar = document.getElementById('sidebar-budget-bar');
    this.sidebarBudgetSpent = document.getElementById('sidebar-budget-spent');
    this.sidebarBudgetLimit = document.getElementById('sidebar-budget-limit');
    this.settingsCurrentSpent = document.getElementById('settings-current-spent');
    this.settingsRemainingBudget = document.getElementById('settings-remaining-budget');
    this.settingsBudgetBar = document.getElementById('settings-budget-bar');

    // Tables & Lists
    this.recentTbody = document.getElementById('recent-expenses-tbody');
    this.allExpensesTbody = document.getElementById('all-expenses-tbody');
    this.emptyState = document.getElementById('expenses-empty-state');
    this.filterCount = document.getElementById('filter-results-count');
    this.filterSum = document.getElementById('filter-results-sum');

    // Delete Modal
    this.deleteModal = document.getElementById('delete-modal');
    this.deleteItemName = document.getElementById('delete-item-name');
    this.deleteItemAmount = document.getElementById('delete-item-amount');
    this.btnConfirmDelete = document.getElementById('btn-confirm-delete');
    this.btnCancelDelete = document.getElementById('btn-cancel-delete');

    // Toast Container
    this.toastContainer = document.getElementById('toast-container');

    // Header Date
    const todayElem = document.getElementById('header-today-date');
    if (todayElem) {
      todayElem.textContent = new Date().toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }

    const monthLabel = document.getElementById('current-month-label');
    if (monthLabel) {
      monthLabel.textContent = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    }
  }

  bindGlobalEvents() {
    // Delete Modal Cancel
    if (this.btnCancelDelete) {
      this.btnCancelDelete.addEventListener('click', () => this.closeDeleteModal());
    }

    // Backdrop click to close
    if (this.deleteModal) {
      this.deleteModal.addEventListener('click', (e) => {
        if (e.target === this.deleteModal) this.closeDeleteModal();
      });
    }

    // Confirm Delete
    if (this.btnConfirmDelete) {
      this.btnConfirmDelete.addEventListener('click', () => {
        if (typeof this.deleteCallback === 'function') {
          this.deleteCallback();
        }
        this.closeDeleteModal();
      });
    }
  }

  /**
   * Render Dashboard KPIs & Budget Widget
   */
  renderDashboardMetrics(stats) {
    if (this.kpiTotalSpend) this.kpiTotalSpend.textContent = formatINR(stats.totalSpending);
    if (this.kpiExpenseCount) this.kpiExpenseCount.textContent = stats.totalCount;
    if (this.kpiMonthSpend) this.kpiMonthSpend.textContent = formatINR(stats.thisMonthSpending);
    if (this.sidebarExpenseCount) this.sidebarExpenseCount.textContent = stats.totalCount;

    if (this.kpiHighestSpend) {
      if (stats.highestExpense) {
        this.kpiHighestSpend.textContent = formatINR(stats.highestExpense.amount);
        this.kpiHighestName.textContent = stats.highestExpense.name;
        this.kpiHighestName.title = `${stats.highestExpense.name} (${stats.highestExpense.category})`;
      } else {
        this.kpiHighestSpend.textContent = '₹0';
        this.kpiHighestName.textContent = 'None logged';
      }
    }

    // Budget Widget Updates
    const budgetLimit = stats.monthlyBudget;
    const spent = stats.thisMonthSpending;
    const pct = stats.budgetPercent;
    const remaining = Math.max(budgetLimit - spent, 0);

    if (this.sidebarBudgetPct) this.sidebarBudgetPct.textContent = `${pct}%`;
    if (this.sidebarBudgetSpent) this.sidebarBudgetSpent.textContent = formatINR(spent);
    if (this.sidebarBudgetLimit) this.sidebarBudgetLimit.textContent = `of ${formatINR(budgetLimit)}`;

    if (this.sidebarBudgetBar) {
      this.sidebarBudgetBar.style.width = `${pct}%`;
      this.sidebarBudgetBar.className = 'progress-bar-fill';
      if (pct >= 100) {
        this.sidebarBudgetBar.classList.add('danger');
      } else if (pct >= 80) {
        this.sidebarBudgetBar.classList.add('warning');
      }
    }

    // Settings budget box
    if (this.settingsCurrentSpent) this.settingsCurrentSpent.textContent = formatINR(spent);
    if (this.settingsRemainingBudget) {
      this.settingsRemainingBudget.textContent = formatINR(remaining);
      if (spent > budgetLimit) {
        this.settingsRemainingBudget.className = 'text-danger';
        this.settingsRemainingBudget.textContent = `Over by ${formatINR(spent - budgetLimit)}`;
      } else {
        this.settingsRemainingBudget.className = 'text-emerald';
      }
    }
    if (this.settingsBudgetBar) {
      this.settingsBudgetBar.style.width = `${pct}%`;
      this.settingsBudgetBar.className = 'progress-bar-fill';
      if (pct >= 100) this.settingsBudgetBar.classList.add('danger');
      else if (pct >= 80) this.settingsBudgetBar.classList.add('warning');
    }
  }

  /**
   * Render Recent Transactions (Top 5) on Dashboard
   */
  renderRecentExpenses(expenses, onEdit, onDelete) {
    if (!this.recentTbody) return;

    if (!expenses || expenses.length === 0) {
      this.recentTbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
            <i class="fa-solid fa-receipt" style="font-size: 1.5rem; margin-bottom: 0.5rem; display:block;"></i>
            No expenses logged yet. Add your first expense to get started!
          </td>
        </tr>
      `;
      return;
    }

    const recentItems = expenses.slice(0, 5);
    this.recentTbody.innerHTML = recentItems.map(exp => this.createExpenseRowHTML(exp)).join('');
    this.bindRowActions(this.recentTbody, onEdit, onDelete);
  }

  /**
   * Render All Expenses Table with filters/search
   */
  renderAllExpenses(expenses, onEdit, onDelete) {
    if (!this.allExpensesTbody) return;

    if (!expenses || expenses.length === 0) {
      this.allExpensesTbody.innerHTML = '';
      if (this.emptyState) this.emptyState.classList.remove('hidden');
      if (this.filterCount) this.filterCount.textContent = 'Showing 0 expenses';
      if (this.filterSum) this.filterSum.textContent = 'Total: ₹0';
      return;
    }

    if (this.emptyState) this.emptyState.classList.add('hidden');
    this.allExpensesTbody.innerHTML = expenses.map(exp => this.createExpenseRowHTML(exp)).join('');

    const sum = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    if (this.filterCount) this.filterCount.textContent = `Showing ${expenses.length} expense${expenses.length === 1 ? '' : 's'}`;
    if (this.filterSum) this.filterSum.textContent = `Total: ${formatINR(sum)}`;

    this.bindRowActions(this.allExpensesTbody, onEdit, onDelete);
  }

  createExpenseRowHTML(exp) {
    const meta = CATEGORY_META[exp.category] || CATEGORY_META['Other'];
    return `
      <tr data-id="${exp.id}">
        <td style="white-space: nowrap;">
          <span style="font-size: 0.84rem; color: var(--text-secondary);">${formatDate(exp.date)}</span>
        </td>
        <td>
          <div class="expense-title-cell">
            <span class="expense-title-text">${this.escapeHTML(exp.name)}</span>
            ${exp.notes ? `<span class="expense-note-text">${this.escapeHTML(exp.notes)}</span>` : ''}
          </div>
        </td>
        <td>
          <span class="category-badge ${meta.badgeClass}">
            <span>${meta.emoji}</span> ${exp.category}
          </span>
        </td>
        <td class="expense-amount-cell">
          ${formatINR(exp.amount)}
        </td>
        <td class="text-right">
          <div class="action-btn-group">
            <button type="button" class="btn-icon edit-btn" title="Edit Expense" data-id="${exp.id}">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn-icon delete-btn" title="Delete Expense" data-id="${exp.id}">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  bindRowActions(container, onEdit, onDelete) {
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (onEdit) onEdit(id);
      });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (onDelete) onDelete(id);
      });
    });
  }

  /**
   * Delete Confirmation Modal Dialog
   */
  openDeleteModal(expense, onConfirm) {
    if (!this.deleteModal) return;
    this.deleteItemName.textContent = `"${expense.name}"`;
    this.deleteItemAmount.textContent = formatINR(expense.amount);
    this.deleteCallback = onConfirm;
    this.deleteModal.classList.add('active');
    this.deleteModal.setAttribute('aria-hidden', 'false');
  }

  closeDeleteModal() {
    if (!this.deleteModal) return;
    this.deleteModal.classList.remove('active');
    this.deleteModal.setAttribute('aria-hidden', 'true');
    this.deleteCallback = null;
  }

  /**
   * Toast Notifications
   */
  showToast(message, type = 'success', duration = 3000) {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconHtml = '<i class="fa-solid fa-circle-check"></i>';
    if (type === 'error') iconHtml = '<i class="fa-solid fa-circle-exclamation"></i>';
    if (type === 'info') iconHtml = '<i class="fa-solid fa-circle-info"></i>';

    toast.innerHTML = `
      ${iconHtml}
      <span>${this.escapeHTML(message)}</span>
    `;

    this.toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
}

export const ui = new UIManager();
