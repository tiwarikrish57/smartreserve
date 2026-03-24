"""
BusGo — Firestore Seed Data Script (seed_data.py)
==================================================
Run this ONCE to populate your Firestore with sample bus routes.

Usage:
    python seed_data.py

Requirements:
    - serviceAccountKey.json must be in the backend/ folder
    - firebase-admin must be installed: pip install firebase-admin
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from firebase_admin_setup import get_firestore_client
from datetime import date, timedelta


def get_next_dates(n=7):
    """Returns next n dates as YYYY-MM-DD strings."""
    today = date.today()
    return [(today + timedelta(days=i)).isoformat() for i in range(1, n + 1)]


ROUTES = [
    ("Hyderabad",  "Pune"),
    ("Hyderabad",  "Bangalore"),
    ("Mumbai",     "Pune"),
    ("Bangalore",  "Chennai"),
    ("Delhi",      "Jaipur"),
    ("Hyderabad",  "Chennai"),
    ("Mumbai",     "Goa"),
    ("Bangalore",  "Goa"),
]

BUS_TEMPLATES = [
    {"operator": "BusGo Express",        "departure": "21:00", "arrival": "06:00+1", "duration": "9h",  "totalSeats": 40, "price": 650,  "type": "AC Sleeper",          "rating": 4.5},
    {"operator": "Sharma Travels",       "departure": "22:30", "arrival": "07:30+1", "duration": "9h",  "totalSeats": 36, "price": 499,  "type": "Non-AC Seater",       "rating": 4.1},
    {"operator": "VRL Travels",          "departure": "20:00", "arrival": "05:00+1", "duration": "9h",  "totalSeats": 45, "price": 850,  "type": "Volvo AC Multi-Axle", "rating": 4.8},
    {"operator": "SRS Travels",          "departure": "23:00", "arrival": "08:00+1", "duration": "9h",  "totalSeats": 40, "price": 550,  "type": "AC Seater",           "rating": 4.3},
    {"operator": "Orange Tours & Travels","departure": "19:30", "arrival": "04:30+1", "duration": "9h", "totalSeats": 48, "price": 750,  "type": "Sleeper Cum Seater",  "rating": 4.6},
    {"operator": "Greenline Travels",    "departure": "18:00", "arrival": "03:00+1", "duration": "9h",  "totalSeats": 52, "price": 450,  "type": "Non-AC Sleeper",      "rating": 3.9},
]


def seed():
    db    = get_firestore_client()
    buses = db.collection("buses")
    dates = get_next_dates(7)

    count = 0
    for (from_city, to_city) in ROUTES:
        for travel_date in dates:
            for template in BUS_TEMPLATES:
                doc_data = {
                    **template,
                    "from": from_city,
                    "to":   to_city,
                    "date": travel_date,
                    "bookedSeats": 0,
                }
                buses.add(doc_data)
                count += 1
                print(f"  ✅ Added: {from_city} → {to_city} | {travel_date} | {template['operator']}")

    print(f"\n🎉 Done! Seeded {count} bus records into Firestore.")
    print("   Note: Firestore indices for 'from', 'to', 'date' will be auto-created on first query.")


if __name__ == "__main__":
    print("BusGo — Firestore Seed Script")
    print("=" * 40)
    seed()
