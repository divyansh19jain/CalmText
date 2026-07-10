"""Stripe payment gateway (sandbox / test mode).

Flow:
  1. Signed-in user picks a plan  -> POST /create-checkout-session
  2. We create (or reuse) a Stripe customer and open a hosted Checkout page
     in `subscription` mode, then redirect the browser to it.
  3. On success Stripe redirects back to the web app with `?checkout=success&
     session_id=...`; the frontend calls POST /verify to confirm and unlock.
  4. Stripe also calls POST /webhook (source of truth) to grant/revoke access
     as subscriptions are created, renewed, or cancelled.

Use TEST keys (sk_test_..., pk_test_..., whsec_...) until go-live.
"""
import asyncio

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.logging import logger
from app.db.session import get_db
from app.models.user import User
from app.schemas.payment import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    SubscriptionStatusResponse,
    VerifySessionResponse,
    ChangePlanRequest,
    ChangePlanResponse,
)

router = APIRouter()

# Configure the Stripe SDK with the secret (test) key.
stripe.api_key = settings.stripe_secret_key

# Subscription plans. Prices are defined inline (price_data) so no products
# need to be pre-created in the Stripe dashboard for sandbox testing.
# Amounts are in the smallest currency unit (cents).
PLANS = {
    "medium": {"name": "CalmText Medium", "amount": 500},
    "pro": {"name": "CalmText Pro", "amount": 1000},
    "premium": {"name": "CalmText Premium", "amount": 2000},
}
CURRENCY = "usd"


def _require_stripe_configured() -> None:
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=503,
            detail="Payments are not configured. Set STRIPE_SECRET_KEY.",
        )


def _to_plain(obj):
    """Normalize a Stripe object (or already-plain dict) into a plain nested dict.

    Stripe's SDK objects don't support dict.get(), so we convert before using
    .get() on them. `str(stripe_object)` renders JSON, which round-trips into a
    fully-recursive plain dict. Webhook payloads parsed via json.loads are
    already plain dicts (no `to_dict`), so they pass through unchanged.
    """
    if hasattr(obj, "to_dict"):
        import json
        return json.loads(str(obj))
    return obj


async def _get_or_create_customer(db: AsyncSession, user: User) -> str:
    """Return the Stripe customer id for this user, creating one if needed."""
    if user.stripe_customer_id:
        return user.stripe_customer_id

    try:
        customer = await asyncio.to_thread(
            stripe.Customer.create,
            email=user.email,
            name=user.name or user.username or user.email,
            metadata={"user_id": str(user.id)},
        )
    except stripe.error.AuthenticationError as e:  # type: ignore[attr-defined]
        logger.error(f"Stripe auth error (check STRIPE_SECRET_KEY): {e}")
        raise HTTPException(
            status_code=503,
            detail="Payment provider is misconfigured. Please contact support.",
        )
    except stripe.error.StripeError as e:  # type: ignore[attr-defined]
        logger.error(f"Stripe customer creation failed: {e}")
        raise HTTPException(status_code=502, detail="Could not start checkout. Please try again.")

    user.stripe_customer_id = customer["id"]
    await db.commit()
    return customer["id"]


async def _grant_access(db: AsyncSession, user: User, *, plan: str | None,
                        subscription_id: str | None, status: str) -> None:
    user.has_unlimited_search_access = True
    user.subscription_status = status
    if plan:
        user.subscription_plan = plan
    if subscription_id:
        user.stripe_subscription_id = subscription_id
    await db.commit()


async def _revoke_access(db: AsyncSession, user: User, *, status: str) -> None:
    user.has_unlimited_search_access = False
    user.subscription_status = status
    await db.commit()


@router.get("/config")
async def get_config():
    """Public config the frontend needs (publishable key + plan pricing)."""
    return {
        "publishable_key": settings.stripe_publishable_key,
        "plans": PLANS,
        "currency": CURRENCY,
    }


@router.get("/subscription", response_model=SubscriptionStatusResponse)
async def get_subscription(current_user: User = Depends(get_current_user)):
    return SubscriptionStatusResponse(
        has_unlimited_search_access=bool(current_user.has_unlimited_search_access),
        subscription_status=current_user.subscription_status,
        subscription_plan=current_user.subscription_plan,
    )


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    body: CheckoutSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_stripe_configured()

    plan = (body.plan or "pro").lower()
    if plan not in PLANS:
        raise HTTPException(status_code=400, detail=f"Unknown plan '{plan}'.")

    if current_user.has_unlimited_search_access:
        raise HTTPException(status_code=400, detail="You already have an active subscription.")

    plan_cfg = PLANS[plan]
    customer_id = await _get_or_create_customer(db, current_user)
    base = settings.frontend_url.rstrip("/")

    try:
        session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            mode="subscription",
            customer=customer_id,
            line_items=[
                {
                    "price_data": {
                        "currency": CURRENCY,
                        "product_data": {"name": plan_cfg["name"]},
                        "unit_amount": plan_cfg["amount"],
                        "recurring": {"interval": "month"},
                    },
                    "quantity": 1,
                }
            ],
            success_url=f"{base}/?checkout=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base}/?checkout=cancel",
            metadata={"user_id": str(current_user.id), "plan": plan},
            subscription_data={"metadata": {"user_id": str(current_user.id), "plan": plan}},
        )
    except stripe.error.StripeError as e:  # type: ignore[attr-defined]
        logger.error(f"Stripe checkout session creation failed: {e}")
        raise HTTPException(status_code=502, detail="Could not start checkout. Please try again.")

    return CheckoutSessionResponse(checkout_url=session["url"], session_id=session["id"])


@router.post("/change-plan", response_model=ChangePlanResponse)
async def change_plan(
    body: ChangePlanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Switch an active subscription to a different plan (upgrade or downgrade).

    Modifies the existing Stripe subscription in place with proration — the
    saved payment method is charged/credited the prorated difference. No new
    checkout is needed.
    """
    _require_stripe_configured()

    plan = (body.plan or "").lower()
    if plan not in PLANS:
        raise HTTPException(status_code=400, detail=f"Unknown plan '{plan}'.")

    if not current_user.has_unlimited_search_access or not current_user.stripe_subscription_id:
        raise HTTPException(
            status_code=400,
            detail="No active subscription to change. Please subscribe first.",
        )
    if current_user.subscription_plan == plan:
        raise HTTPException(status_code=400, detail=f"You are already on the {plan} plan.")

    plan_cfg = PLANS[plan]
    try:
        sub = _to_plain(
            await asyncio.to_thread(stripe.Subscription.retrieve, current_user.stripe_subscription_id)
        )
        item_id = sub["items"]["data"][0]["id"]

        # Inline pricing: create a Price for the target plan on the fly.
        price = await asyncio.to_thread(
            stripe.Price.create,
            currency=CURRENCY,
            unit_amount=plan_cfg["amount"],
            recurring={"interval": "month"},
            product_data={"name": plan_cfg["name"]},
        )
        await asyncio.to_thread(
            stripe.Subscription.modify,
            current_user.stripe_subscription_id,
            items=[{"id": item_id, "price": price["id"]}],
            # Invoice and charge the prorated difference immediately at upgrade
            # time (instead of rolling it into the next monthly invoice).
            proration_behavior="always_invoice",
            metadata={"user_id": str(current_user.id), "plan": plan},
        )
    except stripe.error.StripeError as e:  # type: ignore[attr-defined]
        logger.error(f"Stripe plan change failed: {e}")
        raise HTTPException(status_code=502, detail="Could not change your plan. Please try again.")

    current_user.subscription_plan = plan
    await db.commit()
    logger.info(f"User {current_user.id} changed plan to {plan}")

    return ChangePlanResponse(
        success=True,
        subscription_plan=plan,
        subscription_status=current_user.subscription_status or "active",
    )


@router.post("/verify", response_model=VerifySessionResponse)
async def verify_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Confirm a checkout session after redirect and unlock access.

    Acts as a fallback so access is granted even when webhooks aren't reachable
    (e.g. local sandbox testing without the Stripe CLI).
    """
    _require_stripe_configured()

    try:
        session_obj = await asyncio.to_thread(stripe.checkout.Session.retrieve, session_id)
    except stripe.error.StripeError as e:  # type: ignore[attr-defined]
        logger.error(f"Stripe session retrieve failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid checkout session.")

    session = _to_plain(session_obj)
    metadata = session.get("metadata") or {}

    # Guard: the session must belong to the calling user.
    if str(metadata.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="This session does not belong to you.")

    paid = session.get("payment_status") == "paid" or session.get("status") == "complete"
    if paid:
        await _grant_access(
            db,
            current_user,
            plan=metadata.get("plan"),
            subscription_id=session.get("subscription"),
            status="active",
        )

    return VerifySessionResponse(
        success=paid,
        has_unlimited_search_access=bool(current_user.has_unlimited_search_access),
        subscription_plan=current_user.subscription_plan,
    )


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Stripe -> our server events (source of truth for granting/revoking)."""
    _require_stripe_configured()
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        if settings.stripe_webhook_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        else:
            # No signing secret configured (dev only): parse without verifying.
            import json
            event = json.loads(payload)
    except (ValueError, stripe.error.SignatureVerificationError) as e:  # type: ignore[attr-defined]
        logger.error(f"Stripe webhook signature/parse error: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook payload.")

    # Normalize to a plain nested dict so .get() works everywhere below.
    event = _to_plain(event)
    event_type = event["type"]
    obj = event["data"]["object"]

    async def _user_by_customer(customer_id):
        if not customer_id:
            return None
        res = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
        return res.scalar_one_or_none()

    if event_type == "checkout.session.completed":
        user_id = (obj.get("metadata") or {}).get("user_id")
        user = None
        if user_id:
            res = await db.execute(select(User).where(User.id == int(user_id)))
            user = res.scalar_one_or_none()
        user = user or await _user_by_customer(obj.get("customer"))
        if user:
            await _grant_access(
                db, user,
                plan=(obj.get("metadata") or {}).get("plan"),
                subscription_id=obj.get("subscription"),
                status="active",
            )
            logger.info(f"Subscription activated for user {user.id}")

    elif event_type in ("customer.subscription.updated", "customer.subscription.created"):
        user = await _user_by_customer(obj.get("customer"))
        if user:
            status = obj.get("status", "active")
            # active/trialing → full access; past_due → keep access during
            # Stripe's automatic retry (dunning) grace period.
            if status in ("active", "trialing", "past_due"):
                await _grant_access(
                    db, user, plan=user.subscription_plan,
                    subscription_id=obj.get("id"), status=status,
                )
            else:  # canceled, unpaid, incomplete_expired, ...
                await _revoke_access(db, user, status=status)

    elif event_type in ("invoice.payment_succeeded", "invoice.paid"):
        # Fires on every successful charge, including automatic monthly
        # renewals — keep the subscription active for another period.
        user = await _user_by_customer(obj.get("customer"))
        if user and obj.get("subscription"):
            await _grant_access(
                db, user, plan=user.subscription_plan,
                subscription_id=obj.get("subscription"), status="active",
            )
            reason = obj.get("billing_reason")
            logger.info(f"Invoice paid for user {user.id} (reason={reason})")

    elif event_type == "invoice.payment_failed":
        # A renewal charge failed. Stripe will retry per its dunning settings;
        # mark past_due but keep access until the subscription is truly ended
        # (customer.subscription.deleted / unpaid).
        user = await _user_by_customer(obj.get("customer"))
        if user:
            user.subscription_status = "past_due"
            await db.commit()
            logger.warning(f"Renewal payment failed for user {user.id} (past_due)")

    elif event_type == "customer.subscription.deleted":
        user = await _user_by_customer(obj.get("customer"))
        if user:
            await _revoke_access(db, user, status="canceled")
            logger.info(f"Subscription ended for user {user.id}")

    return {"received": True}
