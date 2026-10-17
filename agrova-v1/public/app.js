import { seed, summary } from './domain.mjs';

const STORAGE_KEY = 'agrova_v1_innovatrix_reconstructed_demo';
const clone = x => JSON.parse(JSON.stringify(x));
const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const num = value => Number(value).toLocaleString('en-IN', { maximumFractionDigits:2 });
const money = value => '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits:2 });
const kg = value => `${num(value)} kg`;
const gradeOptions = (value) => ['A','B','C'].map(g => `<option value="${g}"${g === value ? ' selected' : ''}>Grade ${g}</option>`).join('');
const safetyOptions = (value) => [['cleared','Cleared'],['hold','Safety hold']].map(([v,label]) => `<option value="${v}"${v === value ? ' selected' : ''}>${label}</option>`).join('');
const availabilityOptions = (value) => [['accepting','Accepting offers'],['paused','Not accepting']].map(([v,label]) => `<option value="${v}"${v === value ? ' selected' : ''}>${label}</option>`).join('');
const nav = [
  { hash:'overview', icon:'◫', label:'Overview' },
  { hash:'lots', icon:'▧', label:'Lots & quality' },
  { hash:'orders', icon:'▤', label:'Buyer orders' },
  { hash:'matching', icon:'↗', label:'Basic matching' },
  { hash:'about', icon:'ⓘ', label:'About V1' }
];

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && Array.isArray(parsed.lots) && Array.isArray(parsed.buyers)) return parsed;
  } catch (error) { console.warn('Could not read demo state:', error); }
  return clone(seed);
}
let state = loadState();
let showAddLot = false;
let showAddBuyer = false;
let toastTimer;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { notice('Browser storage is unavailable. Changes will not persist after reload.', true); }
}
function notice(message, error=false) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' error' : '');
  el.textContent = message;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 3600);
}
function view() {
  const requested = location.hash.replace('#','');
  return nav.some(i => i.hash === requested) ? requested : 'overview';
}
function pill(text, cls='') { return `<span class="tag ${cls}">${esc(text)}</span>`; }
function titleSection(eyebrow, title, subtitle, extras='') {
  return `<div class="section-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><div class="subhead">${esc(subtitle)}</div></div>${extras}</div>`;
}
function stat(label, val, unit, caption) {
  return `<div class="stat"><div class="stat-label">${esc(label)}</div><div class="stat-value">${esc(val)}${unit?`<small> ${esc(unit)}</small>`:''}</div><div class="stat-sub">${esc(caption)}</div></div>`;
}
function lotRow(lot) {
  const held = lot.safety !== 'cleared';
  return `<div class="lot-line"><div class="lot-person"><span class="avatar">${esc(lot.farmer[0]?.toUpperCase() || '?')}</span><div><div class="lot-name">${esc(lot.farmer)}</div><div class="lot-desc">${esc(lot.id)} · ${esc(lot.crop)} · Grade ${esc(lot.grade)}</div></div></div><div class="lot-qty">${kg(lot.quantityKg)}</div>${pill(held?'Safety hold':'Cleared',held?'tag-warn':'')}</div>`;
}
function overview() {
  const s = summary(state);
  const best = s.options.find(r => r.available);
  return `${titleSection('Your harvest, accounted for', 'Good decisions. Better outcomes.', 'An early-stage crop visibility and basic matching demo for FPO managers.')}
    <section class="hero"><div><div class="eyebrow">AGROVA V1 · FRONTEND FOUNDATION</div><h2>Every crop lot deserves<br>a clearer next move.</h2><p>See which produce meets a buyer’s requirement, what remains unmatched, and where another buyer might help.</p><a class="btn btn-lime" href="#matching">Explore basic matching ↗</a></div><div class="orb" aria-hidden="true"></div></section>
    <section class="stat-grid" aria-label="Current metrics">
      ${stat('Received produce',num(s.totalKg),'kg',`${state.lots.length} farmer lots · illustrative data`)}
      ${stat('Original buyer shortage',num(s.shortageKg),'kg',s.order?`${s.order.name} · Grade ${s.order.grade}`:'No original order')}
      ${stat('Grade mismatch stock',num(s.gradeMismatchKg),'kg','Cleared stock not suitable for original buyer')}
      ${stat('Potential recovery',num(best?.proposalKg ?? 0),'kg',best?`${best.name} · proposal only`:'No compatible offer')}
    </section>
    <section class="layout-two"><article class="card"><div class="card-header"><h2>Produce at a glance</h2>${pill('Lot overview')}</div>
       ${state.lots.length ? state.lots.map(lotRow).join('') : '<div class="empty">No crop lots yet. Add one to start.</div>'}
       <div class="card-actions"><a class="btn" href="#lots">Manage lots →</a></div></article>
       <article class="card"><div class="card-header"><h2>Matching insights</h2>${pill('Live calculations')}</div>
       <div class="alert-list"><div class="alert-item"><div><div class="alert-title">${esc(s.order?.name || 'No original buyer')}</div><div class="micro">Original buyer eligibility</div></div>${pill(s.order?`${num(s.shortageKg)} kg short`:'Not configured',s.shortageKg?'tag-warn':'')}</div>
       <div class="alert-item"><div><div class="alert-title">${esc(best?.name || 'Recovery buyer')}</div><div class="micro">Grade-compatible proposal</div></div>${pill(best?`${num(best.proposalKg)} kg potential`:'No offer')}</div>
       <div class="alert-item"><div><div class="alert-title">Safety checks</div><div class="micro">Held inventory excluded</div></div>${pill(`${num(s.heldKg)} kg held`,s.heldKg?'tag-warn':'')}</div></div>
       <div class="note" style="margin-top:22px">A potential buyer match is <strong>not</strong> a sale. V1 has no reservation, buyer confirmation, delivery proof or settlement.</div>
       <div class="card-actions"><a class="btn" href="#matching">Review matching →</a></div></article></section>${footer()}`;
}
function lotsPage() {
  return `${titleSection('Inbound produce','Lots & quality','Edit the demo farmer lots. Grade and safety status determine buyer eligibility.', '<button class="btn btn-primary" type="button" data-action="toggle-add-lot">+ Add farmer lot</button>')}
   <article class="card"><form data-form="update-lots"><div class="table-wrap"><table><thead><tr><th>Farmer / lot</th><th>Quantity (kg)</th><th>Grade</th><th>Safety status</th></tr></thead><tbody>
    ${state.lots.map(l => `<tr><td><div style="font-weight:750">${esc(l.farmer)}</div><div class="micro" style="margin-top:6px">${esc(l.id)} · ${esc(l.crop)}</div></td><td><input class="field field-number" aria-label="${esc(l.farmer)} quantity" type="number" name="qty_${l.id}" min="0" max="1000000" step="0.01" required value="${esc(l.quantityKg)}"></td><td><select class="field field-select" aria-label="${esc(l.farmer)} grade" name="grade_${l.id}">${gradeOptions(l.grade)}</select></td><td><select class="field field-select" aria-label="${esc(l.farmer)} safety" name="safety_${l.id}">${safetyOptions(l.safety)}</select></td></tr>`).join('')}
    </tbody></table></div><div class="form-actions"><button class="btn btn-primary" type="submit">Save lot changes</button><a class="btn" href="#orders">View buyer requirements →</a></div></form><div class="note" style="margin-top:25px">Safety-held produce is excluded from matching. A Grade B crop is not necessarily unsafe; it may simply fail one buyer's Grade A requirement.</div></article>
    <article id="add-lot-panel" class="card ${showAddLot?'':'form-hidden'}" style="margin-top:18px"><div class="card-header"><h2>Create a farmer lot</h2>${pill('Browser demo')}</div><form data-form="add-lot"><div class="input-grid">
      <label class="field-label wide">Farmer name<input class="field" name="farmer" placeholder="e.g. Rina Sharma" required maxlength="80"></label>
      <label class="field-label">Crop<input class="field" name="crop" value="Tomatoes" required maxlength="60"></label>
      <label class="field-label">Quantity (kg)<input class="field" name="quantityKg" type="number" min="0.01" max="1000000" step="0.01" required></label>
      <label class="field-label">Grade<select class="field" name="grade">${gradeOptions('A')}</select></label>
      <label class="field-label">Safety status<select class="field" name="safety">${safetyOptions('cleared')}</select></label>
      </div><div class="form-actions"><button class="btn btn-primary" type="submit">Save new lot</button><button type="button" class="btn" data-action="toggle-add-lot">Cancel</button></div></form></article>${footer()}`;
}
function buyerPanel(buyer) {
  const s = summary(state), option = s.options.find(o=>o.id===buyer.id);
  const isOriginal = buyer.role === 'original';
  const eligible = isOriginal ? s.eligibleKg : option?.eligibleKg ?? 0;
  const proposed = isOriginal ? s.shortageKg : option?.proposalKg ?? 0;
  return `<article class="card order-panel"><div class="card-header"><h2>${esc(buyer.name)}</h2>${pill(isOriginal?'Original order':'Recovery buyer',isOriginal?'tag-warn':'')}</div><p class="order-meta">${esc(buyer.id)} · ${esc(buyer.crop)} · Grade ${esc(buyer.grade)}</p><form data-form="update-buyer" data-id="${esc(buyer.id)}"><div class="fields-two">
      <label class="field-label">Required grade<select class="field" name="grade">${gradeOptions(buyer.grade)}</select></label>
      <label class="field-label">Required quantity (kg)<input class="field" type="number" name="demandKg" min="0.01" max="1000000" step="0.01" required value="${esc(buyer.demandKg)}"></label>
      <label class="field-label">Reference rate (₹/kg)<input class="field" type="number" name="rateRupees" min="0" max="1000000" step="0.01" required value="${esc(buyer.rateRupees)}"></label>
      <label class="field-label">Availability<select class="field" name="availability">${availabilityOptions(buyer.availability)}</select></label>
      </div><div class="form-actions"><button type="submit" class="btn btn-primary">Save & recalculate</button></div></form>
      <div class="divider"></div><div class="summary-row"><span>${isOriginal?'Eligible stock':'Eligible matching stock'}</span><strong>${kg(eligible)}</strong></div>
      <div class="summary-row"><span>${isOriginal?'Unfilled order quantity':'Possible proposal (not reserved)'}</span><strong>${kg(proposed)}</strong></div>
      ${isOriginal?'<div class="note">Grade and safety rules are applied. Changing the order updates the shortage.</div>':'<div class="note">V1 proposes a match only. No buyer acceptance, order confirmation or stock reservation takes place.</div>'}</article>`;
}
function ordersPage() {
  return `${titleSection('Procurement','Buyer orders','Edit buyer requirements, update availability, and watch matching calculations change.','<button class="btn btn-primary" data-action="toggle-add-buyer" type="button">+ Add buyer</button>')}
  <section class="order-grid">${state.buyers.map(buyerPanel).join('')}</section>
  <article id="add-buyer-panel" class="card ${showAddBuyer?'':'form-hidden'}" style="margin-top:18px"><div class="card-header"><h2>Create demo buyer</h2>${pill('Basic matching')}</div><form data-form="add-buyer"><div class="input-grid">
    <label class="field-label wide">Buyer name<input class="field" name="name" maxlength="80" required placeholder="e.g. Harvest Foods"></label>
    <label class="field-label">Crop<input class="field" name="crop" maxlength="60" required value="Tomatoes"></label>
    <label class="field-label">Grade<select class="field" name="grade">${gradeOptions('B')}</select></label>
    <label class="field-label">Demand (kg)<input class="field" name="demandKg" type="number" min="0.01" max="1000000" step="0.01" required></label>
    <label class="field-label">Reference rate (₹/kg)<input class="field" name="rateRupees" type="number" min="0" max="1000000" step="0.01" required></label>
    <label class="field-label">Availability<select class="field" name="availability">${availabilityOptions('accepting')}</select></label>
    </div><div class="form-actions"><button class="btn btn-primary" type="submit">Add recovery buyer</button><button type="button" class="btn" data-action="toggle-add-buyer">Cancel</button></div></form></article>${footer()}`;
}
function matchingPage() {
  const s=summary(state), order=s.order;
  const ratio = order && order.demandKg>0 ? Math.min(100,(s.eligibleKg/order.demandKg)*100) : 0;
  return `${titleSection('Decision support','Basic buyer matching','A transparent, rules-based frontend prototype — proposals are not committed transactions.')}
    <section class="stat-grid">${stat('Original order',num(order?.demandKg ?? 0),'kg',order?.name ?? 'No order')}${stat('Eligible Grade '+(order?.grade ?? '—'),num(s.eligibleKg),'kg','Cleared stock only')}${stat('Open shortage',num(s.shortageKg),'kg','Not fulfilled')}${stat('Mismatched cleared stock',num(s.gradeMismatchKg),'kg','Requires separate matching')}</section>
    <section class="match-grid"><article class="card"><div class="card-header"><h2>Original buyer requirements</h2>${pill(s.shortageKg?'Mismatch detected':'Stock is sufficient',s.shortageKg?'tag-warn':'')}</div>
      ${order?`<div class="micro">${esc(order.name)} requires ${kg(order.demandKg)} of Grade ${esc(order.grade)} ${esc(order.crop)}</div>
      <div class="progressbar"><div class="progressfill" style="width:${ratio}%"></div></div><div class="summary-row"><span>Eligible cleared inventory</span><strong>${kg(s.eligibleKg)}</strong></div><div class="summary-row"><span>Original buyer shortage</span><strong>${kg(s.shortageKg)}</strong></div>`:'<div class="empty">Create an original order to see matching.</div>'}
      <div class="note warn" style="margin-top:22px">Stock available and stock eligible for one particular buyer are not the same thing. An alternative sale does not fulfill the original order.</div>
      <div class="card-actions"><a href="#orders" class="btn">Edit buyer requirements →</a></div></article>
      <article class="card"><div class="card-header"><h2>Matching rules</h2>${pill('Deterministic')}</div><ol class="help-list"><li>Crop must match the buyer.</li><li>Verified grade must match the requirement.</li><li>Safety status must be <strong>Cleared</strong>.</li><li>Proposal cannot exceed buyer demand.</li><li>Availability must be accepting offers.</li></ol><div class="note" style="margin-top:23px">No delivery deadline, distance, transport cost, buyer authentication or real-time demand network is connected in V1.</div></article></section>
      <article class="card" style="margin-top:18px"><div class="card-header"><h2>Potential alternative buyers</h2>${pill(`${s.options.length} demo buyer(s)`)}</div>
        ${s.options.length ? s.options.map(o=>`<div class="proposal"><div class="proposal-title"><h3>${esc(o.name)}</h3>${pill(o.available?'Compatible proposal':'Not available',o.available?'':'tag-warn')}</div><div class="proposal-meta">${esc(o.crop)} · Grade ${esc(o.grade)} · ${money(o.rateRupees)}/kg · demand ${kg(o.demandKg)}</div>
           <div class="proposal-stats"><div><span class="micro">Proposed quantity</span><strong>${kg(o.proposalKg)}</strong></div><div><span class="micro">Estimated gross (not payable)</span><strong>${money(o.estimatedGrossRupees)}</strong></div></div></div>`).join(''):'<div class="empty">Add a recovery buyer to explore matching.</div>'}
        <div class="note">These are hypothetical buyer requirements in a browser demo. V1 does not send offers, reserve stock or record payments. Those capabilities are introduced in V2.</div></article>${footer()}`;
}
function aboutPage() {
  return `${titleSection('Project roadmap','Agrova V1 — baseline','Reconstructed frontend foundation of Agrova for Team INNOVATRIX.')}
    <section class="layout-two"><article class="card"><div class="card-header"><h2>What V1 demonstrates</h2>${pill('Frontend-only')}</div><ul class="help-list"><li>Responsive FPO operations dashboard</li><li>Editable farmer lots and buyer requirements</li><li>Grade and safety based matching</li><li>Dynamic shortage and gross proposal calculations</li><li>Browser-local demo state with Reset</li></ul></article>
    <article class="card"><div class="card-header"><h2>What comes next</h2>${pill('Version journey')}</div><div class="alert-item"><div><div class="alert-title">V2 · Recovery & settlement</div><div class="micro">Shared database, buyer offers, reservations, delivery evidence and dispute review</div></div></div><div class="alert-item"><div><div class="alert-title">V3 · FPO operations</div><div class="micro">Shortage sourcing, recovery economics, quality passports and farmer ledger</div></div></div></article></section>
    <article class="card" style="margin-top:18px"><div class="card-header"><h2>Important disclosure</h2>${pill('Historical accuracy')}</div><div class="note warn">The original Agrova V1 source was not available. This is a <strong>reconstructed V1 baseline</strong> derived from the V2/V3 concept for chronological Git snapshots. It is not an original dated historical commit, and should not be presented as one.</div></article>${footer()}`;
}
function footer() {
  return `<footer class="foot"><span>Agrova · Team INNOVATRIX · V1 reconstructed baseline</span><span>Illustrative crop lots & prices · No real buyer confirmation or payments</span></footer>`;
}
function render() {
  const page=view();
  const content = { overview:overview, lots:lotsPage, orders:ordersPage, matching:matchingPage, about:aboutPage }[page]();
  const name = nav.find(item=>item.hash===page).label;
  document.title = `${name} · Agrova V1`;
  document.getElementById('root').innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand"><span class="brand-mark" aria-hidden="true"></span>agrova</div><div class="brand-sub">OPERATIONS WORKSPACE</div><div class="centre"><div class="side-label">COLLECTION CENTRE</div><div class="centre-title">❖ &nbsp;Green Valley FPO</div><div class="centre-sub">Delhi NCR · Centre 01</div></div><nav class="nav" aria-label="Main navigation">${nav.map(n=>`<a href="#${n.hash}" class="${n.hash===page?'active':''}" ${n.hash===page?'aria-current="page"':''}><span class="nav-icon">${n.icon}</span>${n.label}</a>`).join('')}</nav><div class="sidebar-bottom"><div><span class="status-dot"></span>Local browser demo</div><br>Team INNOVATRIX<br>Basic Crop Matching UI<br><br>Version 1.0 · Reconstructed</div></aside>
   <div class="content-wrap"><header class="topbar"><div class="breadcrumb">Workspace <span>/</span> ${esc(name)}</div><div class="top-actions"><span class="pill">● ILLUSTRATIVE DATA</span><button class="btn btn-small" type="button" data-action="reset-demo">↻ Reset demo</button><span class="btn btn-small" aria-label="Version 1">V1 FRONTEND</span></div></header><main class="content" id="main-content">${content}</main></div></div>`;
}
function validateQty(value, label='Quantity') {
  const n=Number(value);
  if (!Number.isFinite(n) || n<=0 || n>1e6 || Math.round(n*100)!==n*100 && Math.abs(Math.round(n*100)-n*100)>1e-7) throw new Error(`${label} must be greater than zero and use at most 2 decimals.`);
  return Math.round(n*100)/100;
}
function validateNonnegative(value, label='Rate') {
  const n=Number(value);
  if (!Number.isFinite(n) || n<0 || n>1e6) throw new Error(`${label} must be between 0 and 1,000,000.`);
  return Math.round(n*100)/100;
}
function formValue(data, name) { return String(data.get(name) ?? '').trim(); }
function nextId(rows, prefix) {
  const ids = rows.map(row=>Number.parseInt(String(row.id).replace(/\D/g,''),10)||0);
  return `${prefix}-${String(Math.max(0,...ids)+1).padStart(3,'0')}`;
}

document.addEventListener('click', event => {
  const button=event.target.closest('[data-action]');
  if (!button) return;
  switch(button.dataset.action) {
    case 'reset-demo':
      if (!confirm('Reset all browser demo edits back to the original 95 kg dataset?')) return;
      state=clone(seed); save(); showAddLot=false; showAddBuyer=false; render(); notice('Illustrative demo data restored.'); break;
    case 'toggle-add-lot': showAddLot=!showAddLot; render(); document.getElementById('add-lot-panel')?.scrollIntoView({block:'nearest',behavior:'smooth'}); break;
    case 'toggle-add-buyer': showAddBuyer=!showAddBuyer; render(); document.getElementById('add-buyer-panel')?.scrollIntoView({block:'nearest',behavior:'smooth'}); break;
  }
});

document.addEventListener('submit', event => {
  const form=event.target;
  if (!form.dataset.form) return;
  event.preventDefault();
  try {
    const data=new FormData(form);
    switch (form.dataset.form) {
      case 'update-lots': {
        const changed=state.lots.map(l=>{
          const q=formValue(data,`qty_${l.id}`),g=formValue(data,`grade_${l.id}`),s=formValue(data,`safety_${l.id}`);
          if (!['A','B','C'].includes(g)||!['cleared','hold'].includes(s)) throw new Error('Invalid grade or safety status.');
          const n=Number(q); if (!Number.isFinite(n)||n<0||n>1e6) throw new Error('Quantity must be between 0 and 1,000,000.');
          return {...l,quantityKg:Math.round(n*100)/100,grade:g,safety:s};
        });
        state.lots=changed; save(); render(); notice('Lot changes saved in this browser.'); break;
      }
      case 'add-lot': {
        const farmer=formValue(data,'farmer'),crop=formValue(data,'crop'),grade=formValue(data,'grade'),safety=formValue(data,'safety');
        if (!farmer||!crop||!['A','B','C'].includes(grade)||!['cleared','hold'].includes(safety)) throw new Error('Complete the farmer lot form.');
        state.lots.push({ id:nextId(state.lots,'LOT'),farmer,crop,grade,safety,quantityKg:validateQty(formValue(data,'quantityKg')) });
        showAddLot=false;save();render();notice('New farmer lot added.');break;
      }
      case 'update-buyer': {
        const buyer=state.buyers.find(b=>b.id===form.dataset.id);
        if (!buyer) throw new Error('Buyer not found.');
        const grade=formValue(data,'grade'),availability=formValue(data,'availability');
        if (!['A','B','C'].includes(grade)||!['accepting','paused'].includes(availability)) throw new Error('Invalid buyer criteria.');
        Object.assign(buyer,{grade,availability,demandKg:validateQty(formValue(data,'demandKg'),'Demand'),rateRupees:validateNonnegative(formValue(data,'rateRupees'),'Rate')});
        save();render();notice(`${buyer.name} updated. Matching recalculated.`);break;
      }
      case 'add-buyer': {
        const name=formValue(data,'name'),crop=formValue(data,'crop'),grade=formValue(data,'grade'),availability=formValue(data,'availability');
        if (!name||!crop||!['A','B','C'].includes(grade)||!['accepting','paused'].includes(availability)) throw new Error('Complete the buyer form.');
        state.buyers.push({id:nextId(state.buyers,'ORD'),name,crop,grade,role:'recovery',availability,demandKg:validateQty(formValue(data,'demandKg'),'Demand'),rateRupees:validateNonnegative(formValue(data,'rateRupees'),'Rate')});
        showAddBuyer=false;save();render();notice('New illustrative recovery buyer added.');break;
      }
    }
  } catch (error) { notice(error.message || 'Could not save changes.', true); }
});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0)});
if (!location.hash) location.replace('#overview');
render();
