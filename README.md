# 🚌🚆 SmartReserve — Smart Bus & Train Ticket Booking System

**SmartReserve** is a full-stack ticket booking web application that lets users search, select seats, and book bus and train tickets online — with real-time data backed by Firebase Firestore and a Python FastAPI backend.

---

## ✨ Features

### 🚌 Bus Booking
- Search buses by source, destination & date
- Live seat map with real-time availability
- Instant booking confirmation with e-ticket
- Exclusive discount offers and promo codes

### 🚆 Train Booking
- Search trains across Indian railways
- Interactive coach/berth selection (Sleeper, AC, General)
- Futuristic dark-themed UI with neon animations
- Booking history and trip management

### 👤 User Authentication
- Google Sign-In via Firebase Auth
- Protected booking flow (login required to book)
- My Trips dashboard to view all bookings

---

## 🛠️ Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | HTML5, CSS3, Vanilla JavaScript          |
| Auth        | Firebase Authentication (Google OAuth)  |
| Database    | Firebase Firestore (real-time)          |
| Backend     | Python FastAPI                          |
| Fonts/Icons | Google Fonts (Roboto), Material Icons   |

---

## 📁 Project Structure

```
smartreserve/
├── index.html              # Bus booking home page
├── train.html              # Train search page
├── search-results.html     # Bus search results
├── train-results.html      # Train search results
├── booking.html            # Bus seat selection & booking
├── train-booking.html      # Train berth selection & booking
├── booking-success.html    # Bus booking confirmation
├── train-success.html      # Train booking confirmation
├── my-bookings.html        # User's trip history
├── auth.html               # Sign In / Sign Up page
├── styles.css              # Bus module styles
├── train-styles.css        # Train module styles
├── js/
│   ├── firebase-config.js  # Firebase initialization
│   ├── auth.js             # Authentication logic
│   ├── search.js           # Bus search logic
│   ├── booking.js          # Bus booking logic
│   ├── train.js            # Train search logic
│   ├── train-booking.js    # Train booking logic
│   └── my-bookings.js      # Booking history logic
└── backend/
    ├── main.py             # FastAPI app entry point
    ├── routes/             # API route handlers
    ├── models/             # Pydantic schemas
    ├── seed_data.py        # Database seeder
    └── requirements.txt    # Python dependencies
```

---

## 🚀 Getting Started

### Frontend (No setup needed)
1. Clone the repository:
   ```bash
   git clone https://github.com/tiwarikrish57/smartreserve.git
   ```
2. Open `index.html` in your browser to launch the app.

### Backend (FastAPI)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in your Firebase credentials.
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

---

## 🔥 Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** → Google Sign-In
3. Enable **Firestore Database**
4. Replace the config in `js/firebase-config.js` with your own Firebase credentials

---

## 📸 Preview

![SmartReserve Preview](screenshot-redbus.gif)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

> Built with ❤️ by [Krishna Tiwari](https://github.com/tiwarikrish57)
