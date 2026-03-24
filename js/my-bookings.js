// ============================================================
// BusGo — My Bookings Module (js/my-bookings.js)
// ============================================================

async function loadMyBookings() {
  const user = await requireAuth().catch(() => null);
  if (!user) return;

  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = user.displayName || user.email.split('@')[0];

  const container = document.getElementById('bookings-list');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const token = await user.getIdToken();
    let bookings = [];

    try {
      const res = await fetch(`${API_BASE}/bookings/user/${user.uid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API fail');
      bookings = await res.json();
    } catch {
      // Fallback: query Firestore directly
      const snap = await db.collection('bookings')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get();
      snap.forEach(doc => bookings.push({ id: doc.id, ...doc.data() }));
    }

    renderBookings(bookings);
  } catch (err) {
    console.error('loadMyBookings error:', err);
    container.innerHTML = `<div class="error-box">Failed to load bookings. Please refresh.</div>`;
  }
}

function renderBookings(bookings) {
  const container = document.getElementById('bookings-list');
  if (!container) return;

  if (bookings.length === 0) {
    container.innerHTML = `
      <div class="no-bookings">
        <div class="no-bookings-icon">🎫</div>
        <h3>No bookings yet</h3>
        <p>Book your first bus ticket and it will appear here.</p>
        <a href="index.html" class="btn-primary">Search Buses</a>
      </div>`;
    return;
  }

  container.innerHTML = bookings.map(booking => {
    const bus = booking.busInfo || {};
    const isUpcoming = new Date((bus.date||booking.date||'')+'T00:00:00') >= new Date();
    const status = booking.status || 'confirmed';
    const sc = status==='cancelled' ? 'status-cancelled' : (isUpcoming ? 'status-upcoming' : 'status-completed');
    const sl = status==='cancelled' ? 'Cancelled' : (isUpcoming ? 'Upcoming' : 'Completed');
    const seats = Array.isArray(booking.seats) ? booking.seats.join(', ') : '—';
    const bookId = booking.id || booking.bookingId || '—';
    return `
      <div class="booking-card">
        <div class="booking-card-head">
          <div class="booking-route">
            ${bus.from||'?'} <span class="route-arrow">→</span> ${bus.to||'?'}
          </div>
          <span class="status-chip ${sc}">${sl}</span>
        </div>
        <div class="booking-card-body">
          <div class="booking-detail"><span>Operator</span><strong>${bus.operator||'—'}</strong></div>
          <div class="booking-detail"><span>Date</span><strong>${bus.date||booking.date||'—'}</strong></div>
          <div class="booking-detail"><span>Departure</span><strong>${bus.departure||'—'} → ${bus.arrival||'—'}</strong></div>
          <div class="booking-detail"><span>Seats</span><strong>${seats}</strong></div>
          <div class="booking-detail"><span>Total Paid</span><strong class="price-highlight">₹${booking.totalPrice||'—'}</strong></div>
          <div class="booking-detail"><span>Booking ID</span><span class="booking-id-val">${bookId}</span></div>
        </div>
        ${status!=='cancelled'&&isUpcoming?`
        <div class="booking-card-foot">
          <button class="btn-cancel" onclick="cancelBooking('${bookId}',this)">Cancel Booking</button>
        </div>`:''}
      </div>`;
  }).join('');
}

async function cancelBooking(bookingId, btn) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;

  btn.disabled = true;
  btn.textContent = 'Cancelling...';

  try {
    const token = await getAuthToken();
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API fail');
    } catch {
      // Fallback: direct Firestore update
      await db.collection('bookings').doc(bookingId).update({ status: 'cancelled' });
    }
    showToast('Booking cancelled successfully.', 'success');
    loadMyBookings(); // Reload
  } catch (err) {
    showToast('Failed to cancel. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Cancel Booking';
  }
}
