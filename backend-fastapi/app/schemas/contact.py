"""Pydantic schemas for contact message validation and responses."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactMessageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Customer name")
    email: EmailStr = Field(..., max_length=255, description="Customer valid email address")
    message: str = Field(..., min_length=10, max_length=1000, description="Message between 10 and 1000 characters")
    honeypot: str | None = Field(default=None, description="Hidden honeypot field for bot rejection")


class ContactMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str
    message: str
    created_at: datetime

