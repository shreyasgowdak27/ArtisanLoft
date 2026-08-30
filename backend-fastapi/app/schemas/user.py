from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserSignup(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=1)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    phone: str | None = None
    city: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
