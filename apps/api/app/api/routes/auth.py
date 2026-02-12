from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel, EmailStr, constr

from app.db.session import get_db
from app.models.user import User
from app.services.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterIn(BaseModel):
    email: EmailStr
    # bcrypt ограничен 72 bytes => ограничим безопасно на 64 символа
    password: constr(min_length=8, max_length=64)


class LoginIn(BaseModel):
    email: EmailStr
    password: constr(min_length=8, max_length=64)


@router.post("/register")
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    exists = db.scalar(select(User).where(User.email == payload.email))
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {"access_token": token}


@router.post("/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return {"access_token": token}
