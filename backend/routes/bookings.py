# ============================================================
# BusGo — Bookings Router (routes/bookings.py)
# POST   /bookings        — create a booking
# GET    /bookings/user/{uid} — get user's bookings
# DELETE /bookings/{id}   — cancel a booking
# ============================================================

from fastapi import APIRouter, HTTPException, Header
from firebase_admin_setup import get_firestore_client, verify_firebase_token
from models.schemas import BookingCreate, BookingResponse
from google.cloud import firestore as fs
from typing import List, Optional
import uuid

router = APIRouter()


def _get_current_user(authorization: Optional[str]):
    """Extract & verify Firebase ID token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = authorization.split("Bearer ")[1]
    try:
        return verify_firebase_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token.")


@router.post("", response_model=dict, status_code=201)
def create_booking(
    booking: BookingCreate,
    authorization: Optional[str] = Header(None),
):
    """
    Create a new bus booking.
    Requires Firebase Auth token in Authorization header.
    """
    decoded = _get_current_user(authorization)

    # Ensure the userId matches the authenticated user
    if decoded["uid"] != booking.userId:
        raise HTTPException(status_code=403, detail="User ID mismatch.")

    try:
        db  = get_firestore_client()
        ref = db.collection("bookings").document()  # auto-generated ID

        data = booking.dict()
        data["createdAt"] = fs.SERVER_TIMESTAMP

        ref.set(data)

        # Also update the bus's booked seats count (best-effort)
        try:
            bus_ref = db.collection("buses").document(booking.busId)
            bus_ref.update({
                "bookedSeats": fs.Increment(len(booking.seats))
            })
        except Exception:
            pass  # Non-critical

        return {"bookingId": ref.id, "status": "confirmed"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Booking failed: {str(e)}")


@router.get("/user/{uid}", response_model=List[dict])
def get_user_bookings(
    uid: str,
    authorization: Optional[str] = Header(None),
):
    """Fetch all bookings for an authenticated user."""
    decoded = _get_current_user(authorization)
    if decoded["uid"] != uid:
        raise HTTPException(status_code=403, detail="Access denied.")

    try:
        db   = get_firestore_client()
        docs = (
            db.collection("bookings")
            .where("userId", "==", uid)
            .order_by("createdAt", direction=fs.Query.DESCENDING)
            .stream()
        )
        bookings = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            # Convert Firestore timestamp to string
            if "createdAt" in data and hasattr(data["createdAt"], "isoformat"):
                data["createdAt"] = data["createdAt"].isoformat()
            bookings.append(data)
        return bookings

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{booking_id}", status_code=200)
def cancel_booking(
    booking_id: str,
    authorization: Optional[str] = Header(None),
):
    """Cancel a booking (set status to 'cancelled')."""
    decoded = _get_current_user(authorization)

    try:
        db  = get_firestore_client()
        ref = db.collection("bookings").document(booking_id)
        doc = ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Booking not found.")

        data = doc.to_dict()
        if data.get("userId") != decoded["uid"]:
            raise HTTPException(status_code=403, detail="Not your booking.")

        ref.update({"status": "cancelled"})
        return {"message": "Booking cancelled successfully."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
