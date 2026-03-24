// ============================================================
// BusGo — Search Module (js/search.js)
// Handles: City autocomplete, Search form, API bus listing
// ============================================================

// Popular Indian cities for autocomplete
const CITIES = [
  "Hyderabad", "Pune", "Mumbai", "Bangalore", "Chennai",
  "Delhi", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow",
  "Nagpur", "Bhopal", "Indore", "Surat", "Vadodara",
  "Visakhapatnam", "Coimbatore", "Kochi", "Thiruvananthapuram",
  "Mysore", "Mangalore", "Hubli", "Belgaum", "Aurangabad",
  "Nashik", "Navi Mumbai", "Thane", "Goa", "Shirdi",
  "Tirupati", "Vijayawada", "Guntur", "Warangal", "Kakinada"
];

// ---- Setup city autocomplete inputs ----
function setupCityAutocomplete(inputId, dropdownId) {
  const input    = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    dropdown.innerHTML = '';
    if (query.length < 1) { dropdown.style.display = 'none'; return; }

    const matches = CITIES.filter(c => c.toLowerCase().startsWith(query));
    if (matches.length === 0) { dropdown.style.display = 'none'; return; }

    matches.forEach(city => {
      const item = document.createElement('div');
      item.className = 'city-dropdown-item';
      item.textContent = city;
      item.addEventListener('click', () => {
        input.value = city;
        dropdown.style.display = 'none';
        // Update the primary-text display
        const display = document.getElementById(inputId + '-display');
        if (display) display.textContent = city;
      });
      dropdown.appendChild(item);
    });
    dropdown.style.display = 'block';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

// ---- Handle Search Form Submission ----
function handleSearchForm() {
  const form = document.getElementById('search-form');
  if (!form) return;

  // Set today's date as default
  const dateInput = document.getElementById('travel-date');
  if (dateInput && !dateInput.value) {
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
    dateInput.min = today.toISOString().split('T')[0];
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fromCity = document.getElementById('from-city').value.trim();
    const toCity   = document.getElementById('to-city').value.trim();
    const date     = document.getElementById('travel-date').value;

    if (!fromCity || !toCity || !date) {
      showToast('Please fill in all search fields.', 'error');
      return;
    }
    if (fromCity.toLowerCase() === toCity.toLowerCase()) {
      showToast('Origin and destination cannot be the same!', 'error');
      return;
    }

    // Navigate to results page
    const params = new URLSearchParams({ from: fromCity, to: toCity, date });
    window.location.href = `search-results.html?${params.toString()}`;
  });
}

// ---- Swap from/to cities ----
function handleSwapCities() {
  const swapBtn = document.getElementById('swap-cities');
  if (!swapBtn) return;
  swapBtn.addEventListener('click', () => {
    const fromInput = document.getElementById('from-city');
    const toInput   = document.getElementById('to-city');
    const fromDisp  = document.getElementById('from-city-display');
    const toDisp    = document.getElementById('to-city-display');
    if (!fromInput || !toInput) return;
    [fromInput.value, toInput.value] = [toInput.value, fromInput.value];
    if (fromDisp && toDisp) {
      [fromDisp.textContent, toDisp.textContent] = [toDisp.textContent, fromDisp.textContent];
    }
  });
}

// ============================================================
// SEARCH RESULTS PAGE
// ============================================================

let allBuses = [];

async function loadSearchResults() {
  const params   = new URLSearchParams(window.location.search);
  const fromCity = params.get('from') || '';
  const toCity   = params.get('to')   || '';
  const date     = params.get('date') || '';

  // Update headings
  const routeEl = document.getElementById('route-heading');
  if (routeEl) routeEl.textContent = `${fromCity} → ${toCity}`;
  const dateEl = document.getElementById('date-heading');
  if (dateEl) dateEl.textContent = formatDate(date);

  // Pre-fill modify-search fields
  const fromIn = document.getElementById('from-city');
  const toIn   = document.getElementById('to-city');
  const dateIn = document.getElementById('travel-date');
  if (fromIn) fromIn.value = fromCity;
  if (toIn)   toIn.value   = toCity;
  if (dateIn) dateIn.value = date;

  showBusListSkeleton();

  try {
    const response = await fetch(
      `${API_BASE}/buses/search?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}&date=${date}`
    );
    if (!response.ok) throw new Error('API error');
    allBuses = await response.json();
  } catch (err) {
    console.error('BusGo fetch error:', err);
    // Fallback: use demo data so the UI is never empty
    allBuses = getDemoBuses(fromCity, toCity, date);
  }

  renderBusList(allBuses);
  setupFilters();
}

function getDemoBuses(from, to, date) {
  return [
    { id:'demo1', operator:'BusGo Express', from, to, date, departure:'21:00', arrival:'06:00+1',
      duration:'9h', totalSeats:40, bookedSeats:12, price:650, type:'AC Sleeper', rating:4.5 },
    { id:'demo2', operator:'Sharma Travels', from, to, date, departure:'22:30', arrival:'07:30+1',
      duration:'9h', totalSeats:36, bookedSeats:20, price:499, type:'Non-AC Seater', rating:4.1 },
    { id:'demo3', operator:'VRL Travels', from, to, date, departure:'20:00', arrival:'05:00+1',
      duration:'9h', totalSeats:45, bookedSeats:5, price:850, type:'Volvo AC Multi-Axle', rating:4.8 },
    { id:'demo4', operator:'SRS Travels', from, to, date, departure:'23:00', arrival:'08:00+1',
      duration:'9h', totalSeats:40, bookedSeats:38, price:550, type:'AC Seater', rating:4.3 },
  ];
}

function showBusListSkeleton() {
  const container = document.getElementById('bus-list');
  if (!container) return;
  container.innerHTML = Array(3).fill(0).map(() => `
    <div class="bus-card skeleton">
      <div class="skeleton-line w-40"></div>
      <div class="skeleton-line w-60"></div>
      <div class="skeleton-line w-80"></div>
    </div>`).join('');
}

function renderBusList(buses) {
  const container = document.getElementById('bus-list');
  const countEl   = document.getElementById('bus-count');
  if (!container) return;

  if (countEl) countEl.textContent = `${buses.length} bus${buses.length !== 1 ? 'es' : ''} found`;

  if (buses.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <img src="https://s3.rdbuz.com/web/images/homeV2/AboutUs/rydePop.svg" alt="No buses">
        <h3>No buses available</h3>
        <p>Try a different date or route.</p>
      </div>`;
    return;
  }

  container.innerHTML = buses.map(bus => {
    const seatsLeft  = bus.totalSeats - (bus.bookedSeats || 0);
    const seatsClass = seatsLeft <= 5 ? 'seats-low' : 'seats-ok';
    const filled = Math.round(bus.rating || 4);
    const stars  = '★'.repeat(filled) + '☆'.repeat(5 - filled);
    return `
      <div class="bus-card" data-id="${bus.id}" data-type="${bus.type}" data-price="${bus.price}">
        <div class="bus-card-top">
          <div class="bus-operator">
            <div class="bus-icon-wrap">🚌</div>
            <div>
              <div class="bus-op-name">${bus.operator}</div>
              <span class="bus-type-chip">${bus.type}</span>
            </div>
          </div>
          <div class="bus-rating"><span class="stars">${stars}</span>&nbsp;<span>${bus.rating || '4.0'}</span></div>
        </div>
        <div class="bus-card-body">
          <div class="bus-timing">
            <div class="time-block">
              <div class="time-big">${bus.departure}</div>
              <div class="time-city">${bus.from}</div>
            </div>
            <div class="duration-wrap">
              <div class="dur-line"></div>
              <div class="dur-text">${bus.duration || '9h'}</div>
            </div>
            <div class="time-block">
              <div class="time-big">${bus.arrival}</div>
              <div class="time-city">${bus.to}</div>
            </div>
          </div>
          <div class="bus-price-block">
            <div class="bus-price">₹${bus.price}</div>
            <div class="${seatsClass}">${seatsLeft} seats left</div>
            <button class="select-seats-btn" onclick="goToBooking('${bus.id}')">Select Seats</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function goToBooking(busId) {
  const params = new URLSearchParams(window.location.search);
  params.set('busId', busId);
  // Store bus data in sessionStorage so booking page can use it
  const bus = allBuses.find(b => b.id === busId);
  sessionStorage.setItem('selectedBus', JSON.stringify(bus));
  window.location.href = `booking.html?${params.toString()}`;
}

// ---- Filters ----
function setupFilters() {
  ['filter-ac', 'filter-sleeper', 'filter-seater', 'filter-price'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', applyFilters);
  });
  const sortEl = document.getElementById('sort-by');
  if (sortEl) sortEl.addEventListener('change', applyFilters);
}

function applyFilters() {
  let filtered = [...allBuses];

  // Type filters
  const wantsAC      = document.getElementById('filter-ac')?.checked;
  const wantsSleeper = document.getElementById('filter-sleeper')?.checked;
  const wantsSeater  = document.getElementById('filter-seater')?.checked;

  if (wantsAC || wantsSleeper || wantsSeater) {
    filtered = filtered.filter(b => {
      const t = b.type.toLowerCase();
      return (wantsAC && t.includes('ac')) ||
             (wantsSleeper && t.includes('sleeper')) ||
             (wantsSeater && t.includes('seater'));
    });
  }

  // Price filter
  const maxPrice = parseInt(document.getElementById('filter-price')?.value || 9999);
  filtered = filtered.filter(b => b.price <= maxPrice);

  // Sort
  const sort = document.getElementById('sort-by')?.value;
  if (sort === 'price-asc')  filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  if (sort === 'departure')  filtered.sort((a, b) => a.departure.localeCompare(b.departure));
  if (sort === 'rating')     filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  renderBusList(filtered);
}

// ---- Utility ----
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}
