
from sqlalchemy import text

from app.database import engine


def test_connection():
    if engine is None:
        raise RuntimeError(
            "DATABASE_URL is missing from the configuration."
        )

    with engine.connect() as connection:
        result = connection.execute(text("SELECT VERSION()"))
        version = result.scalar_one()

        print("Database connection successful!")
        print(f"MySQL version: {version}")


if __name__ == "__main__":
    test_connection()