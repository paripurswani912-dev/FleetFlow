
from pydantic import ValidationError

from app.schemas.vehicle import VehicleCreate


def test_valid_vehicle():
    vehicle = VehicleCreate(
        registration_number="GJ05AB1234",
        model="Tata Ace",
        vehicle_type="Mini Truck",
        max_load_capacity=750,
        odometer=12000,
        acquisition_cost=650000,
    )

    assert vehicle.registration_number == "GJ05AB1234"
    assert vehicle.max_load_capacity == 750
    print("PASS: Valid vehicle accepted")


def test_invalid_capacity():
    try:
        VehicleCreate(
            registration_number="GJ05AB5678",
            model="Test Truck",
            vehicle_type="Truck",
            max_load_capacity=0,
            acquisition_cost=500000,
        )
    except ValidationError:
        print("PASS: Invalid capacity rejected")
    else:
        raise AssertionError("Zero capacity should be rejected")


if __name__ == "__main__":
    test_valid_vehicle()
    test_invalid_capacity()