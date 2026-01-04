from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# Minimal Pydantic schemas expected by the REST API


class UserCreate(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    password: str
    name: Optional[str] = None
    terms_accepted: bool = False
    privacy_accepted: bool = False


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: Optional[str] = None
    name: Optional[str] = None
    is_active: bool = False
    is_email_verified: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None


# ==================== LEAK ANALYSIS SCHEMAS ====================

class FinancialLeakResponse(BaseModel):
    """Represents a single detected financial leak"""
    pattern_id: int = Field(description="Database ID of the spending pattern")
    merchant_hint: str = Field(description="Merchant name/identity from spending pattern")
    leak_probability: float = Field(description="Confidence score from 0.0 to 1.0")
    leak_category: str = Field(description="Type of leak: unused_subscription, excessive_habit, impulse_spending, etc.")
    reasoning: str = Field(description="Why this is considered a financial leak")
    actionable_step: str = Field(description="Clear advice on how to stop or reduce this leak")
    estimated_annual_saving: float = Field(description="Estimated annual savings if leak is fixed")

    class Config:
        from_attributes = True


class LeakAnalysisResponseSchema(BaseModel):
    """Complete leak analysis response"""
    leaks: List[FinancialLeakResponse]
    total_estimated_annual_saving: float = Field(description="Sum of all potential annual savings")
    analysis_timestamp: str = Field(description="ISO timestamp of when analysis was performed")
    confidence_level: str = Field(description="Overall confidence: high, medium, low")


class LeakInsightDB(BaseModel):
    """Leak insight stored in database"""
    id: int
    user_id: int
    pattern_id: int
    leak_category: str
    leak_probability: float
    reasoning: str
    actionable_step: str
    estimated_annual_saving: float
    analysis_timestamp: datetime
    is_resolved: bool = False
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Minimal Strawberry GraphQL schema so `main.py` can mount a GraphQL endpoint.
# Keep it tiny to avoid creating heavy dependencies in code paths that only need the schema variable.
try:
    import strawberry

    @strawberry.type
    class Query:
        @strawberry.field
        def hello(self) -> str:
            return "Hello from GraphQL"

    schema = strawberry.Schema(query=Query)
except Exception:
    # If strawberry is not installed in the environment where this import runs,
    # provide a fallback `schema` value to avoid ImportError at import-time.
    schema = None
