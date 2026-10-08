
from fastapi import FastAPI

from app.api.vehicles import router as vehicles_router
from app.api.drivers import router as drivers_router
from app.api.trips import router as trips_router
from app.api.maintenance import router as maintenance_router
from app.api.fuel_logs import router as fuel_logs_router
from app.api.expenses import router as expenses_router
from app.api.roles import router as roles_router
from app.api.users import router as users_router

app = FastAPI(title="FleetFlow API")

app.include_router(vehicles_router)
app.include_router(drivers_router)
app.include_router(trips_router)
app.include_router(maintenance_router)
app.include_router(fuel_logs_router)
app.include_router(expenses_router)
app.include_router(roles_router)
app.include_router(users_router)


@app.get("/")
def home():
    return {"message": "Welcome to FleetFlow!"}