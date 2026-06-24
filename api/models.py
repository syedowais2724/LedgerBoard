from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Optional
from datetime import datetime
import uuid

class Transaction(BaseModel):
    transaction_id: str = Field(..., description="Unique UUID for the transaction")
    user_id: str = Field(..., min_length=1, description="Unique identifier for the user")
    amount: float = Field(..., gt=0, description="Transaction amount (must be positive)")
    category: str = Field(..., min_length=1, description="Category of the transaction")
    timestamp: str = Field(..., description="ISO8601 formatted timestamp")

    @field_validator('transaction_id')
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError("transaction_id must be a valid UUID")
        return v

    @field_validator('timestamp')
    @classmethod
    def validate_iso_timestamp(cls, v: str) -> str:
        try:
            # Parse ISO 8601 format. Handle 'Z' suffix.
            cleaned = v.replace('Z', '+00:00')
            datetime.fromisoformat(cleaned)
        except ValueError:
            raise ValueError("timestamp must be a valid ISO8601 string")
        return v

class TransactionResponse(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    category: str
    timestamp: str
    status: str = "success"

class UserSummary(BaseModel):
    user_id: str
    total_amount: float
    transaction_count: int
    average_transaction: float
    top_category: str
    category_breakdown: Dict[str, float]
    first_transaction: str
    last_transaction: str

class RankingItem(BaseModel):
    rank: int
    user_id: str
    score: float
    total_amount: float
    transaction_count: int
    consistency_score: float
    diversity_score: float
