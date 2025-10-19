# app/api/booking_route.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.schemas.booking import BookingCreate, BookingResponse
from app.services.booking_service import (create_booking,get_booking_by_user,get_passengers_by_trip,)
from app.db.schemas.booking import (    BookingCreate, BookingResponse,  BookingCancelRequest, BookingCancelResponse,  CompleteByTripRequest, CompleteByTripResponse,)
from app.services.booking_service import (create_booking,get_booking_by_user,get_passengers_by_trip,get_booking_by_id,list_bookings_by_driver,cancel_booking,complete_by_trip,)

router = APIRouter()

@router.post("/create_booking", response_model=BookingResponse)
async def create_booking_endpoint(data: BookingCreate,db: AsyncSession = Depends(get_db)):
   
    return await create_booking(db, data)

@router.get("/by_user/{user_id}", response_model=List[BookingResponse])
async def get_booking_by_user_endpoint(user_id: UUID,db: AsyncSession = Depends(get_db),):
   
    return await get_booking_by_user(db, user_id)

@router.get("/passengers_by_trip/{trip_id}", response_model=List[BookingResponse])
async def get_passengers_by_trip_endpoint(trip_id: UUID,db: AsyncSession = Depends(get_db),):
   
    return await get_passengers_by_trip(db, trip_id)


@router.post("/", response_model=BookingResponse)
async def create_booking_endpoint(data: BookingCreate, db: AsyncSession = Depends(get_db)):
    return await create_booking(db, data)

@router.get("/get_booking_by_id/{booking_id}", response_model=BookingResponse)
async def get_booking_by_id_endpoint(booking_id: UUID, db: AsyncSession = Depends(get_db)):
    return await get_booking_by_id(db, booking_id)

@router.get("/get_booking_by_user_id/{user_id}", response_model=List[BookingResponse])
async def get_booking_by_user_endpoint(user_id: UUID, db: AsyncSession = Depends(get_db)):
    return await get_booking_by_user(db, user_id)

@router.get("/get_booking_by_driver_id/{driver_id}", response_model=List[BookingResponse])
async def list_bookings_by_driver_endpoint(driver_id: UUID, db: AsyncSession = Depends(get_db)):
    
    return await list_bookings_by_driver(db, driver_id)

@router.get("/get_passengers_by_trip/{trip_id}", response_model=List[BookingResponse])
async def list_bookings_by_trip_endpoint(trip_id: UUID, db: AsyncSession = Depends(get_db)):
    # alias de passengers_by_trip
    return await get_passengers_by_trip(db, trip_id)

@router.patch("/{booking_id}/cancel", response_model=BookingCancelResponse)
async def cancel_booking_endpoint(booking_id: UUID,body: BookingCancelRequest,db: AsyncSession = Depends(get_db),):
    
    return await cancel_booking(db, booking_id, body)

@router.patch("/complete_by_trip/{trip_id}", response_model=CompleteByTripResponse)
async def complete_by_trip_endpoint(trip_id: UUID,body: CompleteByTripRequest,db: AsyncSession = Depends(get_db),):
    
    return await complete_by_trip(db, trip_id, body)
