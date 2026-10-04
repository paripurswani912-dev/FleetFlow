
from fastapi import FastAPI

from app.api.vehicles import router as vehicles_router

app = FastAPI(title="FleetFlow API")

app.include_router(vehicles_router)


@app.get("/")
def home():
    return {"message": "Welcome to FleetFlow!"}