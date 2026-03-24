// ============================================================
// BusGo — Booking Module (js/booking.js)
// Handles: Seat map rendering, passenger form, booking API
// ============================================================

let selectedSeats  = [];
let busData        = null;
let busId          = null;

// ---- Initialize Booking Page ----
async function initBookingPage() {
  const params = new URLSearchParams(window.location.search);
  busId = params.get('busId');

  // Load bus data from sessionStorage (set by search page)
  const stored = sessionStorage.getItem('selectedBus');
  busData = stored ? JSON.parse(stored) : null;

  if (!busData || !busId) {
    showToast('No bus selected. Redirecting...', 'error');
    setTimeout(() => window.history.back(), 1500);
    return;
  }

  // Display route info
  document.getElementById('book-route')?.setAttribute('textContent',
    `${busData.from} → ${busData.to}`);
  const routeEl = document.getElementById('book-route');
  if (routeEl) routeEl.textContent = `${busData.from} → ${busData.to}`;
  const operEl = document.getElementById('book-operator');
  if (operEl) operEl.textContent = busData.operator;
  const typeEl = document.getElementById('book-type');
  if (typeEl) typeEl.textContent = busData.type;
  const timeEl = document.getElementById('book-time');
  if (timeEl) timeEl.textContent = `${busData.departure} → ${busData.arrival}`;
  const priceEl = document.getElementById('base-price');
  if (priceEl) priceEl.textContent = `₹${busData.price}`;

  renderSeatMap(busData.totalSeats, busData.bookedSeats || []);
  setupPassengerForm();
}

// ---- Render Seat Map ----
function renderSeatMap(totalSeats, bookedSeatNumbers) {
  const container = document.getElementById('seat-map');
  if (!container) return;

  // Generate random booked seats from count if only count is given
  let booked = Array.isArray(bookedSeatNumbers)
    ? bookedSeatNumbers
    : generateRandomBooked(totalSeats, typeof bookedSeatNumbers === 'number' ? bookedSeatNumbers : 12);

  const seatsPerRow = 4; // 2+2 layout
  const rows = Math.ceil(totalSeats / seatsPerRow);

  let html = `
    <div class="seat-legend">
      <span class="seat-demo available">Available</span>
      <span class="seat-demo booked">Booked</span>
      <span class="seat-demo selected">Selected</span>
    </div>
    <div class="seat-grid-header">
      <span>A</span><span>B</span><span class="aisle"></span><span>C</span><span>D</span>
    </div>
    <div class="seat-grid">`;

  for (let row = 1; row <= rows; row++) {
    const seatLetters = ['A', 'B', null, 'C', 'D'];
    html += `<div class="seat-row"><span class="row-num">${row}</span>`;
    seatLetters.forEach(letter => {
      if (!letter) { html += `<span class="aisle"></span>`; return; }
      const seatNum = `${row}${letter}`;
      const seatIdx = (row - 1) * seatsPerRow + ['A','B','C','D'].indexOf(letter) + 1;
      if (seatIdx > totalSeats) { html += `<span class="seat empty"></span>`; return; }
      const isBooked = booked.includes(seatNum) || booked.includes(seatIdx);
      html += `
        <button class="seat ${isBooked ? 'booked' : 'available'}"
          id="seat-${seatNum}"
          data-seat="${seatNum}"
          ${isBooked ? 'disabled' : ''}
          onclick="toggleSeat('${seatNum}')">
          ${seatNum}
        </button>`;
    });
    html += `</div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

function generateRandomBooked(total, count) {
  const nums = [];
  while (nums.length < count) {
    const row = Math.ceil(Math.random() * Math.ceil(total / 4));
    const letter = ['A','B','C','D'][Math.floor(Math.random() * 4)];
    const s = `${row}${letter}`;
    if (!nums.includes(s)) nums.push(s);
  }
  return nums;
}

// ---- Toggle Seat Selection ----
function toggleSeat(seatNum) {
  const btn = document.getElementById(`seat-${seatNum}`);
  if (!btn || btn.disabled) return;

  if (selectedSeats.includes(seatNum)) {
    selectedSeats = selectedSeats.filter(s => s !== seatNum);
    btn.classList.remove('selected');
    btn.classList.add('available');
  } else {
    if (selectedSeats.length >= 6) {
      showToast('Maximum 6 seats per booking.', 'error');
      return;
    }
    selectedSeats.push(seatNum);
    btn.classList.remove('available');
    btn.classList.add('selected');
  }
  updatePriceSummary();
  updatePassengerForms();
}

// ---- Price Summary ----
function updatePriceSummary() {
  const count        = selectedSeats.length;
  const subtotal     = count * (busData?.price || 0);
  const serviceFee   = Math.round(subtotal * 0.05);
  const total        = subtotal + serviceFee;

  const el = id => document.getElementById(id);
  if (el('selected-seats-display'))  el('selected-seats-display').textContent = selectedSeats.join(', ') || '—';
  if (el('seat-count'))              el('seat-count').textContent = count;
  if (el('subtotal'))                el('subtotal').textContent = `₹${subtotal}`;
  if (el('service-fee'))             el('service-fee').textContent = `₹${serviceFee}`;
  if (el('total-price'))             el('total-price').textContent = `₹${total}`;
  if (el('confirm-btn'))             el('confirm-btn').disabled = count === 0;
}

// ---- Dynamic Passenger Forms ----
function updatePassengerForms() {
  const container = document.getElementById('passenger-forms');
  if (!container) return;

  const existing = container.querySelectorAll('.passenger-form').length;

  // Add new forms
  for (let i = existing; i < selectedSeats.length; i++) {
    const form = document.createElement('div');
    form.className = 'passenger-form';
    form.dataset.index = i;
    form.innerHTML = `
      <h4>Passenger ${i + 1} — Seat ${selectedSeats[i]}</h4>
      <div class="form-row">
        <div class="form-group">
          <label>Full Name *</label>
          <input type="text" id="pax-name-${i}" placeholder="Enter name" required>
        </div>
        <div class="form-group">
          <label>Age *</label>
          <input type="number" id="pax-age-${i}" placeholder="Age" min="1" max="120" required>
        </div>
        <div class="form-group">
          <label>Gender *</label>
          <select id="pax-gender-${i}">
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>`;
    container.appendChild(form);
  }

  // Remove extras if seats deselected
  while (container.querySelectorAll('.passenger-form').length > selectedSeats.length) {
    container.removeChild(container.lastChild);
  }

  // Update seat labels on existing forms
  container.querySelectorAll('.passenger-form').forEach((form, i) => {
    const h4 = form.querySelector('h4');
    if (h4) h4.textContent = `Passenger ${i + 1} — Seat ${selectedSeats[i]}`;
  });
}

function setupPassengerForm() {
  // Contact info is shown statically in HTML
  const confirmBtn = document.getElementById('confirm-btn');
  if (confirmBtn) confirmBtn.addEventListener('click', submitBooking);
  updatePriceSummary(); // Initialize with 0 seats
}

// ---- Submit Booking ----
async function submitBooking() {
  if (selectedSeats.length === 0) {
    showToast('Please select at least one seat.', 'error');
    return;
  }

  // Gather passenger data
  const passengers = [];
  for (let i = 0; i < selectedSeats.length; i++) {
    const name   = document.getElementById(`pax-name-${i}`)?.value.trim();
    const age    = document.getElementById(`pax-age-${i}`)?.value;
    const gender = document.getElementById(`pax-gender-${i}`)?.value;
    if (!name || !age || !gender) {
      showToast(`Please complete passenger ${i + 1}'s details.`, 'error');
      return;
    }
    passengers.push({ name, age: parseInt(age), gender, seat: selectedSeats[i] });
  }

  const contactName  = document.getElementById('contact-name')?.value.trim();
  const contactPhone = document.getElementById('contact-phone')?.value.trim();
  const contactEmail = document.getElementById('contact-email')?.value.trim();
  if (!contactName || !contactPhone || !contactEmail) {
    showToast('Please fill in contact details.', 'error');
    return;
  }

  const user  = auth.currentUser;
  if (!user) {
    showToast('Please log in to confirm your booking.', 'error');
    setTimeout(() => window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.href), 1500);
    return;
  }

  const confirmBtn = document.getElementById('confirm-btn');
  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Processing...'; }

  try {
    const token = await user.getIdToken();
    const subtotal   = selectedSeats.length * busData.price;
    const serviceFee = Math.round(subtotal * 0.05);
    const totalPrice = subtotal + serviceFee;

    const bookingData = {
      busId,
      userId:   user.uid,
      passengers,
      seats:    selectedSeats,
      contact:  { name: contactName, phone: contactPhone, email: contactEmail },
      totalPrice,
      status:   'confirmed',
      busInfo:  busData
    };

    // Try FastAPI first, fallback to direct Firestore
    let bookingId;
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      bookingId = data.bookingId;
    } catch {
      // Direct Firestore write as fallback
      const ref = await db.collection('bookings').add({
        ...bookingData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      bookingId = ref.id;
    }

    // Show success
    sessionStorage.setItem('lastBookingId', bookingId);
    sessionStorage.setItem('lastBookingData', JSON.stringify({ ...bookingData, bookingId }));
    window.location.href = `booking-success.html?id=${bookingId}`;
  } catch (err) {
    console.error('Booking error:', err);
    showToast('Booking failed. Please try again.', 'error');
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'CONFIRM BOOKING'; }
  }
}

// Helper shorthand
const id = (x) => document.getElementById(x);
