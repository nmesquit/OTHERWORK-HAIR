const navItems = ['Today','Book','People','Formulas','Stock','Shop','Checkout','Reminders','Website','Money','Ask Otherwork'];
let current = 'Today';
const $ = (q) => document.querySelector(q);
const money = (n) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0));
const api = async (url, opts={}) => { const r=await fetch(url,{headers:{'Content-Type':'application/json'},...opts}); const d=await r.json(); if(!r.ok) throw new Error(d.error||'Request failed'); return d; };

function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
function modal(html){ const d=$('#modal'); $('#modal-content').innerHTML=html; d.showModal(); }
function closeModal(){ $('#modal').close(); }

function renderNav(){
  $('#nav').innerHTML=navItems.map(n=>`<button class="nav-btn ${current===n?'active':''}" data-nav="${n}">${n}</button>`).join('');
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{current=b.dataset.nav; renderNav(); render();});
}

async function render(){
  $('#page-title').textContent = current==='Today' ? 'TODAY' : current.toUpperCase();
  const view=$('#view'); view.innerHTML='<div class="panel empty">Loading…</div>';
  try{
    if(current==='Today') return renderDashboard();
    if(current==='Book') return renderCalendar();
    if(current==='People') return renderClients();
    if(current==='Formulas') return renderFormulas();
    if(current==='Stock') return renderInventory();
    if(current==='Shop') return renderShop();
    if(current==='Checkout') return renderCheckout();
    if(current==='Reminders') return renderReminders();
    if(current==='Website') return renderWebsite();
    if(current==='Money') return renderProfit();
    if(current==='Ask Otherwork') return renderInsights();
  }catch(e){ view.innerHTML=`<div class="panel empty">${e.message}</div>`; }
}

async function renderDashboard(){
  const d=await api('/api/dashboard');
  $('#view').innerHTML=`
    <section class="hero">
      <div><div class="eyebrow">YOUR BUSINESS AT A GLANCE</div><h2>Booked is good.<br><em>Profitably booked is better.</em></h2><p>OTHERWORK connects your calendar, client relationships, product costs and profitability so you can make better decisions behind the chair.</p></div>
      <div class="hero-stat"><span>Product-adjusted rate today</span><strong>${money(d.hourlyRate)}<small>/hr</small></strong><label>Target ${money(d.targetHourlyRate)}/hr</label></div>
    </section>
    <section class="cards">
      ${metric('Booked revenue',money(d.revenue),'+ current appointments')}
      ${metric('Product cost',money(d.productCost),`${d.revenue?((d.productCost/d.revenue)*100).toFixed(1):0}% of service revenue`)}
      ${metric('Open capacity',`${Math.round(d.openMinutes/60*10)/10} hrs`,`~${money(d.potentialOpenRevenue)} opportunity`)}
      ${metric('Rebooking due',`${d.rebookingDue} clients`,`${money(d.rebookingPotential)} potential`)}
    </section>
    <div class="grid">
      <section class="panel"><div class="panel-head"><div><div class="eyebrow">TODAY</div><h3>Your schedule</h3></div><button class="btn small ghost" onclick="go('Book')">View calendar</button></div>
        ${d.appointments.map(a=>appointmentRow(a)).join('')}
      </section>
      <section class="panel"><div class="panel-head"><div><div class="eyebrow">QUICK ACTIONS</div><h3>Make the chair work</h3></div></div>
        <div class="list-row"><div class="spark">↻</div><div class="grow"><strong>Fill a cancellation</strong><span>Match an opening to your waitlist.</span></div><button class="btn small" onclick="openFirstRescue()">Rescue</button></div>
        <div class="list-row"><div class="spark">$</div><div class="grow"><strong>Review profitability</strong><span>Find services under your hourly target.</span></div><button class="btn small" onclick="go('Money')">Review</button></div>
        <div class="list-row"><div class="spark">◌</div><div class="grow"><strong>Track color cost</strong><span>Add product usage to an appointment.</span></div><button class="btn small" onclick="go('Stock')">Track</button></div>
      </section>
    </div>
    <section class="panel insight"><div class="spark">✦</div><div class="grow"><div class="eyebrow">OTHERWORK NOTE</div><h3>${d.insight}</h3><p>Use the Profit screen to see which services are driving or dragging your hourly performance.</p></div><button class="btn ghost" onclick="go('Money')">Review services</button></section>`;
}
function metric(t,v,n){return `<div class="card"><span>${t}</span><strong>${v}</strong><small class="good">${n}</small></div>`}
function appointmentRow(a){
  return `<div class="appointment-row ${a.status==='open'?'open':''}"><time>${formatTime(a.start)}</time><div><strong>${a.clientName}</strong><span class="sub">${a.serviceName||a.label||'Open appointment block'}</span></div>${a.status==='open'?`<button class="btn primary small" onclick="rescue('${a.id}')">Fill opening</button>`:`<span class="money">${money(a.price)}</span>`}</div>`
}
function formatTime(t){ const [h,m]=t.split(':').map(Number); const ap=h>=12?'PM':'AM'; return `${(h%12)||12}:${String(m).padStart(2,'0')} ${ap}`; }

async function renderCalendar(){
  const rows=await api('/api/appointments');
  $('#view').innerHTML=`<section class="panel"><div class="toolbar"><div><div class="eyebrow">SCHEDULE</div><h2 class="section-title">Appointments & openings</h2></div><button class="btn primary" onclick="newAppointment()">+ Appointment</button></div>${rows.map(appointmentRow).join('')}</section>`;
}

async function renderClients(){
  const clients=await api('/api/clients');
  $('#view').innerHTML=`<section class="panel"><div class="toolbar"><div><div class="eyebrow">CLIENT CRM</div><h2 class="section-title">Clients</h2></div><button class="btn primary" onclick="newClient()">+ Client</button></div><table class="table"><thead><tr><th>Client</th><th>Last service</th><th>Avg ticket</th><th>Rebook</th><th>Cancel rate</th></tr></thead><tbody>${clients.map(c=>`<tr><td><strong>${c.name}</strong><br><span class="sub">${c.email||''}</span></td><td>${c.lastService||'—'}</td><td>${money(c.averageTicket)}</td><td>${c.rebookWeeks||'—'} weeks</td><td>${Math.round((c.cancellationRate||0)*100)}%</td></tr>`).join('')}</tbody></table></section>`;
}

async function renderWaitlist(){
  const rows=await api('/api/waitlist');
  $('#view').innerHTML=`<section class="panel"><div class="toolbar"><div><div class="eyebrow">CANCELLATION RESCUE</div><h2 class="section-title">Smart waitlist</h2></div></div>${rows.map(w=>`<div class="wait-row"><div class="avatar">${w.clientName[0]}</div><div class="grow"><strong>${w.clientName}</strong><span>${w.serviceName} · notice ${w.minimumNoticeHours}h</span></div><span class="pill ${w.active?'strong':'review'}">${w.active?'ACTIVE':'USED'}</span></div>`).join('')}</section>`;
}

async function renderProducts(){
  const [products,apps]=await Promise.all([api('/api/products'),api('/api/appointments')]);
  $('#view').innerHTML=`
    <section class="formula-box">
      ${metric('Products loaded',products.length,'cost library')}
      ${metric('Tracked appointments',apps.filter(a=>a.productCost>0).length,'with product costs')}
      ${metric('Color appointments',apps.filter(a=>/color|balayage|gloss|highlight/i.test(a.serviceName)).length,'current demo data')}
      ${metric('Goal','Measure every mix','reduce silent product loss')}
    </section>
    <section class="panel" style="margin-top:18px"><div class="toolbar"><div><div class="eyebrow">COLOR COST LIBRARY</div><h2 class="section-title">Products</h2></div><button class="btn primary" onclick="newProduct()">+ Product</button></div>
    <table class="table"><thead><tr><th>Product</th><th>Category</th><th>Container</th><th>Purchase</th><th>Unit cost</th></tr></thead><tbody>${products.map(p=>`<tr><td><strong>${p.brand}</strong><br>${p.name}</td><td>${p.category}</td><td>${p.containerQuantity}${p.unit}</td><td>${money(p.purchasePrice)}</td><td>${money(p.unitCost)}/${p.unit}</td></tr>`).join('')}</tbody></table></section>
    <section class="panel" style="margin-top:18px"><div class="panel-head"><div><div class="eyebrow">FORMULA COST</div><h3>Add actual product usage</h3></div></div><p style="color:var(--muted);font-size:12px">Choose an appointment and product, then enter the amount used. OTHERWORK recalculates that appointment's actual product cost.</p><button class="btn" onclick="trackUsage()">Track a mix</button></section>`;
}

async function renderProfit(){
  const rows=await api('/api/profitability');
  $('#view').innerHTML=`<section class="panel"><div><div class="eyebrow">TRUE SERVICE ECONOMICS</div><h2 class="section-title">Profitability by service</h2></div><table class="table"><thead><tr><th>Service</th><th>Price</th><th>Avg time</th><th>Product</th><th>Contribution</th><th>$/hr</th><th>Status</th></tr></thead><tbody>${rows.map(s=>`<tr><td><strong>${s.name}</strong></td><td>${money(s.price)}</td><td>${s.averageDurationMinutes} min</td><td>${money(s.averageProductCost)}</td><td>${money(s.contribution)}</td><td><strong>${money(s.contributionPerHour)}</strong></td><td><span class="pill ${s.status}">${s.status.toUpperCase()}</span></td></tr>`).join('')}</tbody></table></section>`;
}

async function renderInsights(){
  const [d,p]=await Promise.all([api('/api/dashboard'),api('/api/profitability')]);
  const low=p.filter(x=>x.status!=='strong');
  $('#view').innerHTML=`<section class="hero"><div><div class="eyebrow">WEEKLY BUSINESS BRAIN</div><h2>Your numbers should tell you <em>what to do next.</em></h2><p>These insights are calculated from your appointments, time and product costs—not generic salon advice.</p></div></section><section class="panel" style="margin-top:18px"><div class="list-row"><div class="spark">$</div><div class="grow"><strong>${money(d.rebookingPotential)} in clients due to rebook</strong><span>${d.rebookingDue} client(s) are inside their expected maintenance window.</span></div></div><div class="list-row"><div class="spark">↻</div><div class="grow"><strong>${Math.round(d.openMinutes/60*10)/10} open hours</strong><span>At your hourly target, that's about ${money(d.potentialOpenRevenue)} of schedule capacity.</span></div></div>${low.map(s=>`<div class="list-row"><div class="spark">!</div><div class="grow"><strong>${s.name}: ${money(s.contributionPerHour)}/hr</strong><span>Below your ${money(d.targetHourlyRate)}/hr target. Review time, product cost or pricing.</span></div><span class="pill ${s.status}">${s.status}</span></div>`).join('')}</section>`;
}


async function openClient(id){
  const c=await api('/api/clients/'+id);
  const formulas=await api('/api/formulas');
  const mine=formulas.filter(f=>f.clientId===id);
  const visits=(c.appointments||[]).sort((a,b)=>String(b.start).localeCompare(String(a.start)));
  $('#view').innerHTML=`<section class="panel">
    <div class="toolbar">
      <div><div class="eyebrow">PEOPLE / CLIENT</div><h2 class="section-title">${c.name}</h2><p class="sub">${c.phone||''} · ${c.email||''}</p></div>
      <div><button class="btn ghost" onclick="go('People')">← People</button> <button class="btn primary" onclick="newFormulaFor('${c.id}')">+ New formula</button></div>
    </div>
    <div class="client-summary">
      <div class="client-note"><div class="eyebrow">CLIENT NOTES</div><p>${c.notes||'No notes yet.'}</p><span class="pill">${c.maintenanceWeeks||8}-week maintenance</span></div>
      <div class="client-note"><div class="eyebrow">COLOR HISTORY</div><strong>${mine.length}</strong><p>saved formula${mine.length===1?'':'s'}</p></div>
      <div class="client-note"><div class="eyebrow">VISITS</div><strong>${visits.length}</strong><p>appointments on record</p></div>
    </div>
    <div class="split">
      <div><div class="eyebrow">FORMULA TIMELINE</div>${mine.length?mine.map(f=>`<article class="timeline-card"><div><b>${f.date}</b><h3>${f.name}</h3><span>${f.service||'Color service'}</span></div><button class="btn ghost small" onclick="toast('Last formula loaded for ${c.name}')">Use last formula</button></article>`).join(''):'<p class="sub">No saved formulas yet.</p>'}</div>
      <div><div class="eyebrow">APPOINTMENT HISTORY</div>${visits.length?visits.slice(0,6).map(v=>`<article class="timeline-card"><div><b>${String(v.start||'').slice(0,10)}</b><h3>${v.service}</h3><span>${money(v.price||0)}</span></div></article>`).join(''):'<p class="sub">No visits yet.</p>'}</div>
    </div>
  </section>`;
}
async function newFormulaFor(clientId){ await newFormula(clientId); }

async function renderFormulas(){ const formulas=await api('/api/formulas'); $('#view').innerHTML=`<section class="panel"><div class="toolbar"><div><div class="eyebrow">COLOR LAB</div><h2 class="section-title">Formula Library</h2><p class="sub">Save every mix. Reuse what worked. Know what it cost.</p></div><button class="btn primary" onclick="newFormula()">+ Save formula</button></div><div class="formula-grid">${formulas.map(f=>`<article class="formula-card"><div class="formula-top"><div><span class="eyebrow">${f.date}</span><h3>${f.name}</h3><span class="sub">${f.clientName} · ${f.service||'Color service'}</span></div>${f.favorite?'<span class="favorite">★</span>':''}</div>${f.items.map(i=>`<div class="formula-line"><span>${i.label||i.productName} · ${i.quantity}g</span><b>${money(i.cost)}</b></div>`).join('')}<div class="formula-total"><span>Estimated formula cost</span><strong>${money(f.items.reduce((n,i)=>n+i.cost,0))}</strong></div><p>${f.notes||''}</p><button class="btn ghost small" onclick="toast('Formula copied to today’s visit')">Use this formula</button></article>`).join('')}</div></section>`; }
async function newFormula(preselect=''){
  const [clients,products]=await Promise.all([api('/api/clients'),api('/api/products')]);
  const productOptions=products.map(p=>`<option value="${p.id}">${p.brand} — ${p.name}</option>`).join('');
  modal(`<h2>Save a color formula</h2><p class="sub">Build the mix in parts so the client's color history stays useful.</p>
  <div class="form-grid">
    <div class="field"><label>Client</label><select id="fm-client">${clients.map(c=>`<option value="${c.id}" ${c.id===preselect?'selected':''}>${c.name}</option>`).join('')}</select></div>
    <div class="field"><label>Formula name</label><input id="fm-name" placeholder="Beige blonde / root melt"></div>
    <div class="formula-builder full">
      ${[1,2,3].map((n,i)=>`<div class="mix-row"><input id="fm-label-${n}" placeholder="${['Root / base','Gloss / toner','Lightener / other'][i]}"><select id="fm-product-${n}"><option value="">Choose product</option>${productOptions}</select><input id="fm-qty-${n}" type="number" min="0" step="1" placeholder="grams"></div>`).join('')}
    </div>
    <div class="field full"><label>Processing + result notes</label><textarea id="fm-notes" placeholder="Placement, processing time, what you loved, what to change next time…"></textarea></div>
  </div>
  <div class="modal-actions"><button class="btn" value="cancel">Cancel</button><button type="button" class="btn primary" onclick="saveFormula()">Save formula</button></div>`);
}
async function saveFormula(){
  const items=[1,2,3].map(n=>({productId:$('#fm-product-'+n).value,label:$('#fm-label-'+n).value||'Color',quantity:Number($('#fm-qty-'+n).value||0)})).filter(i=>i.productId&&i.quantity>0);
  if(!items.length) return toast('Add at least one product and gram amount');
  await api('/api/formulas',{method:'POST',body:JSON.stringify({clientId:$('#fm-client').value,name:$('#fm-name').value||'Saved formula',service:'Color service',notes:$('#fm-notes').value,items})});
  closeModal(); toast('Formula saved · stock deducted · cost recorded'); current='Formulas'; render();
}
async function openFirstRescue(){ const a=await api('/api/appointments'); const opening=a.find(x=>x.status==='open'); if(opening) rescue(opening.id); else toast('No open cancellation blocks right now.'); }
async function bookRescue(openingId,waitlistId){ const r=await api(`/api/rescue/${openingId}/book`,{method:'POST',body:JSON.stringify({waitlistId})}); closeModal(); toast(`${money(r.recoveredRevenue)} revenue recovered 🎉`); render(); }

async function newAppointment(){
  const [clients,services]=await Promise.all([api('/api/clients'),api('/api/services')]);
  modal(`<h2>New appointment</h2><div class="form-grid"><div class="field"><label>Client</label><select id="f-client">${clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div><div class="field"><label>Service</label><select id="f-service">${services.map(s=>`<option value="${s.id}" data-price="${s.price}" data-duration="${s.durationMinutes}" data-cost="${s.typicalProductCost}">${s.name} — ${money(s.price)}</option>`).join('')}</select></div><div class="field"><label>Date</label><input id="f-date" type="date" value="2026-08-24"></div><div class="field"><label>Start</label><input id="f-start" type="time" value="10:00"></div></div><div class="modal-actions"><button class="btn" value="cancel">Cancel</button><button type="button" class="btn primary" onclick="saveAppointment()">Save appointment</button></div>`);
}
async function saveAppointment(){ const s=$('#f-service'); const o=s.selectedOptions[0]; await api('/api/appointments',{method:'POST',body:JSON.stringify({clientId:$('#f-client').value,serviceId:s.value,date:$('#f-date').value,start:$('#f-start').value,price:Number(o.dataset.price),actualDurationMinutes:Number(o.dataset.duration),productCost:Number(o.dataset.cost)})}); closeModal();toast('Appointment added');render(); }

function newClient(){ modal(`<h2>New client</h2><div class="form-grid"><div class="field"><label>Name</label><input id="c-name"></div><div class="field"><label>Email</label><input id="c-email" type="email"></div><div class="field"><label>Average ticket</label><input id="c-ticket" type="number" value="150"></div><div class="field"><label>Rebook cycle (weeks)</label><input id="c-weeks" type="number" value="8"></div></div><div class="modal-actions"><button class="btn" value="cancel">Cancel</button><button type="button" class="btn primary" onclick="saveClient()">Save client</button></div>`); }
async function saveClient(){ await api('/api/clients',{method:'POST',body:JSON.stringify({name:$('#c-name').value,email:$('#c-email').value,averageTicket:Number($('#c-ticket').value),rebookWeeks:Number($('#c-weeks').value)})});closeModal();toast('Client added');render(); }

function newProduct(){ modal(`<h2>Add product</h2><div class="form-grid"><div class="field"><label>Brand</label><input id="p-brand"></div><div class="field"><label>Name</label><input id="p-name"></div><div class="field"><label>Category</label><input id="p-cat" value="Color"></div><div class="field"><label>Container quantity</label><input id="p-qty" type="number" value="60"></div><div class="field"><label>Unit</label><select id="p-unit"><option>g</option><option>ml</option><option>service</option></select></div><div class="field"><label>Purchase price</label><input id="p-price" type="number" step="0.01" value="12"></div></div><div class="modal-actions"><button class="btn" value="cancel">Cancel</button><button type="button" class="btn primary" onclick="saveProduct()">Save product</button></div>`); }
async function saveProduct(){ await api('/api/products',{method:'POST',body:JSON.stringify({brand:$('#p-brand').value,name:$('#p-name').value,category:$('#p-cat').value,containerQuantity:Number($('#p-qty').value),unit:$('#p-unit').value,purchasePrice:Number($('#p-price').value)})});closeModal();toast('Product added');render(); }

async function trackUsage(){ const [products,apps]=await Promise.all([api('/api/products'),api('/api/appointments')]); const booked=apps.filter(a=>a.status==='confirmed'); modal(`<h2>Track color/product usage</h2><div class="form-grid"><div class="field"><label>Appointment</label><select id="u-appt">${booked.map(a=>`<option value="${a.id}">${a.clientName} — ${a.serviceName}</option>`).join('')}</select></div><div class="field"><label>Product</label><select id="u-product">${products.map(p=>`<option value="${p.id}">${p.name} (${money(p.unitCost)}/${p.unit})</option>`).join('')}</select></div><div class="field"><label>Quantity used</label><input id="u-qty" type="number" step="0.1" value="10"></div></div><div class="modal-actions"><button class="btn" value="cancel">Cancel</button><button type="button" class="btn primary" onclick="saveUsage()">Add usage</button></div>`); }
async function saveUsage(){ const r=await api('/api/product-usage',{method:'POST',body:JSON.stringify({appointmentId:$('#u-appt').value,productId:$('#u-product').value,quantity:Number($('#u-qty').value)})});closeModal();toast(`Appointment product cost is now ${money(r.calculatedProductCost)}`);render(); }

window.go=(n)=>{current=n;renderNav();render();};
Object.assign(window,{installHelp,previewPortfolioFile,newPortfolioItem,savePortfolioItem,deletePortfolio,logout,simulateReminders,saveWebsite,openCheckout,completeCheckout,openClient,newFormulaFor,newFormula,saveFormula,rescue,openFirstRescue,bookRescue,newAppointment,saveAppointment,newClient,saveClient,newProduct,saveProduct,trackUsage,saveUsage});
$('#new-appointment').onclick=newAppointment;
$('#login-btn').onclick=login;
boot();
