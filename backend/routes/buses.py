# ============================================================
# BusGo — Buses Router (routes/buses.py)
# GET /buses/search
# ============================================================

from fastapi import APIRouter, Query, HTTPException
from firebase_admin_setup import get_firestore_client
from typing import List

router = APIRouter()


@router.get("/search")
def search_buses(
    from_city: str = Query(..., alias="from", description="Origin city"),
    to_city:   str = Query(..., alias="to",   description="Destination city"),
    date:      str = Query(...,               description="Travel date YYYY-MM-DD"),
):
    """
    Search available buses for a given route and date.
    Falls back to demo data if Firestore has no results.
    """
    try:
        db = get_firestore_client()
        buses_ref = (
            db.collection("buses")
            .where("from", "==", from_city)
            .where("to",   "==", to_city)
            .where("date", "==", date)
        )
        docs = buses_ref.stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)

        # Fallback: return demo data if nothing in Firestore yet
        if not results:
            results = _demo_buses(from_city, to_city, date)

        return results

    except Exception as e:
        print(f"[BusGo] Search error: {e}")
        # Always return demo data on any backend error
        return _demo_buses(from_city, to_city, date)


@router.get("/{bus_id}")
def get_bus(bus_id: str):
    """Get a single bus document by ID."""
    try:
        db  = get_firestore_client()
        doc = db.collection("buses").document(bus_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Bus not found")
        data = doc.to_dict()
        data["id"] = doc.id
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _demo_buses(from_city: str, to_city: str, date: str) -> List[dict]:
    """Returns demo bus data when Firestore has no matching records."""
    return [
        {
            "id": "demo1", "operator": "BusGo Express",
            "from": from_city, "to": to_city, "date": date,
            "departure": "21:00", "arrival": "06:00+1", "duration": "9h",
            "totalSeats": 40, "bookedSeats": 12, "price": 650,
            "type": "AC Sleeper", "rating": 4.5,
        },
        {
            "id": "demo2", "operator": "Sharma Travels",
            "from": from_city, "to": to_city, "date": date,
            "departure": "22:30", "arrival": "07:30+1", "duration": "9h",
            "totalSeats": 36, "bookedSeats": 20, "price": 499,
            "type": "Non-AC Seater", "rating": 4.1,
        },
        {
            "id": "demo3", "operator": "VRL Travels",
            "from": from_city, "to": to_city, "date": date,
            "departure": "20:00", "arrival": "05:00+1", "duration": "9h",
            "totalSeats": 45, "bookedSeats": 5, "price": 850,
            "type": "Volvo AC Multi-Axle", "rating": 4.8,
        },
        {
            "id": "demo4", "operator": "SRS Travels",
            "from": from_city, "to": to_city, "date": date,
            "departure": "23:00", "arrival": "08:00+1", "duration": "9h",
            "totalSeats": 40, "bookedSeats": 38, "price": 550,
            "type": "AC Seater", "rating": 4.3,
        },
    ]
