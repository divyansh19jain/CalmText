from pydantic import BaseModel
from typing import Optional


class CheckoutSessionRequest(BaseModel):
    """Body for creating a Stripe Checkout session. `plan` selects the tier."""
    plan: str = "pro"


class CheckoutSessionResponse(BaseModel):
    """URL of the hosted Stripe Checkout page to redirect the user to."""
    checkout_url: str
    session_id: str


class SubscriptionStatusResponse(BaseModel):
    has_unlimited_search_access: bool
    subscription_status: Optional[str] = None
    subscription_plan: Optional[str] = None


class VerifySessionResponse(BaseModel):
    """Result of confirming a checkout session after Stripe redirects back."""
    success: bool
    has_unlimited_search_access: bool
    subscription_plan: Optional[str] = None


class ChangePlanRequest(BaseModel):
    """Body for switching an active subscription to a different plan."""
    plan: str


class ChangePlanResponse(BaseModel):
    success: bool
    subscription_plan: str
    subscription_status: Optional[str] = None
