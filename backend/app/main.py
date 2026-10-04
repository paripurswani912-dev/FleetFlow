
from fastapi import FastAPI

from app.api.vehicles import router as vehicles_router
from app.api.drivers import router as drivers_router
from app.api.trips import router as trips_router

app = FastAPI(title="FleetFlow API")

app.include_router(vehicles_router)
app.include_router(drivers_router)
app.include_router(trips_router)


@app.get("/")
def home():
    return {"message": "Welcome to FleetFlow!"}