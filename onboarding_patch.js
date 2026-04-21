// ════════════════════════════════════════════════════════════
//  OUR 365 ONBOARDING PATCH v2
//  Adds: (1) Bank Account Info  (2) States Appointed
//  Paste this script tag just before </body> in onboarding-index.html:
//  <script src="onboarding_patch.js"></script>
// ════════════════════════════════════════════════════════════

(function installOnboardingPatch() {
  'use strict';

  const GREEN = '#325838';
  const GOLD  = '#C9A84C';

  // ── All 50 states + DC ────────────────────────────────────
  const ALL_STATES = [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado',
    'Connecticut','Delaware','District of Columbia','Florida','Georgia',
    'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
    'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota',
    'Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
    'New Jersey','New Mexico','New York','North Carolina','North Dakota',
    'Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
    'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
    'Virginia','Washington','West Virginia','Wisconsin','Wyoming'
  ];

  // ── CSS ───────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .patch-section {
      background: #fff;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 22px 24px;
      margin: 20px 0;
    }
    .patch-section-title {
      font-size: 1rem;
      font-weight: 700;
      color: ${GREEN};
      margin: 0 0 16px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid ${GOLD};
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .patch-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 600px) { .patch-grid { grid-template-columns: 1fr; } }
    .patch-field { display: flex; flex-direction: column; gap: 5px; }
    .patch-field.full { grid-column: 1 / -1; }
    .patch-field label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #374151;
    }
    .patch-field label .req { color: #CC2222; margin-left: 2px; }
    .patch-field input, .patch-field select {
      padding: 10px 12px;
      border: 1.5px solid #D1D5DB;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #111827;
      background: #F9FAFB;
      transition: border-color .2s;
    }
    .patch-field input:focus, .patch-field select:focus {
      outline: none;
      border-color: ${GREEN};
      background: #fff;
    }
    .patch-field .hint {
      font-size: 0.74rem;
      color: #6B7280;
    }
    .states-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 6px;
      max-height: 280px;
      overflow-y: auto;
      border: 1.5px solid #D1D5DB;
      border-radius: 8px;
      padding: 12px;
      background: #F9FAFB;
    }
    .states-grid label {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 0.82rem;
      color: #374151;
      cursor: pointer;
      padding: 3px 6px;
      border-radius: 5px;
      transition: background .15s;
    }
    .states-grid label:hover { background: #E8F0E9; }
    .states-grid input[type=checkbox] { accent-color: ${GREEN}; width: 15px; height: 15px; cursor: pointer; }
    .states-select-all {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    .states-select-all button {
      font-size: 0.78rem;
      padding: 4px 12px;
      border-radius: 6px;
      border: 1px solid ${GREEN};
      background: transparent;
      color: ${GREEN};
      cursor: pointer;
      font-weight: 600;
    }
    .states-select-all button:hover { background: #E8F0E9; }
    .patch-error {
      color: #CC2222;
      font-size: 0.78rem;
      margin-top: 4px;
      display: none;
    }
    .bank-secure-note {
      background: #EFF6FF;
      border: 1px solid #93C5FD;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.78rem;
      color: #1E40AF;
      margin-top: 12px;
      grid-column: 1 / -1;
    }
  `;
  document.head.appendChild(style);

  // ── Build Banking Section HTML ────────────────────────────
  function buildBankSection() {
    return `
      <div class="patch-section" id="patch-bank-section">
        <div class="patch-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${GREEN}" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          Commission Direct Deposit Information
        </div>
        <div class="patch-grid">
          <div class="patch-field">
            <label>Bank Name <span class="req">*</span></label>
            <input type="text" id="patch_bank_name" required
              placeholder="e.g., Chase, Wells Fargo, Bank of America">
          </div>
          <div class="patch-field">
            <label>Account Type <span class="req">*</span></label>
            <select id="patch_account_type" required>
              <option value="">Select account type</option>
              <option value="Checking">Checking</option>
              <option value="Savings">Savings</option>
            </select>
          </div>
          <div class="patch-field">
            <label>Bank Routing Number <span class="req">*</span></label>
            <input type="text" id="patch_routing_number" required
              maxlength="9" pattern="[0-9]{9}"
              placeholder="9-digit routing number"
              inputmode="numeric">
            <span class="hint">9 digits — found on the bottom left of your check</span>
            <span class="patch-error" id="routing-err">Routing number must be exactly 9 digits</span>
          </div>
          <div class="patch-field">
            <label>Bank Account Number <span class="req">*</span></label>
            <input type="text" id="patch_account_number" required
              placeholder="Full account number"
              inputmode="numeric">
            <span class="hint">Enter your full account number (no spaces)</span>
            <span class="patch-error" id="account-err">Account number is required</span>
          </div>
          <div class="patch-field">
            <label>Confirm Account Number <span class="req">*</span></label>
            <input type="text" id="patch_account_number_confirm" required
              placeholder="Re-enter account number"
              inputmode="numeric">
            <span class="patch-error" id="account-confirm-err">Account numbers do not match</span>
          </div>
          <div class="bank-secure-note">
            <strong>Secure & Encrypted:</strong> Your banking information is collected solely for
            commission direct deposit setup. It is transmitted securely and never shared with third parties.
          </div>
        </div>
      </div>
    `;
  }

  // ── Build States Appointed Section HTML ──────────────────
  function buildStatesSection() {
    const checkboxes = ALL_STATES.map(s =>
      `<label><input type="checkbox" name="patch_states_appointed" value="${s}"> ${s}</label>`
    ).join('');
    return `
      <div class="patch-section" id="patch-states-section">
        <div class="patch-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${GREEN}" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          States Where You Hold Active Appointments
        </div>
        <p style="font-size:0.84rem;color:#6B7280;margin:0 0 12px 0">
          Select all states where you currently have an active insurance license appointment.
          <span class="req" style="color:#CC2222">*</span> At least one required.
        </p>
        <div class="states-select-all">
          <button type="button" onclick="document.querySelectorAll('[name=patch_states_appointed]').forEach(c=>c.checked=true)">Select All</button>
          <button type="button" onclick="document.querySelectorAll('[name=patch_states_appointed]').forEach(c=>c.checked=false)">Clear All</button>
        </div>
        <div class="states-grid">${checkboxes}</div>
        <span class="patch-error" id="states-err" style="display:none">Please select at least one state</span>
      </div>
    `;
  }

  // ── Inject into form ──────────────────────────────────────
  function injectFields() {
    // Strategy: find the last visible form step / section and append before submit
    // Try multiple selectors used by common wizard patterns
    const targets = [
      document.querySelector('.step.active, .wizard-step.active, .form-step.active'),
      document.querySelector('form'),
      document.querySelector('.onboarding-form, .application-form, #onboardingForm'),
      document.getElementById('step5'),
      document.getElementById('step4'),
      document.querySelector('[data-step="5"], [data-step="4"]'),
    ].filter(Boolean);

    if (targets.length === 0) {
      // Retry after DOM settles
      setTimeout(injectFields, 800);
      return;
    }

    const target = targets[0];

    // Don't inject twice
    if (document.getElementById('patch-bank-section')) return;

    // Find submit button to insert before it
    const submitBtn = target.querySelector(
      'button[type=submit], input[type=submit], .btn-submit, #submitBtn, #btnSubmit, [id*="submit" i]'
    ) || target.lastElementChild;

    const bankHtml  = buildBankSection();
    const statesHtml = buildStatesSection();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = bankHtml + statesHtml;

    if (submitBtn && submitBtn.parentNode === target) {
      target.insertBefore(wrapper, submitBtn);
    } else {
      target.appendChild(wrapper);
    }

    attachValidation();
    console.log('[OnboardingPatch] Banking + States sections injected');
  }

  // ── Validation ────────────────────────────────────────────
  function attachValidation() {
    // Routing number — only allow digits, auto-validate length
    const routingEl = document.getElementById('patch_routing_number');
    if (routingEl) {
      routingEl.addEventListener('input', () => {
        routingEl.value = routingEl.value.replace(/\D/g, '');
        const err = document.getElementById('routing-err');
        if (err) err.style.display = routingEl.value.length > 0 && routingEl.value.length !== 9 ? 'block' : 'none';
      });
    }

    // Account number — digits only
    const acctEl = document.getElementById('patch_account_number');
    if (acctEl) {
      acctEl.addEventListener('input', () => {
        acctEl.value = acctEl.value.replace(/\D/g, '');
      });
    }
    const acctConfEl = document.getElementById('patch_account_number_confirm');
    if (acctConfEl) {
      acctConfEl.addEventListener('input', () => {
        acctConfEl.value = acctConfEl.value.replace(/\D/g, '');
        const err = document.getElementById('account-confirm-err');
        if (err && acctEl) {
          err.style.display = acctConfEl.value.length > 0 && acctConfEl.value !== acctEl.value ? 'block' : 'none';
        }
      });
    }
  }

  // ── Pre-submit validation hook ────────────────────────────
  function validatePatch() {
    let valid = true;

    const bankName = document.getElementById('patch_bank_name');
    const acctType = document.getElementById('patch_account_type');
    const routing  = document.getElementById('patch_routing_number');
    const acct     = document.getElementById('patch_account_number');
    const acctConf = document.getElementById('patch_account_number_confirm');

    if (bankName && !bankName.value.trim()) { bankName.style.border='2px solid #CC2222'; valid=false; } else if (bankName) bankName.style.border='';
    if (acctType && !acctType.value)        { acctType.style.border='2px solid #CC2222'; valid=false; } else if (acctType) acctType.style.border='';

    if (routing) {
      const rv = routing.value.trim();
      const rerr = document.getElementById('routing-err');
      if (rv.length !== 9) {
        routing.style.border='2px solid #CC2222';
        if (rerr) rerr.style.display='block';
        valid = false;
      } else { routing.style.border=''; if (rerr) rerr.style.display='none'; }
    }

    if (acct && !acct.value.trim()) {
      acct.style.border='2px solid #CC2222';
      const err = document.getElementById('account-err');
      if (err) err.style.display='block';
      valid = false;
    } else if (acct) { acct.style.border=''; const err=document.getElementById('account-err'); if(err) err.style.display='none'; }

    if (acct && acctConf && acct.value !== acctConf.value) {
      acctConf.style.border='2px solid #CC2222';
      const err = document.getElementById('account-confirm-err');
      if (err) err.style.display='block';
      valid = false;
    } else if (acctConf) { acctConf.style.border=''; const err=document.getElementById('account-confirm-err'); if(err) err.style.display='none'; }

    // States
    const checkedStates = document.querySelectorAll('[name=patch_states_appointed]:checked');
    const stErr = document.getElementById('states-err');
    if (checkedStates.length === 0) {
      if (stErr) stErr.style.display='block';
      valid = false;
    } else {
      if (stErr) stErr.style.display='none';
    }

    return valid;
  }

  // ── Collect patch data for submission ────────────────────
  function getPatchData() {
    const checkedStates = Array.from(
      document.querySelectorAll('[name=patch_states_appointed]:checked')
    ).map(c => c.value);

    return {
      bank_name:              (document.getElementById('patch_bank_name')         || {}).value || '',
      account_type:           (document.getElementById('patch_account_type')      || {}).value || '',
      routing_number:         (document.getElementById('patch_routing_number')    || {}).value || '',
      account_number:         (document.getElementById('patch_account_number')    || {}).value || '',
      states_appointed:       checkedStates.join(', '),
      states_appointed_count: checkedStates.length,
    };
  }

  // ── Hook into existing form submit ────────────────────────
  function hookSubmit() {
    const form = document.querySelector('form');
    if (!form) { setTimeout(hookSubmit, 600); return; }

    form.addEventListener('submit', function(e) {
      if (!validatePatch()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const bankSec = document.getElementById('patch-bank-section');
        if (bankSec) bankSec.scrollIntoView({ behavior:'smooth', block:'center' });
        return false;
      }
      // Merge patch data into a hidden input so it goes with the form
      const patchData = getPatchData();
      let hiddenPatch = document.getElementById('__patch_data__');
      if (!hiddenPatch) {
        hiddenPatch = document.createElement('input');
        hiddenPatch.type = 'hidden';
        hiddenPatch.id   = '__patch_data__';
        hiddenPatch.name = 'patch_extra_fields';
        form.appendChild(hiddenPatch);
      }
      hiddenPatch.value = JSON.stringify(patchData);
    }, true);

    console.log('[OnboardingPatch] Submit hook installed');
  }

  // ── Also expose on window for Supabase submit functions ───
  window.getOnboardingPatchData = getPatchData;
  window.validateOnboardingPatch = validatePatch;

  // ── Init ──────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { injectFields(); hookSubmit(); });
  } else {
    injectFields();
    hookSubmit();
  }

  // Also watch for step changes (wizard navigation)
  const observer = new MutationObserver(() => {
    if (!document.getElementById('patch-bank-section')) injectFields();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class','style'] });

})();
