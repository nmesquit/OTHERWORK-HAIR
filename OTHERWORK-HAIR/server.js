const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const seed = {
      settings: {
        businessName: 'PrettyBooked Studio',
        stylistName: 'Nicole',
        monthlyGoal: 10000,
        targetHourlyRate: 75,
        currency: 'USD'
      },
      clients: [
        { id:'c1', name:'Sarah M.', phone:'555-0101', email:'sarah@example.com', preferredDays:['Thu','Sat'], preferredTimes:['morning','afternoon'], minimumNoticeHours:2, lastService:'Balayage', averageTicket:285, rebookWeeks:8, lastVisit:'2026-07-02', cancellationRate:0.03 },
        { id:'c2', name:'Jessica R.', phone:'555-0102', email:'jessica@example.com', preferredDays:['Tue','Fri'], preferredTimes:['afternoon'], minimumNoticeHours:24, lastService:'Gloss + Blowout', averageTicket:135, rebookWeeks:6, lastVisit:'2026-07-10', cancellationRate:0.08 },
        { id:'c3', name:'Amanda T.', phone:'555-0103', email:'amanda@example.com', preferredDays:['Fri','Sat'], preferredTimes:['afternoon','evening'], minimumNoticeHours:4, lastService:'Cut + Style', averageTicket:95, rebookWeeks:8, lastVisit:'2026-06-20', cancellationRate:0.04 },
        { id:'c4', name:'Taylor B.', phone:'555-0104', email:'taylor@example.com', preferredDays:['Mon','Tue','Wed','Thu','Fri'], preferredTimes:['any'], minimumNoticeHours:1, lastService:'Color Refresh', averageTicket:175, rebookWeeks:6, lastVisit:'2026-07-01', cancellationRate:0.02 },
        { id:'c5', name:'Mia L.', phone:'555-0105', email:'mia@example.com', preferredDays:['Thu','Fri','Sat'], preferredTimes:['morning','afternoon'], minimumNoticeHours:24, lastService:'Balayage', averageTicket:260, rebookWeeks:10, lastVisit:'2026-05-30', cancellationRate:0.05 }
      ],
      services: [
        { id:'s1', name:'Balayage', category:'Color', price:285, durationMinutes:210, bufferMinutes:15, typicalProductCost:42 },
        { id:'s2', name:'Gloss + Blowout', category:'Color', price:135, durationMinutes:90, bufferMinutes:10, typicalProductCost:18 },
        { id:'s3', name:'Cut + Style', category:'Cut', price:95, durationMinutes:75, bufferMinutes:10, typicalProductCost:8 },
        { id:'s4', name:'Color Refresh', category:'Color', price:175, durationMinutes:120, bufferMinutes:15, typicalProductCost:28 },
        { id:'s5', name:'Full Highlight', category:'Color', price:250, durationMinutes:210, bufferMinutes:15, typicalProductCost:38 }
      ],
      products: [
        { id:'p1', brand:'Example Color Co.', name:'Permanent Color', category:'Color', containerQuantity:60, unit:'g', purchasePrice:12 },
        { id:'p2', brand:'Example Color Co.', name:'Developer', category:'Developer', containerQuantity:1000, unit:'g', purchasePrice:18 },
        { id:'p3', brand:'Example Gloss Co.', name:'Toner', category:'Toner', containerQuantity:60, unit:'g', purchasePrice:14 },
        { id:'p4', brand:'Studio Supply', name:'Foils & disposables', category:'Disposable', containerQuantity:100, unit:'service', purchasePrice:35 }
      ],
      appointments: [
        { id:'a1', clientId:'c1', serviceId:'s1', date:'2026-08-24', start:'09:00', status:'confirmed', price:285, actualDurationMinutes:210, productCost:42 },
        { id:'a2', clientId:'c2', serviceId:'s2', date:'2026-08-24', start:'12:45', status:'confirmed', price:135, actualDurationMinutes:90, productCost:18 },
        { id:'a3', clientId:null, serviceId:null, date:'2026-08-24', start:'14:30', status:'open', price:0, actualDurationMinutes:120, productCost:0, label:'2-hour opening' },
        { id:'a4', clientId:'c3', serviceId:'s3', date:'2026-08-24', start:'16:45', status:'confirmed', price:95, actualDurationMinutes:75, productCost:8 }
      ],
      waitlist: [
        { id:'w1', clientId:'c4', serviceId:'s4', desiredDays:['Mon','Tue','Wed','Thu','Fri'], preferredTimes:['any'], minimumNoticeHours:1, active:true },
        { id:'w2', clientId:'c5', serviceId:'s1', desiredDays:['Thu','Fri','Sat'], preferredTimes:['morning','afternoon'], minimumNoticeHours:24, active:true },
        { id:'w3', clientId:'c3', serviceId:'s3', desiredDays:['Fri','Sat'], preferredTimes:['afternoon'], minimumNoticeHours:4, active:true }
      ],
      productUsage: [
        { id:'u1', appointmentId:'a1', productId:'p1', quantity:35 },
        { id:'u2', appointmentId:'a1', productId:'p2', quantity:70 },
        { id:'u3', appointmentId:'a1', productId:'p3', quantity:25 },
        { id:'u4', appointmentId:'a1', productId:'p4', quantity:1 }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
  }
}

ensureDb();

function readDb() { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function writeDb(db) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
function uid(prefix) { return prefix + Math.random().toString(36).slice(2, 10); }
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(JSON.stringify(data));
}
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body='';
    req.on('data', c => { body += c; if (body.length > 7e6) req.destroy(); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch(e){ reject(e); } });
  });
}
function clientName(db, id){ return db.clients.find(c=>c.id===id)?.name || 'Open'; }
function serviceName(db, id){ return db.services.find(s=>s.id===id)?.name || ''; }
function productUnitCost(p){ return Number(p.purchasePrice) / Number(p.containerQuantity || 1); }

function parseCookies(req){
  const out={}; const raw=req.headers.cookie||'';
  raw.split(';').forEach(part=>{const i=part.indexOf('='); if(i>0) out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());});
  return out;
}
function currentUser(db,req){
  const token=parseCookies(req).ow_session;
  if(!token) return null;
  const session=(db.sessions||[]).find(s=>s.token===token);
  if(!session) return null;
  if(new Date(session.expiresAt)<new Date()) return null;
  return (db.users||[]).find(u=>u.id===session.userId)||null;
}
function verifyPassword(user,password){
  const hash=crypto.pbkdf2Sync(String(password||''),user.passwordSalt,Number(user.passwordIterations||120000),32,'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash,'hex'),Buffer.from(user.passwordHash,'hex'));
}
function makeSession(db,user){
  const token=crypto.randomBytes(32).toString('hex');
  const expiresAt=new Date(Date.now()+1000*60*60*24*14).toISOString();
  if(!db.sessions) db.sessions=[];
  db.sessions.push({token,userId:user.id,expiresAt});
  return {token,expiresAt};
}
function requireUser(db,req,res){
  const user=currentUser(db,req);
  if(!user){ json(res,401,{error:'Authentication required'}); return null; }
  return user;
}


function dashboard(db){
  const confirmed = db.appointments.filter(a=>a.status==='confirmed');
  const revenue = confirmed.reduce((n,a)=>n+Number(a.price||0),0);
  const productCost = confirmed.reduce((n,a)=>n+Number(a.productCost||0),0);
  const minutes = confirmed.reduce((n,a)=>n+Number(a.actualDurationMinutes||0),0);
  const contribution = revenue-productCost;
  const hourly = minutes ? contribution/(minutes/60) : 0;
  const openMinutes = db.appointments.filter(a=>a.status==='open').reduce((n,a)=>n+Number(a.actualDurationMinutes||0),0);
  const due = db.clients.filter(c=>{
    if(!c.lastVisit || !c.rebookWeeks) return false;
    const dueDate = new Date(c.lastVisit+'T12:00:00');
    dueDate.setDate(dueDate.getDate()+c.rebookWeeks*7);
    return dueDate <= new Date('2026-08-31T23:59:59');
  });
  return {
    revenue, productCost, contribution, hourlyRate:hourly, openMinutes,
    potentialOpenRevenue: Math.round((openMinutes/60)*db.settings.targetHourlyRate),
    rebookingDue: due.length,
    rebookingPotential: due.reduce((n,c)=>n+Number(c.averageTicket||0),0),
    monthlyGoal: db.settings.monthlyGoal,
    targetHourlyRate: db.settings.targetHourlyRate,
    appointments: db.appointments.map(a=>({...a, clientName:clientName(db,a.clientId), serviceName: serviceName(db,a.serviceId)})),
    insight: hourly < db.settings.targetHourlyRate ? `Current product-adjusted rate is $${hourly.toFixed(0)}/hr, below your $${db.settings.targetHourlyRate}/hr target.` : `You're currently above your $${db.settings.targetHourlyRate}/hr target.`
  };
}

function matchWaitlist(db, openingId){
  const opening = db.appointments.find(a=>a.id===openingId && a.status==='open');
  if(!opening) return [];
  const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(opening.date+'T12:00:00').getDay()];
  const openingMinutes = Number(opening.actualDurationMinutes||0);
  return db.waitlist.filter(w=>w.active).map(w=>{
    const c = db.clients.find(x=>x.id===w.clientId);
    const s = db.services.find(x=>x.id===w.serviceId);
    if(!c || !s || s.durationMinutes > openingMinutes) return null;
    let score=45;
    if((w.desiredDays||[]).includes(dayName)) score += 25;
    if(w.minimumNoticeHours <= 4) score += 10;
    if(s.durationMinutes >= openingMinutes*0.6) score += 10;
    score += Math.max(0, 10-Math.round((c.cancellationRate||0)*100));
    return { waitlistId:w.id, clientId:c.id, clientName:c.name, serviceId:s.id, serviceName:s.name, price:s.price, durationMinutes:s.durationMinutes, minimumNoticeHours:w.minimumNoticeHours, score:Math.min(99,score) };
  }).filter(Boolean).sort((a,b)=>b.score-a.score);
}

function profitability(db){
  return db.services.map(s=>{
    const related = db.appointments.filter(a=>a.serviceId===s.id && a.status==='confirmed');
    const avgDuration = related.length ? related.reduce((n,a)=>n+Number(a.actualDurationMinutes||s.durationMinutes),0)/related.length : s.durationMinutes;
    const avgProduct = related.length ? related.reduce((n,a)=>n+Number(a.productCost||s.typicalProductCost),0)/related.length : s.typicalProductCost;
    const contribution = s.price-avgProduct;
    const perHour = contribution/(avgDuration/60);
    return {...s, averageDurationMinutes:Math.round(avgDuration), averageProductCost:Number(avgProduct.toFixed(2)), contribution:Number(contribution.toFixed(2)), contributionPerHour:Number(perHour.toFixed(2)), status: perHour >= db.settings.targetHourlyRate ? 'strong' : perHour >= db.settings.targetHourlyRate*0.85 ? 'watch' : 'review'};
  });
}

async function api(req,res,url){
  const db = readDb();
  const method=req.method;
  const p=url.pathname;
  try {
    
    if(method==='POST' && p==='/api/auth/login'){
      const b=await parseBody(req);
      const user=(db.users||[]).find(u=>String(u.email).toLowerCase()===String(b.email||'').toLowerCase());
      if(!user || !verifyPassword(user,b.password)) return json(res,401,{error:'Invalid email or password'});
      const session=makeSession(db,user); writeDb(db);
      res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Set-Cookie':`ow_session=${session.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60*60*24*14}`,'Cache-Control':'no-store'});
      return res.end(JSON.stringify({id:user.id,name:user.name,email:user.email,businessId:user.businessId}));
    }
    if(method==='POST' && p==='/api/auth/logout'){
      const token=parseCookies(req).ow_session;
      db.sessions=(db.sessions||[]).filter(x=>x.token!==token); writeDb(db);
      res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Set-Cookie':'ow_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'});
      return res.end(JSON.stringify({ok:true}));
    }
    if(method==='GET' && p==='/api/me'){
      const user=currentUser(db,req);
      if(!user) return json(res,401,{error:'Not signed in'});
      const business=(db.businesses||[]).find(x=>x.id===user.businessId)||null;
      return json(res,200,{id:user.id,name:user.name,email:user.email,business});
    }
    if(method==='POST' && p==='/api/upload'){
      const user=requireUser(db,req,res); if(!user) return;
      const b=await parseBody(req); const m=String(b.dataUrl||'').match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
      if(!m) return json(res,400,{error:'Use a JPG, PNG, or WEBP image'});
      const buf=Buffer.from(m[2],'base64');
      if(buf.length>5*1024*1024) return json(res,413,{error:'Image must be under 5MB'});
      const ext=m[1]==='image/png'?'png':m[1]==='image/webp'?'webp':'jpg';
      const name=`${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR,name),buf);
      return json(res,201,{url:'/uploads/'+name});
    }

    if(p.startsWith('/api/') && ![
      '/api/auth/login','/api/auth/logout','/api/me','/api/public-business','/api/booking-request'
    ].includes(p)){
      const user=requireUser(db,req,res); if(!user) return;
    }
    if(method==='GET' && p==='/api/dashboard') return json(res,200,dashboard(db));
    if(method==='GET' && p.startsWith('/uploads/')){
      const name=path.basename(p);
      const file=path.join(UPLOAD_DIR,name);
      if(!fs.existsSync(file)) return json(res,404,{error:'Not found'});
      const ext=path.extname(file).toLowerCase();
      const type=ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg';
      res.writeHead(200,{'Content-Type':type,'Cache-Control':'public, max-age=31536000, immutable'});
      return fs.createReadStream(file).pipe(res);
    }
        if(method==='GET' && p==='/health') return json(res,200,{ok:true,app:'OTHERWORK HAIR',time:new Date().toISOString()});
    if(method==='GET' && p==='/book'){
      const st=db.settings||{}; const services=(db.services||[]).filter(x=>x.active!==false); const work=db.portfolio||[]; const retail=db.retail||[];
      const fontMap={
        editorial:'Georgia, Times New Roman, serif',
        grotesk:'Arial Narrow, Arial, sans-serif',
        mono:'Courier New, monospace',
        modern:'Arial, Helvetica, sans-serif'
      };
      const displayFont=fontMap[st.fontPreset]||fontMap.editorial;
      const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${st.businessName||'OTHERWORK HAIR'} — Book</title>
      <style>
      :root{--bg:${st.siteBgColor||'#fbf8f1'};--ink:${st.siteTextColor||'#191817'};--accent:${st.accentColor||'#c74324'};--display:${displayFont}}
      *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Arial,sans-serif}.wrap{max-width:1080px;margin:0 auto;padding:28px 22px 70px}.nav{display:flex;justify-content:space-between;align-items:center;padding:6px 0 28px}.mark{font-family:Impact,Arial Narrow,sans-serif;font-size:32px;letter-spacing:.02em}.sub{letter-spacing:.32em;font-size:10px;color:var(--accent);font-weight:900}.nav a{color:var(--ink);text-decoration:none;font-size:12px;font-weight:800}.hero{display:grid;grid-template-columns:1.2fr .8fr;gap:36px;padding:54px 0;border-top:1px solid rgba(0,0,0,.15)}.hero h1{font-family:var(--display);font-size:clamp(44px,7vw,88px);line-height:.95;margin:0 0 20px;font-weight:700}.hero-copy{align-self:end}.muted{color:color-mix(in srgb,var(--ink) 64%,transparent);line-height:1.65}.cta{display:inline-block;background:var(--accent);color:white;text-decoration:none;padding:12px 16px;border-radius:999px;font-weight:900;font-size:12px;margin-top:10px}.section{padding:54px 0;border-top:1px solid rgba(0,0,0,.15)}.section h2{font-family:var(--display);font-size:36px;margin:0 0 20px}.work-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.work-card{background:white;border:1px solid rgba(0,0,0,.12)}.work-card img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}.work-card div{padding:14px}.work-card h3{font-family:var(--display);margin:0 0 5px}.service{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.12)}.booking{background:white;border:1px solid rgba(0,0,0,.14);padding:22px;max-width:720px}.field{display:grid;gap:6px;margin:12px 0}.field input,.field select{padding:12px;border:1px solid rgba(0,0,0,.2);background:var(--bg);color:var(--ink);font:inherit}.btn{background:var(--ink);color:var(--bg);border:0;padding:13px 16px;font-weight:900;cursor:pointer;width:100%}.success{background:#edf4ea;color:#355b3b;padding:12px;margin-top:12px;display:none}.shop-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.product{border:1px solid rgba(0,0,0,.12);padding:16px;background:white}.product h3{font-family:var(--display);margin:0}.footer{padding-top:40px;border-top:1px solid rgba(0,0,0,.15);font-size:12px}.footer a{color:var(--ink)}@media(max-width:760px){.hero{grid-template-columns:1fr}.work-grid,.shop-grid{grid-template-columns:1fr}}
      </style></head><body><main class="wrap">
      <nav class="nav"><div><div class="mark">OTHERWORK</div><div class="sub">HAIR</div></div><a href="#book">BOOK</a></nav>
      <section class="hero"><div><h1>${st.heroHeadline||st.businessName||'Independent hair, done your way.'}</h1></div><div class="hero-copy"><p class="muted">${st.heroSubhead||st.bio||''}</p><p><b>${st.location||''}</b></p><a class="cta" href="#book">BOOK AN APPOINTMENT</a></div></section>
      ${st.showWork!==false?`<section class="section"><h2>Selected work</h2><div class="work-grid">${work.map(x=>`<article class="work-card"><img src="${x.imageUrl}" alt="${x.title}"><div><h3>${x.title}</h3><p class="muted">${x.caption||''}</p></div></article>`).join('')}</div></section>`:''}
      ${st.showAbout!==false?`<section class="section"><h2>About</h2><p class="muted" style="max-width:680px">${st.bio||''}</p></section>`:''}
      ${st.showServices!==false?`<section class="section"><h2>Services</h2>${services.map(x=>`<div class="service"><span><b>${x.name}</b><br><small>${x.durationMinutes||x.duration||60} min</small></span><b>$${Number(x.price||0).toFixed(0)}</b></div>`).join('')}</section>`:''}
      ${st.showShop!==false&&retail.length?`<section class="section"><h2>Shop</h2><div class="shop-grid">${retail.map(x=>`<article class="product"><h3>${x.name}</h3><p class="muted">${x.stock} in stock</p><b>$${Number(x.price||0).toFixed(0)}</b></article>`).join('')}</div></section>`:''}
      <section class="section" id="book"><h2>Book</h2><div class="booking"><div class="field"><label>Name</label><input id="name"></div><div class="field"><label>Email</label><input id="email"></div><div class="field"><label>Phone</label><input id="phone"></div><div class="field"><label>Service</label><select id="service">${services.map(x=>`<option value="${x.id}">${x.name}</option>`).join('')}</select></div><div class="field"><label>Requested date & time</label><input id="start" type="datetime-local"></div><button class="btn" onclick="book()">REQUEST APPOINTMENT</button><div id="ok" class="success">Booked. Your confirmation and reminders are scheduled.</div></div></section>
      <footer class="footer"><b>${st.businessName||''}</b> · ${st.location||''}${st.instagramUrl?` · <a href="${st.instagramUrl}" target="_blank">Instagram</a>`:''}</footer>
      </main><script>async function book(){const body={name:document.getElementById('name').value,email:document.getElementById('email').value,phone:document.getElementById('phone').value,serviceId:document.getElementById('service').value,start:document.getElementById('start').value};const r=await fetch('/api/booking-request',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(r.ok)document.getElementById('ok').style.display='block';}</script></body></html>`;
      res.writeHead(200,{'content-type':'text/html; charset=utf-8'}); return res.end(html);
    }
        if(method==='GET' && p==='/api/settings') return json(res,200,db.settings||{});
    if(method==='POST' && p==='/api/settings'){
      const b=await parseBody(req); db.settings={...(db.settings||{}),...b}; writeDb(db); return json(res,200,db.settings);
    }
    if(method==='GET' && p==='/api/portfolio') return json(res,200,db.portfolio||[]);
    if(method==='POST' && p==='/api/portfolio'){
      const b=await parseBody(req); const item={id:uid('g'),title:'New work',caption:'',imageUrl:'',featured:false,...b};
      if(!db.portfolio) db.portfolio=[]; db.portfolio.unshift(item); writeDb(db); return json(res,201,item);
    }
    if(method==='DELETE' && p.startsWith('/api/portfolio/')){
      const id=p.split('/').pop(); db.portfolio=(db.portfolio||[]).filter(x=>x.id!==id); writeDb(db); return json(res,200,{ok:true});
    }
        if(method==='GET' && p==='/api/public-business'){
      return json(res,200,{settings:db.settings||{},services:(db.services||[]).filter(x=>x.active!==false),portfolio:db.portfolio||[],retail:db.retail||[]});
    }
    if(method==='POST' && p==='/api/booking-request'){
      const b=await parseBody(req);
      const client={id:uid('c'),name:b.name,email:b.email||'',phone:b.phone||'',notes:'Created from public booking page',maintenanceWeeks:8,tags:['online booking']};
      db.clients.unshift(client);
      const service=(db.services||[]).find(x=>x.id===b.serviceId);
      const appointment={id:uid('a'),clientId:client.id,clientName:client.name,serviceId:service?service.id:null,service:service?service.name:(b.service||'Service'),price:service?Number(service.price||0):0,start:b.start,status:'booked',checkedOut:false,tip:0,paymentMethod:null};
      db.appointments.push(appointment);
      const request={id:uid('br'),clientId:client.id,appointmentId:appointment.id,createdAt:new Date().toISOString(),source:'public'};
      db.bookingRequests.unshift(request);
      if(!db.reminders) db.reminders=[];
      if((db.settings||{}).reminder24h) db.reminders.push({id:uid('r'),appointmentId:appointment.id,kind:'24h',channel:'sms/email',status:'scheduled'});
      if((db.settings||{}).reminder2h) db.reminders.push({id:uid('r'),appointmentId:appointment.id,kind:'2h',channel:'sms/email',status:'scheduled'});
      writeDb(db);
      return json(res,201,{appointment,request});
    }
    if(method==='GET' && p==='/api/reminders') return json(res,200,db.reminders||[]);
    if(method==='POST' && p==='/api/reminders/simulate'){
      const now=new Date().toISOString(); let sent=0;
      for(const r of (db.reminders||[])){ if(r.status==='scheduled'){r.status='sent';r.sentAt=now;sent++;} }
      writeDb(db); return json(res,200,{sent,reminders:db.reminders||[]});
    }
        if(method==='GET' && p==='/api/clients') return json(res,200,db.clients);
    if(method==='GET' && p.startsWith('/api/clients/')) {
      const id=p.split('/').pop(); const client=db.clients.find(c=>c.id===id);
      if(!client) return json(res,404,{error:'Client not found'});
      const formulas=(db.formulas||[]).filter(f=>f.clientId===id);
      const appointments=(db.appointments||[]).filter(a=>a.clientId===id);
      return json(res,200,{...client,formulas,appointments});
    }
    if(method==='GET' && p==='/api/services') return json(res,200,db.services);
    if(method==='GET' && p==='/api/products') return json(res,200,db.products.map(x=>({...x, unitCost:productUnitCost(x)})));
    if(method==='GET' && p==='/api/formulas') return json(res,200,(db.formulas||[]).map(f=>({...f,clientName:clientName(db,f.clientId),items:(f.items||[]).map(i=>{const pr=db.products.find(x=>x.id===i.productId);return {...i,productName:pr?`${pr.brand} ${pr.name}`:'Product',cost:pr?Number((productUnitCost(pr)*Number(i.quantity||0)).toFixed(2)):0}})})));
    if(method==='GET' && p==='/api/retail') return json(res,200,db.retail||[]);
    if(method==='GET' && p==='/api/inventory') return json(res,200,db.products.map(pr=>({...pr,unitCost:productUnitCost(pr),inventoryValue:Number((Number(pr.onHand||0)*productUnitCost(pr)).toFixed(2)),low:Number(pr.onHand||0)<=Number(pr.reorderAt||0)})));
    if(method==='GET' && p==='/api/checkout-summary'){
      const rows=db.checkouts||[];
      const totals=rows.reduce((o,r)=>{o.revenue+=Number(r.serviceSubtotal||0)+Number(r.retailSubtotal||0);o.tax+=Number(r.salesTax||0);o.tips+=Number(r.tip||0);o.grossProfit+=Number(r.grossProfit||0);return o;},{revenue:0,tax:0,tips:0,grossProfit:0});
      return json(res,200,{...totals,count:rows.length,recent:rows.slice(0,10)});
    }
        if(method==='GET' && p==='/api/formula-profitability') return json(res,200,(db.formulas||[]).map(f=>{const ap=(db.appointments||[]).find(a=>a.id===f.appointmentId)||null; const cost=(f.items||[]).reduce((sum,i)=>{const pr=db.products.find(x=>x.id===i.productId);return sum+(pr?productUnitCost(pr)*Number(i.quantity||0):0)},0); const revenue=ap?Number(ap.price||0):0; return {formulaId:f.id,name:f.name,clientName:clientName(db,f.clientId),revenue,productCost:Number(cost.toFixed(2)),grossAfterProduct:Number((revenue-cost).toFixed(2))};}));
    if(method==='GET' && p==='/api/appointments') return json(res,200,db.appointments.map(a=>({...a,clientName:clientName(db,a.clientId),serviceName:serviceName(db,a.serviceId)})));
    if(method==='GET' && p==='/api/waitlist') return json(res,200,db.waitlist.map(w=>({...w,clientName:clientName(db,w.clientId),serviceName:serviceName(db,w.serviceId)})));
    if(method==='GET' && p==='/api/profitability') return json(res,200,profitability(db));
    if(method==='GET' && p.startsWith('/api/rescue/')) return json(res,200,matchWaitlist(db,p.split('/').pop()));

    if(method==='POST' && p==='/api/clients'){
      const b=await parseBody(req); const item={id:uid('c'), cancellationRate:0, ...b}; db.clients.push(item); writeDb(db); return json(res,201,item);
    }
    if(method==='POST' && p==='/api/products'){
      const b=await parseBody(req); const item={id:uid('p'), ...b}; db.products.push(item); writeDb(db); return json(res,201,item);
    }
    if(method==='POST' && p==='/api/services'){
      const b=await parseBody(req); const item={id:uid('s'), ...b}; db.services.push(item); writeDb(db); return json(res,201,item);
    }
    if(method==='POST' && p==='/api/appointments'){
      const b=await parseBody(req); const item={id:uid('a'), status:'confirmed', productCost:0, ...b}; db.appointments.push(item); writeDb(db); return json(res,201,item);
    }
    if(method==='POST' && p==='/api/waitlist'){
      const b=await parseBody(req); const item={id:uid('w'), active:true, ...b}; db.waitlist.push(item); writeDb(db); return json(res,201,item);
    }
    if(method==='POST' && p==='/api/formulas'){
      const b=await parseBody(req); const item={id:uid('f'),date:new Date().toISOString().slice(0,10),favorite:false,items:[],...b};
      if(!db.formulas) db.formulas=[]; if(!db.productUsage) db.productUsage=[];
      let formulaCost=0;
      for(const i of (item.items||[])){
        const pr=db.products.find(x=>x.id===i.productId); if(!pr) continue;
        const qty=Number(i.quantity||0); const cost=productUnitCost(pr)*qty; formulaCost+=cost;
        pr.onHand=Math.max(0,Number(pr.onHand||0)-qty);
        db.productUsage.unshift({id:uid('u'),appointmentId:item.appointmentId||null,clientId:item.clientId,formulaId:item.id,productId:i.productId,quantity:qty,cost:Number(cost.toFixed(2)),date:item.date});
      }
      item.formulaCost=Number(formulaCost.toFixed(2)); db.formulas.unshift(item); writeDb(db); return json(res,201,item);
    }
    
    if(method==='POST' && p==='/api/checkout'){
      const b=await parseBody(req);
      const dbNow=readDb();
      const ap=(dbNow.appointments||[]).find(a=>a.id===b.appointmentId);
      if(!ap) return json(res,404,{error:'Appointment not found'});

      const formula=(dbNow.formulas||[]).find(f=>f.appointmentId===ap.id) ||
        (dbNow.formulas||[]).filter(f=>f.clientId===ap.clientId).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];

      let serviceProductCost=0;
      if(formula){
        for(const i of (formula.items||[])){
          const pr=(dbNow.products||[]).find(x=>x.id===i.productId);
          if(pr) serviceProductCost += productUnitCost(pr)*Number(i.quantity||0);
        }
      }

      const retailItems=[];
      let retailSubtotal=0, retailCost=0;
      for(const item of (b.retailItems||[])){
        const r=(dbNow.retail||[]).find(x=>x.id===item.id);
        if(!r) continue;
        const qty=Math.max(0,Number(item.qty||0));
        if(qty<=0) continue;
        const used=Math.min(qty,Number(r.stock||0));
        r.stock=Number(r.stock||0)-used;
        retailSubtotal += Number(r.price||0)*used;
        retailCost += Number(r.cost||0)*used;
        retailItems.push({id:r.id,name:r.name,qty:used,price:Number(r.price||0),cost:Number(r.cost||0)});
      }

      const serviceSubtotal=Number(b.servicePrice ?? ap.price ?? 0);
      const taxableRetail=retailSubtotal;
      const taxRate=Number((dbNow.settings||{}).salesTaxRate||0);
      const salesTax=Number((taxableRetail*taxRate).toFixed(2));
      const tip=Number(b.tip||0);
      const subtotal=serviceSubtotal+retailSubtotal;
      const total=Number((subtotal+salesTax+tip).toFixed(2));
      const grossProfit=Number((serviceSubtotal-serviceProductCost + retailSubtotal-retailCost).toFixed(2));

      const record={
        id:uid('co'),
        appointmentId:ap.id,
        clientId:ap.clientId,
        serviceSubtotal:Number(serviceSubtotal.toFixed(2)),
        serviceProductCost:Number(serviceProductCost.toFixed(2)),
        retailItems,
        retailSubtotal:Number(retailSubtotal.toFixed(2)),
        retailCost:Number(retailCost.toFixed(2)),
        salesTax,
        tip:Number(tip.toFixed(2)),
        paymentMethod:b.paymentMethod||'Other',
        total,
        grossProfit,
        createdAt:new Date().toISOString()
      };

      if(!dbNow.checkouts) dbNow.checkouts=[];
      if(!dbNow.payments) dbNow.payments=[];
      dbNow.checkouts.unshift(record);
      dbNow.payments.unshift({id:uid('pay'),checkoutId:record.id,appointmentId:ap.id,amount:total,method:record.paymentMethod,date:record.createdAt});
      ap.checkedOut=true; ap.status='completed'; ap.tip=tip; ap.paymentMethod=record.paymentMethod;
      writeDb(dbNow);
      return json(res,201,record);
    }
    
    if(method==='POST' && p==='/api/product-usage'){
      const b=await parseBody(req);
      const product=db.products.find(x=>x.id===b.productId); if(!product) return json(res,404,{error:'Product not found'});
      const item={id:uid('u'),appointmentId:b.appointmentId,productId:b.productId,quantity:Number(b.quantity)}; db.productUsage.push(item);
      const appt=db.appointments.find(a=>a.id===b.appointmentId); if(appt){
        const usages=db.productUsage.filter(u=>u.appointmentId===appt.id);
        appt.productCost=Number(usages.reduce((sum,u)=>{const p=db.products.find(x=>x.id===u.productId);return sum+(p?productUnitCost(p)*u.quantity:0)},0).toFixed(2));
      }
      writeDb(db); return json(res,201,{...item, calculatedProductCost:appt?.productCost});
    }
    if(method==='POST' && p.startsWith('/api/rescue/') && p.endsWith('/book')){
      const parts=p.split('/'); const openingId=parts[3]; const b=await parseBody(req);
      const opening=db.appointments.find(a=>a.id===openingId && a.status==='open');
      const w=db.waitlist.find(x=>x.id===b.waitlistId); if(!opening||!w) return json(res,404,{error:'Opening or waitlist match not found'});
      const service=db.services.find(s=>s.id===w.serviceId);
      opening.clientId=w.clientId; opening.serviceId=w.serviceId; opening.status='confirmed'; opening.price=service.price; opening.actualDurationMinutes=service.durationMinutes; opening.productCost=service.typicalProductCost;
      w.active=false; writeDb(db);
      return json(res,200,{appointment:{...opening,clientName:clientName(db,opening.clientId),serviceName:serviceName(db,opening.serviceId)}, recoveredRevenue:opening.price});
    }
    if(method==='PATCH' && p.startsWith('/api/appointments/')){
      const id=p.split('/').pop(); const b=await parseBody(req); const a=db.appointments.find(x=>x.id===id); if(!a) return json(res,404,{error:'Appointment not found'});
      Object.assign(a,b); writeDb(db); return json(res,200,a);
    }
    return json(res,404,{error:'Not found'});
  } catch(e){ return json(res,400,{error:e.message||'Bad request'}); }
}

function serveStatic(req,res,url){
  let rel=url.pathname==='/' ? '/index.html' : url.pathname;
  const file=path.normalize(path.join(PUBLIC,rel));
  if(!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file,(err,data)=>{
    if(err){ res.writeHead(404); return res.end('Not found'); }
    const ext=path.extname(file).toLowerCase();
    const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
    res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'}); res.end(data);
  });
}

const server=http.createServer((req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(url.pathname.startsWith('/api/')) return api(req,res,url);
  return serveStatic(req,res,url);
});
server.listen(PORT,()=>console.log(`OTHERWORK HAIR running at http://localhost:${PORT}`));
