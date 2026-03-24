# ============================================================
# BusGo — Pydantic Models / Schemas (models/schemas.py)
# ============================================================

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Passenger(BaseModel):
    name:   str
    age:    int
    gender: str
    seat:   str


class ContactInfo(BaseModel):
    name:  str
    phone: str
    email: str


class BusInfo(BaseModel):
    """Snapshot of bus details stored inside a booking."""
    operator:   Optional[str] = None
    from_city:  Optional[str] = Field(None, alias="from")
    to_city:    Optional[str] = Field(None, alias="to")
    date:       Optional[str] = None
    departure:  Optional[str] = None
    arrival:    Optional[str] = None
    type:       Optional[str] = None
    price:      Optional[float] = None

    class Config:
        populate_by_name = True


class BookingCreate(BaseModel):
    busId:      str
    userId:     str
    passengers: List[Passenger]
    seats:      List[str]
    contact:    ContactInfo
    totalPrice: float
    status:     Optional[str] = "confirmed"
    busInfo:    Optional[dict] = None


class BookingResponse(BaseModel):
    bookingId:  str
    busId:      str
    userId:     str
    passengers: List[Passenger]
    seats:      List[str]
    contact:    ContactInfo
    totalPrice: float
    status:     str
    busInfo:    Optional[dict] = None
    createdAt:  Optional[str] = None


class BusResult(BaseModel):
    id:          str
    operator:    str
    from_city:   str = Field(..., alias="from")
    to_city:     str = Field(..., alias="to")
    date:        str
    departure:   str
    arrival:     str
    duration:    Optional[str] = "9h"
    totalSeats:  int
    bookedSeats: Optional[int] = 0
    price:       float
    type:        str
    rating:      Optional[float] = 4.0

    class Config:
        populate_by_name = True
