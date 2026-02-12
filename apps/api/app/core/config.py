from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_access_minutes: int = 60
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
