// quick AUD formatter
const AUD = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const PCT = new Intl.NumberFormat('en-AU', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 });

// elements
const $ = (id) => document.getElementById(id);
const inputs = ['initial','monthly','years','return','inflation'].map($);
const calcBtn = $('calcBtn');
const resetBtn = $('resetBtn');
const summaryEl = $('summary');
const ctx = $('viz').getContext('2d');

let chart;

// load/save simple prefs
function loadState(){
  try {
    const s = JSON.parse(localStorage.getItem('valtera-compound-v1')) || {};
    inputs.forEach(i => { if (s[i.id] !== undefined) i.value = s[i.id]; });
  } catch {}
}
function saveState(){
  const s = {};
  inputs.forEach(i => s[i.id] = +i.value);
  localStorage.setItem('valtera-compound-v1', JSON.stringify(s));
}

// math loop (month-end contributions)
function simulate({initial, monthly, years, annualReturn, inflation}){
  const months = Math.round(years * 12);
  const r_m = (annualReturn/100) / 12;
  const i_y = inflation/100;

  const labels = [];
  const nominalSeries = [];
  const realSeries = [];

  let balance = initial;
  for (let m = 0; m <= months; m++){
    // label each year, otherwise sparse
    if (m % 12 === 0) labels.push(`Year ${m/12}`); else labels.push('');

    if (m > 0){
      balance = balance * (1 + r_m) + monthly; // month-end contribution
    }
    const tYears = m / 12;
    const real = balance / Math.pow(1 + i_y, tYears);

    nominalSeries.push(balance);
    realSeries.push(real);
  }

  const totalContrib = initial + monthly * months;
  return { labels, nominalSeries, realSeries, months, totalContrib, finalNominal: balance, finalReal: realSeries[realSeries.length-1] };
}

function renderChart(labels, nominal, real){
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Nominal Value', data: nominal, borderWidth: 2, tension: 0.2 },
        { label: 'Real (Inflation-Adjusted)', data: real, borderDash: [6,6], borderWidth: 2, tension: 0.2 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          ticks: { callback: v => AUD.format(v) }
        }
      },
      plugins: {
        legend: { labels: { color: '#e5e7eb' } }
      }
    }
  });
}

function renderSummary({ totalContrib, finalNominal, finalReal }){
  const realGainPct = (finalReal - totalContrib) / totalContrib;
  const nominalGainPct = (finalNominal - totalContrib) / totalContrib;

  const cards = [
    { title: 'Total Contributed', val: AUD.format(totalContrib) },
    { title: 'Final Nominal', val: AUD.format(finalNominal) },
    { title: 'Final Real', val: AUD.format(finalReal) },
    { title: 'Real Gain/Loss', val: (isFinite(realGainPct)? PCT.format(realGainPct) : '—') }
  ];

  summaryEl.innerHTML = cards.map(c => `
    <div class="rounded-2xl bg-zinc-900/60 p-4 border border-zinc-800">
      <div class="text-zinc-400 text-xs">${c.title}</div>
      <div class="text-lg mt-1">${c.val}</div>
    </div>
  `).join('');
}

function readInputs(){
  return {
    initial: +$('initial').value || 0,
    monthly: +$('monthly').value || 0,
    years: +$('years').value || 0,
    annualReturn: +$('return').value || 0,
    inflation: +$('inflation').value || 0
  };
}

function update(){
  const model = readInputs();
  saveState();
  const res = simulate(model);
  renderChart(res.labels, res.nominalSeries, res.realSeries);
  renderSummary(res);
}

// wire
calcBtn.addEventListener('click', update);
resetBtn.addEventListener('click', () => {
  $('initial').value = 5000;
  $('monthly').value = 500;
  $('years').value = 10;
  $('return').value = 7;
  $('inflation').value = 3;
  update();
});
inputs.forEach(i => i.addEventListener('change', update));

// --- simple tab switcher ---
const tabDashboard = document.getElementById('tab-dashboard');
const tabAbout = document.getElementById('tab-about');
const dashboardSection = document.getElementById('dashboardSection');
const aboutSection = document.getElementById('aboutSection');

function setActiveTab(tab){
  const dashActive = tab === 'dashboard';
  dashboardSection.classList.toggle('hidden', !dashActive);
  aboutSection.classList.toggle('hidden', dashActive);

  tabDashboard.setAttribute('aria-selected', dashActive ? 'true' : 'false');
  tabAbout.setAttribute('aria-selected', !dashActive ? 'true' : 'false');

  // button styles
  tabDashboard.className = dashActive
    ? 'px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-medium'
    : 'px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700';
  tabAbout.className = !dashActive
    ? 'px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-medium'
    : 'px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700';
}

tabDashboard?.addEventListener('click', () => setActiveTab('dashboard'));
tabAbout?.addEventListener('click', () => setActiveTab('about'));

// boot
loadState();
update();
