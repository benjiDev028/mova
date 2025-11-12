# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.payment_route import router as payment_router
from app.api.driver_earning_route import router as driver_earning_router


app = FastAPI(title="Payment Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
async def root():
    return {"message": "Payment Service en ligne ✅"}

app.include_router(payment_router, prefix="/payments", tags=["Payments"])
app.include_router(driver_earning_router, tags=["Driver Earnings"])
