// ============================================================
// BusGo — Authentication Module (js/auth.js)
// Handles: Sign Up, Sign In, Google Login, Sign Out
// ============================================================

// ---- Toast Notification Helper ----
function showToast(message, type = 'info') {
  let toast = document.getElementById('busgo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'busgo-toast';
    document.body.appendChild(toast);
  }
  toast.className = `busgo-toast busgo-toast--${type}`;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ---- Sign Up with Email & Password ----
async function signUpWithEmail(name, email, password) {
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    // Save user profile to Firestore
    await db.collection('users').doc(cred.user.uid).set({
      name,
      email,
      phone: '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast(`Welcome to BusGo, ${name}! 🎉`, 'success');
    return cred.user;
  } catch (err) {
    showToast(friendlyAuthError(err.code), 'error');
    throw err;
  }
}

// ---- Sign In with Email & Password ----
async function signInWithEmail(email, password) {
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    showToast(`Welcome back, ${cred.user.displayName || 'traveler'}! 👋`, 'success');
    return cred.user;
  } catch (err) {
    showToast(friendlyAuthError(err.code), 'error');
    throw err;
  }
}

// ---- Sign In with Google ----
async function signInWithGoogle() {
  try {
    // signInWithPopup works on localhost/hosted — preferred
    const result = await auth.signInWithPopup(googleProvider);
    const user   = result.user;

    // Create Firestore profile on first Google login
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
      await db.collection('users').doc(user.uid).set({
        name: user.displayName || '',
        email: user.email,
        phone: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    showToast(`Welcome, ${user.displayName}! 🎉`, 'success');
    return user;

  } catch (err) {
    // If popup was blocked OR domain is unauthorized, fall back to redirect
    if (err.code === 'auth/popup-blocked' ||
        err.code === 'auth/unauthorized-domain' ||
        err.code === 'auth/operation-not-supported-in-this-environment') {
      // Redirect flow works on file:// and popup-blocked browsers
      try {
        await auth.signInWithRedirect(googleProvider);
        return; // page will reload after redirect
      } catch (redirectErr) {
        showToast(friendlyAuthError(redirectErr.code), 'error');
        throw redirectErr;
      }
    }
    showToast(friendlyAuthError(err.code), 'error');
    throw err;
  }
}

// ---- Handle redirect result on page load ----
// Call this once on every page that uses auth to catch Google redirect result
async function handleGoogleRedirectResult() {
  try {
    const result = await auth.getRedirectResult();
    if (result && result.user) {
      const user = result.user;
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
        await db.collection('users').doc(user.uid).set({
          name: user.displayName || '',
          email: user.email,
          phone: '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      showToast(`Welcome, ${user.displayName}! 🎉`, 'success');
      // Redirect to home or the page they were trying to visit
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      if (redirect) window.location.href = redirect;
      else if (window.location.pathname.includes('auth.html')) window.location.href = 'index.html';
    }
  } catch (err) {
    if (err.code) showToast(friendlyAuthError(err.code), 'error');
  }
}

// ---- Sign Out ----
async function signOutUser() {
  await auth.signOut();
  showToast('You have been signed out. Safe travels! 👋', 'info');
  window.location.href = 'index.html';
}

// ---- Get Current User's ID Token (for API calls) ----
async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

// ---- Human-friendly error messages ----
function friendlyAuthError(code) {
  const messages = {
    'auth/email-already-in-use':   'This email is already registered. Please sign in.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/popup-closed-by-user':   'Google sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-blocked':          'Popup was blocked. Trying redirect method...',
    'auth/unauthorized-domain':    'Domain not authorized. Use localhost or run: python -m http.server 8080',
    'auth/operation-not-supported-in-this-environment':
                                   'Open via a web server (not file://). Run: python -m http.server 8080',
  };
  return messages[code] || `Auth error: ${code}`;
}

// ---- Update Navbar Based on Auth State ----
function initNavbarAuth() {
  auth.onAuthStateChanged((user) => {
    const accountEl  = document.getElementById('nav-account');
    const signoutEl  = document.getElementById('nav-signout');
    const bookingsEl = document.getElementById('nav-bookings');

    if (user) {
      if (accountEl)  accountEl.textContent  = user.displayName || user.email.split('@')[0];
      if (signoutEl)  signoutEl.style.display = 'inline-block';
      if (bookingsEl) bookingsEl.style.display = 'inline-block';
    } else {
      if (accountEl)  accountEl.textContent  = 'Account';
      if (signoutEl)  signoutEl.style.display = 'none';
      if (bookingsEl) bookingsEl.style.display = 'none';
    }
  });
}

// ---- Guard: Redirect to auth if not logged in ----
function requireAuth(redirectTo = 'auth.html') {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        window.location.href = `${redirectTo}?redirect=${encodeURIComponent(window.location.href)}`;
        reject(new Error('Not authenticated'));
      }
    });
  });
}
