// ============================================================
// BusGo — Train Booking Module (js/train-booking.js)
// Realistic ICF-coach berth map: L/M/U + SL/SU per bay
// ============================================================

const BAYS_PER_COACH = 8;     // 8 compartments per coach
const BERTH_TYPES = ['L','M','U'];  // side berths per bay row
const SIDE_TYPES  = ['SL','SU'];    // side lower/upper per bay

let selectedTrain = null;
let selectedBerths = [];      // ['S1-1-L', 'S1-2-U', …]
let berthStatusMap = {};      // berthId → 'av' | 'bk'
let basePrice = 0;

function initTrainBooking() {
  // Load train data
  selectedTrain = JSON.parse(sessionStorage.getItem('selectedTrain') || 'null');
  const urlParams = new URLSearchParams(location.search);

  if (!selectedTrain) {
    // Build from demo using trainId param
    const tId = urlParams.get('trainId');
    selectedTrain = (typeof DEMO_TRAINS !== 'undefined' ? DEMO_TRAINS : []).find(t => t.id === tId) || null;
    if (!selectedTrain) {
      document.getElementById('tr-book-name').textContent = 'Train not found';
      return;
    }
    const clsCode = urlParams.get('class') || selectedTrain.classes[0]?.code;
    const clsObj  = selectedTrain.classes.find(c => c.code === clsCode) || selectedTrain.classes[0];
    selectedTrain.selectedClass = clsObj;
  }

  // Populate banner
  document.getElementById('tr-book-name').textContent  = selectedTrain.name;
  document.getElementById('tr-book-num').textContent   = `#${selectedTrain.num} · ${selectedTrain.type}`;
  document.getElementById('tr-book-route').textContent = `${selectedTrain.from} → ${selectedTrain.to}`;
  document.getElementById('tr-book-time').textContent  = `${selectedTrain.dep} → ${selectedTrain.arr} · ${selectedTrain.duration}`;
  document.getElementById('tr-book-class').textContent = selectedTrain.selectedClass?.code || '';
  document.getElementById('tr-book-quota').textContent = `Quota: ${urlParams.get('quota') || 'General (GN)'}`;

  basePrice = selectedTrain.selectedClass?.price || 0;

  // Build coach options based on class
  buildCoachSelector(selectedTrain.selectedClass?.code);

  renderBerthMap();
  setupConfirmBtn();
}

function buildCoachSelector(clsCode) {
  const sel = document.getElementById('tr-coach-select');
  if (!sel) return;
  const labels = {
    '1A':'First AC', '2A':'AC 2-Tier', '3A':'AC 3-Tier', 'SL':'Sleeper',
    'CC':'Chair Car', '2S':'2nd Sitting','EC':'Exec Chair'
  };
  const prefix = clsCode === '1A' ? 'A' : clsCode === '2A' ? 'A' : clsCode === '3A' ? 'B' : 'S';
  const label  = labels[clsCode] || clsCode;
  sel.innerHTML = ['1','2','3'].map(n => `<option value="${prefix}${n}">${prefix}${n} — ${label}</option>`).join('');
}

function renderBerthMap() {
  const container = document.getElementById('berth-map');
  if (!container) return;
  const coach = document.getElementById('tr-coach-select')?.value || 'S1';
  berthStatusMap = generateBerthStatus(coach);
  let html = '';
  for (let bay = 1; bay <= BAYS_PER_COACH; bay++) {
    html += `<div class="tr-bay">
      <div class="tr-bay-label">Bay ${bay}</div>
      <div class="tr-bay-inner">
        <div class="tr-bay-row">
          <div class="tr-berths-wrap">`;
    // Main berths: L, M, U
    for (const type of BERTH_TYPES) {
      const id = `${coach}-${bay}-${type}`;
      const st = berthStatusMap[id] || 'av';
      const sel= selectedBerths.includes(id) ? 'sl' : st;
      html += `<div class="tr-b ${sel}" onclick="toggleBerth('${id}')">${type}</div>`;
    }
    html += `</div>
          <div class="tr-aisle"></div>
          <div class="tr-berths-wrap">`;
    // Side berths: SL, SU
    for (const type of SIDE_TYPES) {
      const id = `${coach}-${bay}-${type}`;
      const st = berthStatusMap[id] || 'av';
      const sel= selectedBerths.includes(id) ? 'sl' : st;
      html += `<div class="tr-b ${sel}" onclick="toggleBerth('${id}')">${type}</div>`;
    }
    html += `</div></div></div></div>`;
  }
  container.innerHTML = html;
  updateBerthSummary();
}

function generateBerthStatus(coach) {
  const map = {};
  const seed = coach.charCodeAt(0) + coach.charCodeAt(1);
  for (let bay = 1; bay <= BAYS_PER_COACH; bay++) {
    [...BERTH_TYPES, ...SIDE_TYPES].forEach((type, i) => {
      const id = `${coach}-${bay}-${type}`;
      // pseudo-random but deterministic booked ~30%
      map[id] = ((seed + bay * 7 + i * 3) % 10 < 3) ? 'bk' : 'av';
    });
  }
  return map;
}

function toggleBerth(berthId) {
  const status = berthStatusMap[berthId];
  if (status === 'bk') { showToast('This berth is already booked.', 'error'); return; }
  if (selectedBerths.includes(berthId)) {
    selectedBerths = selectedBerths.filter(b => b !== berthId);
  } else {
    if (selectedBerths.length >= 6) { showToast('Max 6 berths per booking.', 'error'); return; }
    selectedBerths.push(berthId);
  }
  renderBerthMap();       // re-render map
  updatePassengerForms();
  updatePriceSummary();
}

function updateBerthSummary() {
  const el = document.getElementById('selected-berths-display');
  if (!el) return;
  el.textContent = selectedBerths.length ? selectedBerths.join(', ') : 'None';
}

function updatePassengerForms() {
  const container = document.getElementById('passenger-forms');
  if (!container) return;
  if (!selectedBerths.length) {
    container.innerHTML = '<p class="no-seat-msg">Select berths above to fill passenger details.</p>';
    return;
  }
  container.innerHTML = selectedBerths.map((berth, idx) => `
    <div class="tr-pax">
      <div class="tr-pax-h"><span class="material-icons" style="font-size:16px">person</span> Passenger ${idx + 1} — Berth ${berth}</div>
      <div class="tr-f-row">
        <div class="tr-fg"><label>Full Name *</label><input type="text" id="pax-name-${idx}" placeholder="As on ID card"></div>
        <div class="tr-fg" style="max-width:80px"><label>Age *</label><input type="number" id="pax-age-${idx}" min="1" max="120" placeholder="25"></div>
        <div class="tr-fg" style="max-width:110px"><label>Gender *</label>
          <select id="pax-gender-${idx}">
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <div class="tr-fg" style="max-width:140px"><label>ID Type</label>
          <select id="pax-id-${idx}">
            <option>Aadhaar</option><option>PAN Card</option><option>Passport</option><option>Voter ID</option>
          </select>
        </div>
        <div class="tr-fg"><label>ID Number</label><input type="text" id="pax-idnum-${idx}" placeholder="XXXX XXXX XXXX"></div>
      </div>
    </div>`).join('');
}

function updatePriceSummary() {
  const n  = selectedBerths.length;
  const sub = n * basePrice;
  const fee = Math.round(sub * 0.018); // IRCTC ~1.8% convenience
  const tot = sub + fee;

  setText('seat-count', n);
  setText('base-price', `₹${basePrice}`);
  setText('subtotal',   `₹${sub}`);
  setText('service-fee',`₹${fee}`);
  setText('total-price',`₹${tot}`);

  const btn = document.getElementById('confirm-btn');
  if (btn) btn.disabled = n === 0;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setupConfirmBtn() {
  const btn = document.getElementById('confirm-btn');
  if (!btn) return;
  btn.addEventListener('click', confirmTrainBooking);
}

async function confirmTrainBooking() {
  if (!selectedBerths.length) { showToast('Select at least one berth.', 'error'); return; }

  // Validate passenger forms
  for (let i = 0; i < selectedBerths.length; i++) {
    const name = document.getElementById(`pax-name-${i}`)?.value.trim();
    const age  = document.getElementById(`pax-age-${i}`)?.value;
    if (!name || !age) { showToast(`Fill details for Passenger ${i+1}.`, 'error'); return; }
  }

  const cName  = document.getElementById('contact-name')?.value.trim();
  const cPhone = document.getElementById('contact-phone')?.value.trim();
  if (!cName || !cPhone) { showToast('Please fill contact information.', 'error'); return; }

  const btn = document.getElementById('confirm-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-icons" style="animation:spin .7s linear infinite;font-size:18px">autorenew</span> Processing…';

  const passengers = selectedBerths.map((berth, i) => ({
    berth,
    name:   document.getElementById(`pax-name-${i}`)?.value.trim(),
    age:    document.getElementById(`pax-age-${i}`)?.value,
    gender: document.getElementById(`pax-gender-${i}`)?.value,
    idType: document.getElementById(`pax-id-${i}`)?.value,
    idNum:  document.getElementById(`pax-idnum-${i}`)?.value.trim(),
  }));

  const n    = selectedBerths.length;
  const sub  = n * basePrice;
  const fee  = Math.round(sub * 0.018);
  const tot  = sub + fee;
  const pnr  = generatePNR();

  const bookingData = {
    pnr, type:'train',
    trainId:   selectedTrain.id,
    trainName: selectedTrain.name,
    trainNum:  selectedTrain.num,
    from: selectedTrain.from, to: selectedTrain.to,
    dep:  selectedTrain.dep,  arr: selectedTrain.arr,
    date: new URLSearchParams(location.search).get('date') || '',
    selectedClass: selectedTrain.selectedClass?.code,
    coach: document.getElementById('tr-coach-select')?.value,
    berths: selectedBerths,
    passengers,
    contact: { name: cName, phone: cPhone, email: document.getElementById('contact-email')?.value.trim() },
    totalPrice: tot, basePrice, serviceFee: fee,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  try {
    // Try Firestore
    if (typeof auth !== 'undefined' && auth.currentUser && typeof db !== 'undefined') {
      const token = await auth.currentUser.getIdToken();
      try {
        const res = await fetch(`${typeof API_BASE !== 'undefined' ? API_BASE : ''}/bookings/train`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(bookingData),
        });
        if (!res.ok) throw new Error('API fail');
        const resp = await res.json();
        bookingData.bookingId = resp.id || pnr;
      } catch {
        const ref = await db.collection('train_bookings').add({
          ...bookingData, userId: auth.currentUser.uid
        });
        bookingData.bookingId = ref.id;
      }
    } else {
      bookingData.bookingId = pnr;
    }

    sessionStorage.setItem('lastTrainBooking', JSON.stringify(bookingData));
    location.href = `train-success.html?pnr=${pnr}`;
  } catch(err) {
    console.error('Train booking error:', err);
    showToast('Booking failed. Please try again.', 'error');
    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons" style="font-size:18px">confirmation_number</span> CONFIRM BOOKING';
  }
}

function generatePNR() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function showToast(msg, type = 'info') {
  const el = document.getElementById('busgo-toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `busgo-toast busgo-toast--${type} show`;
  setTimeout(() => el.classList.remove('show'), 3200);
}
