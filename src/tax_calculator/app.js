// Storage key
const STORE_KEY = 'valtera-tax-v1';

// Helpers
const $ = (id) => document.getElementById(id);
const fmtAud = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

// FY24-25 resident brackets (Stage 3). Each item: [threshold, rate]
const BRACKETS_24_25 = [
  [0,       0.00],
  [18200,   0.16],
  [45000,   0.30],
  [135000,  0.37],
  [190000,  0.45]
];

// Piecewise progressive tax (excludes Medicare)
function incomeTax(amount, brackets) {
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const [start, rate] = brackets[i];
    const end = (i < brackets.length - 1) ? brackets[i + 1][0] : Infinity;
    if (amount > start) {
      const taxableSlice = Math.min(amount, end) - start;
      tax += taxableSlice * rate;
    } else break;
  }
  return Math.max(0, Math.round(tax));
}

function readInputs() {
  return {
    fy: $('fy').value,
    salary: +$('salary').value || 0,
    superPct: (+$('superPct').value || 0) / 100,
    includeMedicare: $('includeMedicare').checked
  };
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    fy: $('fy').value,
    salary: $('salary').value,
    superPct: $('superPct').value,
    includeMedicare: $('includeMedicare').checked
  }));
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    if (s.fy) $('fy').value = s.fy;
    if (s.salary !== undefined) $('salary').value = s.salary;
    if (s.superPct !== undefined) $('superPct').value = s.superPct;
    if (typeof s.includeMedicare === 'boolean') $('includeMedicare').checked = s.includeMedicare;
  } catch {}
}

function simulate(model) {
  const brackets = BRACKETS_24_25; // (future) choose by model.fy
  const gross = model.salary;
  const tax = incomeTax(gross, brackets);
  const medicare = model.includeMedicare ? Math.round(gross * 0.02) : 0; // approx.
  const net = Math.max(0, gross - tax - medicare);
  const superEmp = Math.round(gross * model.superPct);

  return {
    gross, tax, medicare, net, superEmp,
    effectiveRate: gross > 0 ? (tax + medicare) / gross : 0
  };
}

// Chart
let chart;
function renderChart(m) {
  const ctx = $('viz').getContext('2d');
  const labels = ['Gross', 'Net', 'Tax', 'Medicare', 'Super'];
  const values = [m.gross, m.net, m.tax, m.medicare, m.superEmp];

  if (!chart) {
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'A$',
          data: values
        }]
      },
      options: {
        animation: { duration: 300 },
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => fmtAud.format(v)
            }
          },
          x: { grid: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => fmtAud.format(ctx.parsed.y) }
          }
        }
      }
    });
  } else {
    chart.data.datasets[0].data = values;
    chart.update();
  }
}

function renderSummary(m) {
  const items = [
    { title: 'Gross Salary', value: fmtAud.format(m.gross) },
    { title: 'Net (After Tax/Medicare)', value: fmtAud.format(m.net) },
    { title: 'Income Tax', value: fmtAud.format(m.tax) },
    { title: 'Medicare (approx.)', value: fmtAud.format(m.medicare) },
    { title: 'Employer Super', value: fmtAud.format(m.superEmp) },
    { title: 'Effective Tax+Medicare', value: (m.effectiveRate * 100).toFixed(1) + '%' }
  ];
  $('summary').innerHTML = items.map(c => `
    <div class="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-3">
      <div class="text-xs text-zinc-400">${c.title}</div>
      <div class="text-lg mt-1">${c.value}</div>
    </div>
  `).join('');
}

function update() {
  const model = readInputs();
  const out = simulate(model);
  renderChart(out);
  renderSummary(out);
  saveState();
}

// Tabs
function setActiveTab(dashActive) {
  $('tab-dashboard').setAttribute('aria-selected', String(dashActive));
  $('tab-about').setAttribute('aria-selected', String(!dashActive));
  $('dashboardSection').classList.toggle('hidden', !dashActive);
  $('aboutSection').classList.toggle('hidden', dashActive);
}

// Wire events + boot
$('btnUpdate').addEventListener('click', update);
$('btnReset').addEventListener('click', () => {
  $('salary').value = 90000;
  $('superPct').value = 11.5;
  $('includeMedicare').checked = true;
  update();
});
$('tab-dashboard').addEventListener('click', () => setActiveTab(true));
$('tab-about').addEventListener('click', () => setActiveTab(false));

// Init
loadState();
update();
