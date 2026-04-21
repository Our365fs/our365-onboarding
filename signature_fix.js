// ════════════════════════════════════════════════════════════
//  SIGNATURE PAD — DESKTOP + MOBILE FIX
//  Paste this BEFORE </body> in onboarding-index.html
//  Replaces broken touch-only signature with full mouse+touch support
// ════════════════════════════════════════════════════════════

(function patchSignaturePad() {
  // Find the signature canvas — try common IDs used in the onboarding form
  const CANVAS_IDS = ['signatureCanvas','signature-canvas','sig-canvas','sigCanvas'];
  let canvas = null;
  for (const id of CANVAS_IDS) {
    canvas = document.getElementById(id);
    if (canvas) break;
  }
  // Also try querySelector for any canvas inside a signature container
  if (!canvas) {
    canvas = document.querySelector('.signature-pad canvas, .sig-pad canvas, [data-signature] canvas, canvas[id*="sign"]');
  }
  if (!canvas) {
    console.warn('[SignatureFix] No signature canvas found — will retry on DOM ready');
    document.addEventListener('DOMContentLoaded', patchSignaturePad);
    return;
  }

  const ctx = canvas.getContext('2d');
  let drawing = false;
  let hasSigned = false;

  // Set canvas dimensions explicitly so it works on desktop
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth   = 2.2;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top
    };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasSigned = true;

    // Update any hidden field that stores the signature data
    const dataInputs = document.querySelectorAll(
      '#signatureData, #signature_data, input[name="signature"], input[name*="sign"]'
    );
    const dataUrl = canvas.toDataURL('image/png');
    dataInputs.forEach(inp => { inp.value = dataUrl; });

    // Remove "required" error styling if present
    canvas.style.border = '';
    const errMsg = document.querySelector('.sig-error, .signature-error, #sigError');
    if (errMsg) errMsg.style.display = 'none';
  }

  function endDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    drawing = false;
    ctx.beginPath(); // reset path so next stroke starts fresh
  }

  // Remove old listeners by cloning (cleanest approach)
  const fresh = canvas.cloneNode(true);
  canvas.parentNode.replaceChild(fresh, canvas);
  const c = fresh;
  const cx = c.getContext('2d');
  cx.strokeStyle = '#1A1A1A';
  cx.lineWidth   = 2.2;
  cx.lineCap     = 'round';
  cx.lineJoin    = 'round';

  // Mouse events (desktop)
  c.addEventListener('mousedown',  startDraw, { passive: false });
  c.addEventListener('mousemove',  draw,      { passive: false });
  c.addEventListener('mouseup',    endDraw,   { passive: false });
  c.addEventListener('mouseleave', endDraw,   { passive: false });

  // Touch events (mobile)
  c.addEventListener('touchstart', startDraw, { passive: false });
  c.addEventListener('touchmove',  draw,      { passive: false });
  c.addEventListener('touchend',   endDraw,   { passive: false });

  // Patch "Clear" button to also reset hasSigned
  const clearBtns = document.querySelectorAll(
    '#clearSig, #clearSignature, .clear-sig, .clear-signature, [onclick*="clearSig"], [onclick*="clear_sig"]'
  );
  clearBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cx.clearRect(0, 0, c.width, c.height);
      hasSigned = false;
      const dataInputs = document.querySelectorAll(
        '#signatureData, #signature_data, input[name="signature"], input[name*="sign"]'
      );
      dataInputs.forEach(inp => { inp.value = ''; });
    });
  });

  // Patch Next / Submit button — validate signature before allowing proceed
  const nextBtns = document.querySelectorAll(
    'button[onclick*="next"], button[onclick*="Next"], button[onclick*="submit"], .btn-next, .step-next, #btnNext, #nextBtn'
  );
  nextBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      // Only block if we're on the signature step
      const sigStep = c.closest('.step, .wizard-step, [data-step]');
      if (!sigStep) return; // not in a step container, skip
      if (!hasSigned) {
        e.stopImmediatePropagation();
        e.preventDefault();
        c.style.border = '2px solid #CC2222';
        let err = document.querySelector('.sig-error, #sigError');
        if (!err) {
          err = document.createElement('div');
          err.className = 'sig-error';
          err.style.cssText = 'color:#CC2222;font-size:12px;margin-top:6px;font-weight:600';
          err.textContent = 'Please sign before continuing.';
          c.parentNode.insertBefore(err, c.nextSibling);
        }
        err.style.display = 'block';
        c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, true); // capture phase so it fires before existing onclick
  });

  console.log('[SignatureFix] Signature pad patched for desktop + mobile');
  window.__signaturePadFixed = true;
  window.__getSignatureData  = () => hasSigned ? c.toDataURL('image/png') : null;
  window.__signatureHasSigned = () => hasSigned;
})();
