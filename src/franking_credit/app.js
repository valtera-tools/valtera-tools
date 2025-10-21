const $ = (id) => document.getElementById(id);
const fmtAud = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const fmtPct = new Intl.NumberFormat('en-AU', { style: 'percent', maximumFractionDigits: 1 });

$('calc').addEventListener('click', () => {
  const dividend = parseFloat($('dividend').value) || 0;
  const frankingPct = (parseFloat($('frankingPct').value) || 0) / 100;
  const taxRate = (parseFloat($('taxRate').value) || 0) / 100;
  const personalRate = (parseFloat($('personalRate').value) || 0) / 100;

  if (dividend <= 0 || frankingPct < 0 || frankingPct > 1 || taxRate <= 0 || taxRate >= 1) {
    $('out').classList.remove('hidden');
    $('creditLine').textContent = 'Please enter valid values.';
    $('creditLine').className = 'text-lg font-medium text-red-400';
    $('grossLine').textContent = '';
    $('afterTaxLine').textContent = '';
    return;
  }

  // Core franking math
  const fullCredit = dividend * (taxRate / (1 - taxRate));
  const frankingCredit = fullCredit * frankingPct;
  const grossedUp = dividend + frankingCredit;

  $('out').classList.remove('hidden');
  $('creditLine').className = 'text-lg font-medium text-emerald-400';
  $('creditLine').textContent = `Franking credit: ${fmtAud.format(frankingCredit)}`;
  $('grossLine').textContent = `Grossed-up dividend: ${fmtAud.format(grossedUp)} (${fmtPct.format(frankingPct)} franked at ${fmtPct.format(taxRate)} company rate)`;

  if (personalRate > 0 && personalRate < 1) {
    const personalTax = grossedUp * personalRate;
    const afterTax = grossedUp - personalTax;
    $('afterTaxLine').textContent =
      `Estimated after-tax income (at ${fmtPct.format(personalRate)}): ${fmtAud.format(afterTax)}`;
  } else {
    $('afterTaxLine').textContent = '';
  }
});
