// ============================================================
// BusGo — Train Module (js/train.js)
// Station autocomplete, demo data, search results rendering
// ============================================================

const INDIAN_STATIONS = [
  {code:'NDLS',name:'New Delhi'},     {code:'BCT',name:'Mumbai Central'},
  {code:'MAS',name:'Chennai Central'},{code:'HWH',name:'Howrah Junction'},
  {code:'SBC',name:'Bengaluru City'}, {code:'HYB',name:'Hyderabad Deccan'},
  {code:'SC',name:'Secunderabad'},    {code:'PUNE',name:'Pune Junction'},
  {code:'ADI',name:'Ahmedabad'},      {code:'LJN',name:'Lucknow'},
  {code:'KOTA',name:'Kota Junction'}, {code:'JP',name:'Jaipur Junction'},
  {code:'CNB',name:'Kanpur Central'}, {code:'PNBE',name:'Patna Junction'},
  {code:'BBS',name:'Bhubaneswar'},    {code:'GHY',name:'Guwahati'},
  {code:'CDG',name:'Chandigarh'},     {code:'LDH',name:'Ludhiana'},
  {code:'BPL',name:'Bhopal Junction'},{code:'NGP',name:'Nagpur Junction'},
  {code:'VSKP',name:'Visakhapatnam'}, {code:'TVC',name:'Thiruvananthapuram'},
  {code:'COK',name:'Ernakulam Jn'},   {code:'MYS',name:'Mysuru Junction'},
  {code:'UDZ',name:'Udaipur City'},   {code:'MMCT',name:'Mumbai'},
  {code:'DLI',name:'Delhi Junction'}, {code:'AGC',name:'Agra Cantt'},
  {code:'BSB',name:'Varanasi'},       {code:'SUR',name:'Solapur'},
  {code:'ALD',name:'Prayagraj'},      {code:'INDB',name:'Indore Junction'},
];

// ─── Demo Train DATA ─────────────────────────────────────────
const DEMO_TRAINS = [
  {id:'t1',name:'Rajdhani Express',num:'12951',type:'Rajdhani',
   from:'New Delhi',to:'Mumbai Central',dep:'17:00',arr:'08:15+1',duration:'15h 15m',
   runDays:['M','T','W','T','F','S','S'].map((_,i)=>i<6),
   classes:[
     {code:'1A',name:'First AC',price:4580,avail:8},
     {code:'2A',name:'Second AC',price:2695,avail:24},
     {code:'3A',name:'Third AC',price:1920,avail:62},
   ]},
  {id:'t2',name:'Shatabdi Express',num:'12001',type:'Shatabdi',
   from:'New Delhi',to:'Ahmedabad',dep:'06:25',arr:'13:25',duration:'7h 00m',
   runDays:[true,true,true,true,true,true,false],
   classes:[
     {code:'CC',name:'Chair Car',price:1215,avail:40},
     {code:'EC',name:'Exec Chair',price:2330,avail:12},
   ]},
  {id:'t3',name:'Duronto Express',num:'12213',type:'Express',
   from:'Mumbai Central',to:'New Delhi',dep:'23:25',arr:'16:15+1',duration:'16h 50m',
   runDays:[true,false,true,false,true,false,true],
   classes:[
     {code:'1A',name:'First AC',price:4890,avail:4},
     {code:'2A',name:'Second AC',price:2820,avail:18},
     {code:'3A',name:'Third AC',price:1990,avail:55},
     {code:'SL',name:'Sleeper',price:545,avail:210},
   ]},
  {id:'t4',name:'Hyderabad Express',num:'18501',type:'Express',
   from:'Hyderabad Deccan',to:'Pune Junction',dep:'21:10',arr:'07:40+1',duration:'10h 30m',
   runDays:[true,true,true,true,true,true,true],
   classes:[
     {code:'2A',name:'Second AC',price:1450,avail:22},
     {code:'3A',name:'Third AC',price:960,avail:75},
     {code:'SL',name:'Sleeper',price:345,avail:180},
     {code:'2S',name:'2nd Sitting',price:195,avail:60},
   ]},
  {id:'t5',name:'Karnataka Express',num:'12627',type:'Express',
   from:'New Delhi',to:'Bengaluru City',dep:'20:30',arr:'05:30+2',duration:'33h 00m',
   runDays:[true,true,true,true,true,true,true],
   classes:[
     {code:'2A',name:'Second AC',price:2895,avail:10},
     {code:'3A',name:'Third AC',price:1840,avail:48},
     {code:'SL',name:'Sleeper',price:490,avail:254},
   ]},
  {id:'t6',name:'Tejas Express',num:'82501',type:'Express',
   from:'Mumbai Central',to:'Ahmedabad',dep:'06:40',arr:'12:25',duration:'5h 45m',
   runDays:[true,false,true,false,true,true,false],
   classes:[
     {code:'CC',name:'Chair Car',price:1030,avail:52},
     {code:'EC',name:'Exec Chair',price:1870,avail:20},
   ]},
  {id:'t7',name:'Intercity Express',num:'14041',type:'Intercity',
   from:'New Delhi',to:'Lucknow',dep:'07:15',arr:'13:30',duration:'6h 15m',
   runDays:[true,true,true,true,true,true,true],
   classes:[
     {code:'CC',name:'Chair Car',price:485,avail:96},
     {code:'2S',name:'2nd Sitting',price:210,avail:144},
   ]},
  {id:'t8',name:'Vande Bharat Express',num:'20801',type:'Shatabdi',
   from:'Bengaluru City',to:'Chennai Central',dep:'05:50',arr:'10:55',duration:'5h 05m',
   runDays:[true,true,true,true,true,true,false],
   classes:[
     {code:'CC',name:'Chair Car',price:1295,avail:36},
     {code:'EC',name:'Exec Chair',price:2465,avail:14},
   ]},
];

const POPULAR_ROUTES = [
  {from:'New Delhi',to:'Mumbai Central',trains:12},
  {from:'New Delhi',to:'Bengaluru City',trains:8},
  {from:'Mumbai Central',to:'Chennai Central',trains:7},
  {from:'Hyderabad Deccan',to:'Pune Junction',trains:10},
  {from:'Howrah Junction',to:'New Delhi',trains:14},
  {from:'New Delhi',to:'Lucknow',trains:18},
];

let allTrains = [];
const params = new URLSearchParams(location.search);

// ─── Station Autocomplete ─────────────────────────────────────
function trStationAC(inputId, dropId) {
  const inp = document.getElementById(inputId);
  const drop = document.getElementById(dropId);
  if (!inp || !drop) return;
  const val = inp.value.toLowerCase();
  if (!val) { drop.style.display = 'none'; return; }
  const matches = INDIAN_STATIONS.filter(s =>
    s.name.toLowerCase().includes(val) || s.code.toLowerCase().includes(val)
  ).slice(0, 8);
  if (!matches.length) { drop.style.display = 'none'; return; }
  drop.innerHTML = matches.map(s => `
    <div class="tr-drop-item" onclick="selectStation('${inputId}','${dropId}','${s.name}')">
      <span class="material-icons" style="font-size:16px;color:#7c3aed">train</span>
      <div><strong>${s.name}</strong> <span style="font-family:monospace;font-size:11px;color:rgba(255,255,255,.4)">${s.code}</span></div>
    </div>`).join('');
  drop.style.display = 'block';
}

function selectStation(inputId, dropId, name) {
  const inp = document.getElementById(inputId);
  const drop = document.getElementById(dropId);
  if (inp) inp.value = name;
  if (drop) drop.style.display = 'none';
}

function swapTrainStations() {
  const f = document.getElementById('tr-from');
  const t = document.getElementById('tr-to');
  if (f && t) { const tmp = f.value; f.value = t.value; t.value = tmp; }
}

// Close dropdowns on outside click
document.addEventListener('click', e => {
  document.querySelectorAll('.tr-drop').forEach(d => {
    if (!d.contains(e.target) && !e.target.matches('input')) d.style.display = 'none';
  });
});

// ─── Results ─────────────────────────────────────────────────
function loadTrainResults() {
  const from = params.get('from') || '';
  const to   = params.get('to') || '';
  const date = params.get('date') || '';
  const cls  = params.get('class') || '';

  // Populate topbar
  const fi = document.getElementById('tr-from');
  const ti = document.getElementById('tr-to');
  const di = document.getElementById('tr-date');
  const ci = document.getElementById('tr-class');
  if (fi) fi.value = from;
  if (ti) ti.value = to;
  if (di) { di.value = date; di.min = new Date().toISOString().split('T')[0]; }
  if (ci && cls) ci.value = cls;

  const rh = document.getElementById('tr-route-heading');
  const dh = document.getElementById('tr-date-heading');
  if (rh) rh.textContent = from && to ? `${from} → ${to}` : 'All Trains';
  if (dh && date) {
    const d = new Date(date + 'T00:00:00');
    dh.textContent = d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  }

  const list = document.getElementById('train-list');
  if (!list) return;
  list.innerHTML = '<div class="tr-spinner"></div>';

  setTimeout(() => {
    let trains = DEMO_TRAINS;
    // Filter by class if specified
    if (cls) trains = trains.filter(t => t.classes.some(c => c.code === cls));
    allTrains = trains;
    renderTrainList(trains);
    setupTrainFilters();
  }, 900); // simulate loading
}

function renderTrainList(trains) {
  const list   = document.getElementById('train-list');
  const countEl = document.getElementById('tr-count');
  if (!list) return;
  if (countEl) countEl.textContent = `${trains.length} train${trains.length !== 1 ? 's' : ''} found`;

  if (!trains.length) {
    list.innerHTML = `<div style="text-align:center;padding:80px;color:var(--tr-muted)">
      <span class="material-icons" style="font-size:64px;color:rgba(255,255,255,.1);display:block;margin-bottom:12px">train</span>
      <h3 style="font-size:20px;font-weight:700;margin-bottom:8px">No trains found</h3>
      <p>Try a different route or date.</p></div>`;
    return;
  }

  const days = ['M','T','W','T','F','S','S'];
  list.innerHTML = trains.map((train, idx) => `
    <div class="tr-train-card" style="animation-delay:${idx * 0.07}s">
      <div class="tr-tc-head">
        <div class="tr-tc-name">
          <div class="tr-tc-icon">🚂</div>
          <div>
            <div class="tr-tc-title">${train.name}</div>
            <div class="tr-tc-num">#${train.num} · ${train.type}</div>
          </div>
        </div>
        <div class="tr-run-wrap">
          ${days.map((d,i) => `<div class="tr-day ${train.runDays[i] ? 'on' : ''}">${d}</div>`).join('')}
        </div>
      </div>
      <div class="tr-tc-body">
        <div class="tr-tc-timing">
          <div class="tr-t-block">
            <div class="tr-t-time">${train.dep}</div>
            <div class="tr-t-stn">${train.from}</div>
          </div>
          <div class="tr-t-dur">
            <div class="tr-t-dur-lbl">${train.duration}</div>
            <div class="tr-t-line">
              <div class="tr-t-dot tr-t-dot-l"></div>
              <div class="tr-t-dot tr-t-dot-r"></div>
            </div>
          </div>
          <div class="tr-t-block">
            <div class="tr-t-time">${train.arr}</div>
            <div class="tr-t-stn">${train.to}</div>
          </div>
        </div>
        <div class="tr-classes" id="cls-${train.id}">
          ${train.classes.map(c => {
            const avCls = c.avail === 0 ? 'tr-avail-wl' : (c.avail <= 10 ? 'tr-avail-low' : 'tr-avail-ok');
            const avLabel = c.avail === 0 ? 'WL' : `${c.avail} avail`;
            return `<div class="tr-cls-btn" onclick="selectClass('${train.id}','${c.code}',${c.price},this)">
              <span class="tr-cls-label">${c.code}</span>
              <span class="tr-cls-price">₹${c.price}</span>
              <span class="tr-cls-avail ${avCls}">${avLabel}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="tr-tc-footer">
        <button class="tr-book-now-btn" id="book-btn-${train.id}" onclick="goToTrainBooking('${train.id}')" style="display:none">
          <span class="material-icons" style="font-size:16px">confirmation_number</span> Book Now
        </button>
      </div>
    </div>`).join('');
}

let selectedClass = {};
function selectClass(trainId, code, price, el) {
  // Deselect others in same train
  document.querySelectorAll(`#cls-${trainId} .tr-cls-btn`).forEach(b => b.classList.remove('picked'));
  el.classList.add('picked');
  selectedClass[trainId] = { code, price };
  const btn = document.getElementById(`book-btn-${trainId}`);
  if (btn) btn.style.display = 'flex';
}

function goToTrainBooking(trainId) {
  const train = allTrains.find(t => t.id === trainId);
  const cls   = selectedClass[trainId] || train.classes[0];
  sessionStorage.setItem('selectedTrain', JSON.stringify({ ...train, selectedClass: cls }));
  const p = new URLSearchParams(params);
  p.set('trainId', trainId);
  p.set('class', cls.code);
  location.href = `train-booking.html?${p.toString()}`;
}

function setupTrainFilters() {
  ['sort-trains','f-rajdhani','f-shatabdi','f-express','f-intercity','f-morning','f-afternoon','f-night'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', applyTrainFilters);
  });
}

function applyTrainFilters() {
  let trains = [...allTrains];
  const sort = document.getElementById('sort-trains')?.value || '';
  const fRaj = document.getElementById('f-rajdhani')?.checked;
  const fSha = document.getElementById('f-shatabdi')?.checked;
  const fExp = document.getElementById('f-express')?.checked;
  const fInt = document.getElementById('f-intercity')?.checked;
  const fMorn = document.getElementById('f-morning')?.checked;
  const fAft  = document.getElementById('f-afternoon')?.checked;
  const fNight= document.getElementById('f-night')?.checked;

  const typeFilters = [fRaj&&'Rajdhani',fSha&&'Shatabdi',fExp&&'Express',fInt&&'Intercity'].filter(Boolean);
  if (typeFilters.length) trains = trains.filter(t => typeFilters.includes(t.type));

  const timeFilters = [];
  if (fMorn)  timeFilters.push(h => h >= 6  && h < 12);
  if (fAft)   timeFilters.push(h => h >= 12 && h < 18);
  if (fNight) timeFilters.push(h => h >= 18 && h <= 24);
  if (timeFilters.length) {
    trains = trains.filter(t => {
      const h = parseInt(t.dep.split(':')[0]);
      return timeFilters.some(fn => fn(h));
    });
  }

  if (sort === 'dep') trains.sort((a,b) => a.dep.localeCompare(b.dep));
  else if (sort === 'dur') trains.sort((a,b) => parseDuration(a.duration)-parseDuration(b.duration));
  else if (sort === 'price-asc') trains.sort((a,b) => Math.min(...a.classes.map(c=>c.price)) - Math.min(...b.classes.map(c=>c.price)));
  else if (sort === 'price-desc') trains.sort((a,b) => Math.max(...b.classes.map(c=>c.price)) - Math.max(...a.classes.map(c=>c.price)));

  renderTrainList(trains);
}

function parseDuration(dur) {
  const [h, m] = dur.split('h').map(s => parseInt(s) || 0);
  return h * 60 + m;
}

// ─── Popular routes ───────────────────────────────────────────
function renderPopularRoutes() {
  const el = document.getElementById('popular-routes');
  if (!el) return;
  const today = new Date().toISOString().split('T')[0];
  el.innerHTML = POPULAR_ROUTES.map(r => `
    <div class="tr-panel" onclick="location.href='train-results.html?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}&date=${today}'"
         style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:18px 20px">
      <div>
        <div style="font-weight:700;color:var(--tr-text)">${r.from} → ${r.to}</div>
        <div style="font-size:12px;color:var(--tr-muted);margin-top:3px">${r.trains} trains daily</div>
      </div>
      <span class="material-icons" style="color:#7c3aed">arrow_forward</span>
    </div>`).join('');
}

// ─── Shared Toast ─────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const el = document.getElementById('busgo-toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `busgo-toast busgo-toast--${type} show`;
  setTimeout(() => el.classList.remove('show'), 3200);
}
