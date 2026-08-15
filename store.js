/**
 * STORE.JS - Data Storage, LocalStorage Persistence & Analytics Engine
 */

const STORAGE_KEY_EXPENSES = 'campusexpense_items_v1';
const STORAGE_KEY_SETTINGS = 'campusexpense_settings_v1';

// Helper to format Date string as YYYY-MM-DD
function getOffsetDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// Initial realistic student sample data
function getSampleExpenses() {
  return [
    {
      id: 'exp_1',
      name: 'College Semester Textbooks',
      amount: 1450,
      date: getOffsetDate(1),
      category: 'College',
      notes: 'Algorithm Design & Physics Vol II for 3rd Sem'
    },
    {
      id: 'exp_2',
      name: 'Hostel Canteen Lunch & Juices',
      amount: 180,
      date: getOffsetDate(0),
      category: 'Food',
      notes: 'South Indian Thali + Mango Shake'
    },
    {
      id: 'exp_3',
      name: 'Monthly Metro SmartCard Recharge',
      amount: 800,
      date: getOffsetDate(3),
      category: 'Travel',
      notes: 'Monthly pass from Green line to Campus'
    },
    {
      id: 'exp_4',
      name: 'Weekend Cinema Tickets with Friends',
      amount: 550,
      date: getOffsetDate(5),
      category: 'Entertainment',
      notes: 'IMAX 3D ticket and popcorn combo'
    },
    {
      id: 'exp_5',
      name: 'Campus Stationery & Spiral Notebooks',
      amount: 240,
      date: getOffsetDate(7),
      category: 'College',
      notes: 'A4 sheets, graph notebook and gel pens'
    },
    {
      id: 'exp_6',
      name: 'Sneakers & Gym Tee Discount Sale',
      amount: 1299,
      date: getOffsetDate(10),
      category: 'Shopping',
      notes: 'College sports club practice gear'
    },
    {
      id: 'exp_7',
      name: 'Late Night Coffee & Sandwiches',
      amount: 160,
      date: getOffsetDate(12),
      category: 'Food',
      notes: 'Exam group study session'
    },
    {
      id: 'exp_8',
      name: 'Hostel High-Speed Wi-Fi Contribution',
      amount: 350,
      date: getOffsetDate(15),
      category: 'Other',
      notes: 'Room sharing split for 100mbps plan'
    },
    {
      id: 'exp_9',
      name: 'Coding Bootcamp Cloud Lab Subscription',
      amount: 699,
      date: getOffsetDate(20),
      category: 'College',
      notes: 'Student discount pack for cloud servers'
    },
    {
      id: 'exp_10',
      name: 'Bus Ticket Home Visit',
      amount: 420,
      date: getOffsetDate(26),
      category: 'Travel',
      notes: 'Weekend visit express bus pass'
    }
  ];
}

const DEFAULT_SETTINGS = {
  monthlyBudget: 10000,
  currency: '₹'
};

class ExpenseStore {
  constructor() {
    this.expenses = [];
    this.settings = DEFAULT_SETTINGS;
    this.init();
  }

  init() {
    // Load or initialize expenses
    const storedExpenses = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (storedExpenses) {
      try {
        this.expenses = JSON.parse(storedExpenses);
      } catch (e) {
        console.error('Failed to parse stored expenses, resetting to sample:', e);
        this.resetToSample();
      }
    } else {
      this.resetToSample();
    }

    // Load or initialize settings
    const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (storedSettings) {
      try {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      } catch (e) {
        this.settings = DEFAULT_SETTINGS;
      }
    } else {
      this.saveSettings(DEFAULT_SETTINGS);
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(this.expenses));
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
  }

  getSettings() {
    return this.settings;
  }

  getAllExpenses() {
    return [...this.expenses];
  }

  getExpenseById(id) {
    return this.expenses.find(e => e.id === id) || null;
  }

  addExpense(expenseData) {
    const newExpense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: expenseData.name.trim(),
      amount: parseFloat(expenseData.amount),
      date: expenseData.date,
      category: expenseData.category,
      notes: (expenseData.notes || '').trim(),
      createdAt: new Date().toISOString()
    };
    this.expenses.unshift(newExpense);
    this.save();
    return newExpense;
  }

  updateExpense(id, updatedData) {
    const index = this.expenses.findIndex(e => e.id === id);
    if (index === -1) return false;

    this.expenses[index] = {
      ...this.expenses[index],
      name: updatedData.name.trim(),
      amount: parseFloat(updatedData.amount),
      date: updatedData.date,
      category: updatedData.category,
      notes: (updatedData.notes || '').trim(),
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.expenses[index];
  }

  deleteExpense(id) {
    const initialLen = this.expenses.length;
    this.expenses = this.expenses.filter(e => e.id !== id);
    this.save();
    return this.expenses.length < initialLen;
  }

  resetToSample() {
    this.expenses = getSampleExpenses();
    this.save();
    return this.expenses;
  }

  clearAll() {
    this.expenses = [];
    this.save();
  }

  /**
   * Analytics & Statistics Calculator
   */
  getStats() {
    const totalCount = this.expenses.length;
    let totalSpending = 0;
    let thisMonthSpending = 0;
    let highestExpense = null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthPrefix = `${currentYear}-${currentMonth}`;

    // Category aggregation
    const categoryTotals = {
      Food: 0,
      Travel: 0,
      Shopping: 0,
      College: 0,
      Entertainment: 0,
      Other: 0
    };

    // Timeline aggregation (by date)
    const dateTotals = {};

    this.expenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      totalSpending += amt;

      // Current month check
      if (exp.date && exp.date.startsWith(currentMonthPrefix)) {
        thisMonthSpending += amt;
      }

      // Highest expense check
      if (!highestExpense || amt > highestExpense.amount) {
        highestExpense = exp;
      }

      // Category breakdown
      if (categoryTotals.hasOwnProperty(exp.category)) {
        categoryTotals[exp.category] += amt;
      } else {
        categoryTotals['Other'] += amt;
      }

      // Date trend
      if (exp.date) {
        dateTotals[exp.date] = (dateTotals[exp.date] || 0) + amt;
      }
    });

    return {
      totalSpending,
      totalCount,
      thisMonthSpending,
      highestExpense,
      categoryTotals,
      dateTotals,
      monthlyBudget: this.settings.monthlyBudget,
      budgetPercent: this.settings.monthlyBudget > 0 
        ? Math.min(Math.round((thisMonthSpending / this.settings.monthlyBudget) * 100), 100) 
        : 0
    };
  }

  /**
   * Export to CSV Format
   */
  exportCSV() {
    const headers = ['ID', 'Expense Name', 'Amount (INR)', 'Date', 'Category', 'Notes'];
    const rows = this.expenses.map(e => [
      `"${e.id}"`,
      `"${(e.name || '').replace(/"/g, '""')}"`,
      e.amount,
      `"${e.date}"`,
      `"${e.category}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campus_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export to JSON Format
   */
  exportJSON() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.settings,
      expenses: this.expenses
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `campus_expenses_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const store = new ExpenseStore();
