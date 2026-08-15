/**
 * CHARTS.JS - Dark-Themed Interactive Visualizations (Chart.js)
 */

const CATEGORY_COLORS = {
  Food: '#f59e0b',
  Travel: '#3b82f6',
  Shopping: '#ec4899',
  College: '#8b5cf6',
  Entertainment: '#10b981',
  Other: '#64748b'
};

class ChartManager {
  constructor() {
    this.donutChart = null;
    this.lineChart = null;
    this.initChartJsDefaults();
  }

  initChartJsDefaults() {
    if (typeof Chart === 'undefined') return;

    // Dark SaaS theme defaults for Chart.js
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = '#181c28';
    Chart.defaults.plugins.tooltip.titleColor = '#f8fafc';
    Chart.defaults.plugins.tooltip.bodyColor = '#cbd5e1';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.12)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.boxPadding = 4;
  }

  /**
   * Update or initialize both charts with latest metrics
   */
  updateCharts(stats) {
    if (typeof Chart === 'undefined') return;

    this.renderCategoryDonut(stats);
    this.renderTimelineChart(stats);
  }

  /**
   * 1. Category Breakdown Donut Chart
   */
  renderCategoryDonut(stats) {
    const canvas = document.getElementById('categoryChart');
    const legendContainer = document.getElementById('categoryLegendList');
    if (!canvas) return;

    const categories = ['Food', 'Travel', 'Shopping', 'College', 'Entertainment', 'Other'];
    const totals = categories.map(cat => stats.categoryTotals[cat] || 0);
    const colors = categories.map(cat => CATEGORY_COLORS[cat]);
    const totalSpent = stats.totalSpending || 1; // avoid / 0

    // Render custom HTML legend below chart
    if (legendContainer) {
      legendContainer.innerHTML = categories.map((cat, idx) => {
        const amt = totals[idx];
        if (amt === 0 && stats.totalSpending > 0) return ''; // Hide 0 amount categories if there are other expenses
        const pct = Math.round((amt / totalSpent) * 100);
        return `
          <div class="legend-item">
            <span class="legend-dot" style="background-color: ${colors[idx]}"></span>
            <span>${cat}:</span>
            <span class="legend-value">₹${amt.toLocaleString('en-IN')} (${pct}%)</span>
          </div>
        `;
      }).join('');
    }

    // Check if all zero
    const hasData = stats.totalSpending > 0;
    const chartData = hasData ? totals : [1];
    const chartColors = hasData ? colors : ['#222736'];

    if (this.donutChart) {
      this.donutChart.data.labels = hasData ? categories : ['No Data'];
      this.donutChart.data.datasets[0].data = chartData;
      this.donutChart.data.datasets[0].backgroundColor = chartColors;
      this.donutChart.update('active');
    } else {
      const ctx = canvas.getContext('2d');
      this.donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: hasData ? categories : ['No Data'],
          datasets: [{
            data: chartData,
            backgroundColor: chartColors,
            borderColor: '#141824',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  if (!hasData) return ' No expenses yet';
                  const val = context.raw || 0;
                  const pct = Math.round((val / totalSpent) * 100);
                  return ` ₹${val.toLocaleString('en-IN')} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  /**
   * 2. Spending Timeline Trend Chart
   */
  renderTimelineChart(stats) {
    const canvas = document.getElementById('timelineChart');
    if (!canvas) return;

    // Sort dates in ascending order
    const dates = Object.keys(stats.dateTotals).sort();

    // If no dates, generate last 7 days dummy empty
    let labels = [];
    let dataPoints = [];

    if (dates.length === 0) {
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        dataPoints.push(0);
      }
    } else {
      // Show up to the last 10 distinct expense dates
      const recentDates = dates.slice(-10);
      labels = recentDates.map(dateStr => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return dateStr;
      });
      dataPoints = recentDates.map(dateStr => stats.dateTotals[dateStr] || 0);
    }

    if (this.lineChart) {
      this.lineChart.data.labels = labels;
      this.lineChart.data.datasets[0].data = dataPoints;
      this.lineChart.update('active');
    } else {
      const ctx = canvas.getContext('2d');

      // Create gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, 240);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

      this.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Daily Spending (₹)',
            data: dataPoints,
            fill: true,
            backgroundColor: gradient,
            borderColor: '#8b5cf6',
            borderWidth: 2.5,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` ₹${(context.raw || 0).toLocaleString('en-IN')}`
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.04)',
                drawBorder: false
              },
              ticks: {
                color: '#64748b',
                font: { size: 11 }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false
              },
              ticks: {
                color: '#64748b',
                font: { size: 11 },
                callback: (val) => '₹' + val
              }
            }
          }
        }
      });
    }
  }
}

export const chartManager = new ChartManager();
