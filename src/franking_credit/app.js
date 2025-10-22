import { Chart } from 'chart.js/auto';

const $ = (id) => document.getElementById(id);
const fmtAud = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const fmtPct = new Intl.NumberFormat('en-AU', { style: 'percent', maximumFractionDigits: 1 });
const STEP_LABELS = ['Dividend', 'Credit', 'Grossed-Up', 'Personal Tax', 'After-Tax'];
const INPUT_IDS = ['dividend', 'frankingPct', 'taxRate', 'personalRate'];

function computeFranking({ dividend, frankingPct, companyRate, personalRate }) {
  const credit = dividend * (frankingPct / 100) * (companyRate / (1 - companyRate));
  const grossedUp = dividend + credit;
  const personalTax = personalRate ? grossedUp * personalRate : 0;
  const afterTax = dividend + credit - personalTax;
  return { credit, grossedUp, personalTax, afterTax };
}

const state = { waterfall: null };

function readInputs() {
  const rawDividend = parseFloat($('dividend').value);
  const rawFranking = parseFloat($('frankingPct').value);
  const rawCompany = parseFloat($('taxRate').value);
  const personalValue = $('personalRate').value.trim();
  const rawPersonal = personalValue === '' ? null : parseFloat(personalValue);

  return {
    dividend: Number.isFinite(rawDividend) ? rawDividend : NaN,
    frankingPct: Number.isFinite(rawFranking) ? rawFranking : NaN,
    companyPercent: Number.isFinite(rawCompany) ? rawCompany : NaN,
    personalRatePercent: rawPersonal,
    hasPersonalRate: personalValue !== ''
  };
}

function inputsAreValid({ dividend, frankingPct, companyPercent, personalRatePercent, hasPersonalRate }) {
  if (!Number.isFinite(dividend) || dividend <= 0) return false;
  if (!Number.isFinite(frankingPct) || frankingPct < 0 || frankingPct > 100) return false;
  if (!Number.isFinite(companyPercent) || companyPercent <= 0 || companyPercent >= 100) return false;
  if (hasPersonalRate) {
    if (!Number.isFinite(personalRatePercent) || personalRatePercent < 0 || personalRatePercent >= 100) {
      return false;
    }
  }
  return true;
}

function renderError(message) {
  $('out').classList.remove('hidden');
  $('creditLine').className = 'text-lg font-medium text-red-400';
  $('creditLine').textContent = message;
  $('grossLine').textContent = '';
  $('afterTaxLine').textContent = '';
}

function renderSummary(inputs, outputs, personalRate) {
  $('out').classList.remove('hidden');
  $('creditLine').className = 'text-lg font-medium text-emerald-400';
  $('creditLine').textContent = `Franking credit: ${fmtAud.format(outputs.credit)}`;

  $('grossLine').className = 'text-sm text-neutral-300';
  $('grossLine').textContent = `Grossed-up dividend: ${fmtAud.format(outputs.grossedUp)} (${fmtPct.format(inputs.frankingPct / 100)} franked @ ${fmtPct.format(inputs.companyRate)})`;

  if (personalRate.hasPersonal) {
    $('afterTaxLine').className = 'text-sm text-neutral-400';
    $('afterTaxLine').textContent = `Estimated after-tax income (${fmtPct.format(personalRate.value)} marginal): ${fmtAud.format(outputs.afterTax)} (tax ${fmtAud.format(outputs.personalTax)})`;
  } else {
    $('afterTaxLine').className = 'text-sm text-neutral-500';
    $('afterTaxLine').textContent = 'Add your marginal tax rate to estimate the after-tax outcome.';
  }
}

function prepareWaterfallData(inputs, outputs, includePersonal) {
  const grossAdjustment = outputs.grossedUp - (inputs.dividend + outputs.credit);
  const neutralisedGross = Math.abs(grossAdjustment) < 0.005 ? 0 : grossAdjustment;

  const steps = [
    { label: STEP_LABELS[0], delta: inputs.dividend },
    { label: STEP_LABELS[1], delta: outputs.credit },
    { label: STEP_LABELS[2], delta: neutralisedGross },
    { label: STEP_LABELS[3], delta: includePersonal ? -outputs.personalTax : 0 },
    { label: STEP_LABELS[4], delta: includePersonal ? outputs.afterTax : 0, isTotal: true }
  ];

  const base = [];
  const positive = [];
  const negative = [];
  const totals = [];
  let running = 0;

  steps.forEach((step, index) => {
    if (step.isTotal) {
      base[index] = 0;
      totals[index] = includePersonal ? outputs.afterTax : running;
    } else {
      base[index] = running;
      running += step.delta;
      totals[index] = running;
    }

    positive[index] = step.delta > 0 ? step.delta : 0;
    negative[index] = step.delta < 0 ? step.delta : 0;
  });

  return { base, positive, negative, totals };
}

function ensureChart() {
  if (state.waterfall) return;

  const ctx = $('frankingWaterfall').getContext('2d');
  state.waterfall = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: STEP_LABELS,
      datasets: [
        {
          label: 'Base',
          data: STEP_LABELS.map(() => 0),
          backgroundColor: 'rgba(0,0,0,0)',
          borderColor: 'rgba(0,0,0,0)',
          borderSkipped: false,
          stack: 'flow',
          hoverBackgroundColor: 'rgba(0,0,0,0)'
        },
        {
          label: 'Increase',
          data: STEP_LABELS.map(() => 0),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
          borderSkipped: false,
          borderRadius: 8,
          stack: 'flow'
        },
        {
          label: 'Decrease',
          data: STEP_LABELS.map(() => 0),
          backgroundColor: 'rgba(248, 113, 113, 0.75)',
          borderColor: 'rgba(248, 113, 113, 1)',
          borderWidth: 1,
          borderSkipped: false,
          borderRadius: 8,
          stack: 'flow'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: '#d4d4d4',
            maxRotation: 0,
            autoSkip: false
          }
        },
        y: {
          stacked: true,
          ticks: {
            color: '#a3a3a3',
            callback: (value) => fmtAud.format(value)
          },
          grid: {
            color: 'rgba(63, 63, 70, 0.3)'
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: (ctx) => ctx.datasetIndex !== 0 && ctx.raw !== 0,
          callbacks: {
            title: (ctx) => ctx[0]?.label ?? '',
            label: (ctx) => {
              const value = ctx.raw;
              const running = ctx.chart.$runningTotals?.[ctx.dataIndex];
              const descriptor = value < 0 ? 'Outflow' : 'Inflow';
              const valueText = `${descriptor}: ${fmtAud.format(value)}`;
              if (typeof running === 'number') {
                return `${valueText} | total ${fmtAud.format(running)}`;
              }
              return valueText;
            }
          }
        }
      }
    }
  });
}

function setZeroChart(hiddenPersonal = true) {
  if (!state.waterfall) return;
  const zeroes = STEP_LABELS.map(() => 0);
  state.waterfall.data.datasets[0].data = zeroes.slice();
  state.waterfall.data.datasets[1].data = zeroes.slice();
  state.waterfall.data.datasets[2].data = zeroes.slice();
  state.waterfall.$runningTotals = zeroes.slice();
  state.waterfall.options.scales.x.ticks.color = (context) => {
    if (hiddenPersonal && context.index >= 3) {
      return '#525252';
    }
    return '#d4d4d4';
  };
  state.waterfall.update('none');
}

function updateChart(inputs, outputs, includePersonal) {
  if (!state.waterfall) return;
  const { base, positive, negative, totals } = prepareWaterfallData(inputs, outputs, includePersonal);

  state.waterfall.data.datasets[0].data = base;
  state.waterfall.data.datasets[1].data = positive;
  state.waterfall.data.datasets[2].data = negative;
  state.waterfall.$runningTotals = totals;

  state.waterfall.options.scales.x.ticks.color = (context) => {
    if (!includePersonal && context.index >= 3) {
      return '#525252';
    }
    return '#d4d4d4';
  };

  state.waterfall.update();
}

function handleUpdate({ showErrors = false } = {}) {
  ensureChart();
  const raw = readInputs();

  if (!inputsAreValid(raw)) {
    if (showErrors) {
      renderError('Please enter valid values.');
    } else {
      $('out').classList.add('hidden');
    }
    setZeroChart(true);
    return;
  }

  const inputs = {
    dividend: raw.dividend,
    frankingPct: raw.frankingPct,
    companyRate: raw.companyPercent / 100,
    personalRate: raw.hasPersonalRate ? (raw.personalRatePercent / 100) : 0,
    hasPersonalRate: raw.hasPersonalRate
  };

  const outputs = computeFranking({
    dividend: inputs.dividend,
    frankingPct: inputs.frankingPct,
    companyRate: inputs.companyRate,
    personalRate: inputs.personalRate
  });

  renderSummary(inputs, outputs, {
    hasPersonal: inputs.hasPersonalRate,
    value: inputs.personalRate
  });

  updateChart(inputs, outputs, inputs.hasPersonalRate);
}

document.addEventListener('DOMContentLoaded', () => {
  ensureChart();
  setZeroChart();

  $('calc').addEventListener('click', () => handleUpdate({ showErrors: true }));
  INPUT_IDS.forEach((id) => {
    const node = $(id);
    if (!node) return;
    node.addEventListener('input', () => handleUpdate());
  });
});
