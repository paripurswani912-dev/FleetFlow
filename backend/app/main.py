
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.vehicles import router as vehicles_router
from app.api.drivers import router as drivers_router
from app.api.trips import router as trips_router
from app.api.maintenance import router as maintenance_router
from app.api.fuel_logs import router as fuel_logs_router
from app.api.expenses import router as expenses_router
from app.api.roles import router as roles_router
from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.auth_test import router as auth_test_router
from app.api.vehicle_documents import router as vehicle_documents_router
from app.api.audit_logs import router as audit_logs_router
from app.api.dashboard import router as dashboard_router
from app.api.analytics import router as analytics_router
from app.api.reports import router as reports_router


app = FastAPI(title="FleetFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vehicles_router)
app.include_router(drivers_router)
app.include_router(trips_router)
app.include_router(maintenance_router)
app.include_router(fuel_logs_router)
app.include_router(expenses_router)
app.include_router(roles_router)
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(auth_test_router)
app.include_router(vehicle_documents_router)
app.include_router(audit_logs_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)
app.include_router(reports_router)

@app.get("/")
def home():
    return {"message": "Welcome to FleetFlow!"}