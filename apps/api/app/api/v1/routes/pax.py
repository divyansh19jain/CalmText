from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import time
import asyncio
from app.schemas.pax import PaxAnalyzeRequest, PaxAnalyzeResponse, PaxFeedbackRequest, PaxFeedbackResponse, ClearTextRequest, ClearTextResponse, OwnVoiceRequest, OwnVoiceResponse, PaxCoachRequest, PaxCoachResponse
from app.prompts.pax_variants import CLEARTEXT_V1_PROMPT, OWNVOICE_V1_PROMPT, PAX_COACH_V1_PROMPT
from app.services.pax_service import PaxService
from app.services.feedback_service import FeedbackService
from app.core.dependencies import get_llm_client, get_claude_client, get_optional_user, get_current_user, apply_user_model_tier
from app.core.email_service import send_admin_notification
from app.clients.llm_client import LLMClient
from app.db.session import get_db
from app.models.history import SearchHistory

router = APIRouter()

# Free searches a user gets before they must upgrade
SEARCH_LIMIT = 3

def _check_search_limit(user) -> None:
    """Block the search if a non-unlimited user has used up their free searches.

    Anonymous users (user is None) are not tracked here. Raises 402 on the 4th
    attempt so the frontend can show the payment page.
    """
    if user is None:
        return
    if getattr(user, "has_unlimited_search_access", False):
        return
    if (user.search_count or 0) >= SEARCH_LIMIT:
        raise HTTPException(
            status_code=402,
            detail="Search limit reached. Please upgrade to continue.",
        )

async def _increment_search_count(db: AsyncSession, user) -> None:
    """Count one successful search against a non-unlimited user's allowance."""
    if user is None or getattr(user, "has_unlimited_search_access", False):
        return
    user.search_count = (user.search_count or 0) + 1
    await db.commit()

@router.get("/usage")
async def get_usage(current_user=Depends(get_current_user)):
    """How many free searches the logged-in user has left."""
    unlimited = bool(current_user.has_unlimited_search_access)
    used = current_user.search_count or 0
    return {
        "search_count": used,
        "has_unlimited_search_access": unlimited,
        "limit": SEARCH_LIMIT,
        "remaining": None if unlimited else max(0, SEARCH_LIMIT - used),
    }

async def _notify_admin_quota_exhausted(user=None):
    """Send admin notification about quota exhaustion"""
    try:
        message = "OpenAI API quota has been exhausted"

        # Send email asynchronously without blocking response
        asyncio.create_task(
            send_admin_notification(
                subject="API Quota Exhausted",
                message=message,
            )
        )
    except Exception as e:
        # Log but don't fail if email sending fails
        from app.core.logging import logger
        logger.error(f"Failed to send admin notification: {str(e)}")

async def _save_history(db: AsyncSession, user, result: PaxAnalyzeResponse, request: PaxAnalyzeRequest):
    from sqlalchemy import select, func

    if user is None:
        return

    # Reply gut checks: keep the calming PAXism with the gut check in the
    # stored take, so history/thread views show the full moment.
    pax_text = result.pax
    if result.paxism:
        pax_text = f"{pax_text}\n\n{result.paxism}"

    # Check if this message already exists for this user (case-insensitive match)
    stmt = select(SearchHistory).where(
        SearchHistory.user_id == user.id,
        func.lower(func.trim(SearchHistory.text)) == func.lower(func.trim(request.text))
    )
    query_result = await db.execute(stmt)
    existing_entry = query_result.scalar_one_or_none()

    if existing_entry:
        # Update existing entry with new analysis
        existing_entry.mode = request.mode
        existing_entry.pax = pax_text
        existing_entry.subtext = result.subtext
        if request.conversation_id:
            existing_entry.conversation_id = request.conversation_id
        await db.commit()
    else:
        # Create new entry only if message doesn't exist
        entry = SearchHistory(
            user_id=user.id,
            text=request.text,
            mode=request.mode,
            conversation_id=request.conversation_id,
            pax=pax_text,
            subtext=result.subtext,
        )
        db.add(entry)
        await db.commit()

@router.post("/analyze", response_model=PaxAnalyzeResponse)
async def analyze_pax(
    request: PaxAnalyzeRequest,
    llm_client: LLMClient = Depends(get_llm_client),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    _check_search_limit(current_user)
    apply_user_model_tier(llm_client, current_user)
    try:
        service = PaxService(llm_client)
        result = await service.analyze(request)
        await _save_history(db, current_user, result, request)
        await _increment_search_count(db, current_user)
        return result
    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e).lower()
        if 'insufficient_quota' in error_str or '429' in error_str:
            await _notify_admin_quota_exhausted(current_user)
            raise HTTPException(status_code=429, detail="Something went wrong")
        raise

@router.post("/analyze/claude", response_model=PaxAnalyzeResponse)
async def analyze_claude(
    request: PaxAnalyzeRequest,
    llm_client: LLMClient = Depends(get_claude_client),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    _check_search_limit(current_user)
    apply_user_model_tier(llm_client, current_user)
    try:
        service = PaxService(llm_client)
        result = await service.analyze(request)
        await _save_history(db, current_user, result, request)
        await _increment_search_count(db, current_user)
        return result
    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e).lower()
        if 'insufficient_quota' in error_str or '429' in error_str:
            await _notify_admin_quota_exhausted(current_user)
            raise HTTPException(status_code=429, detail="Something went wrong")
        raise

@router.post("/cleartext", response_model=ClearTextResponse)
async def analyze_cleartext(
    request: ClearTextRequest,
    llm_client: LLMClient = Depends(get_llm_client),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    from sqlalchemy import select, func

    _check_search_limit(current_user)
    apply_user_model_tier(llm_client, current_user)
    start = time.time()
    try:
        feedback, _ = await llm_client.generate_completion(CLEARTEXT_V1_PROMPT, request.text)
    except Exception as e:
        error_str = str(e).lower()
        if 'insufficient_quota' in error_str or '429' in error_str:
            await _notify_admin_quota_exhausted(current_user)
            raise HTTPException(status_code=429, detail="Something went wrong")
        raise
    latency_ms = int((time.time() - start) * 1000)

    # Save to history for signed-in users
    if current_user is not None:
        # Check if this message already exists for this user (case-insensitive match)
        stmt = select(SearchHistory).where(
            SearchHistory.user_id == current_user.id,
            func.lower(func.trim(SearchHistory.text)) == func.lower(func.trim(request.text))
        )
        query_result = await db.execute(stmt)
        existing_entry = query_result.scalar_one_or_none()

        if existing_entry:
            # Update existing entry - append ClearText feedback while preserving previous analysis
            if existing_entry.subtext and existing_entry.subtext.strip():
                existing_entry.subtext = existing_entry.subtext.strip() + f"\n\nClearText:\n{feedback.strip()}"
            else:
                existing_entry.subtext = f"ClearText:\n{feedback.strip()}"
            await db.commit()
        else:
            # Create new entry
            entry = SearchHistory(
                user_id=current_user.id,
                text=request.text,
                mode="cleartext",
                pax=feedback.strip(),
                subtext="",
            )
            db.add(entry)
            await db.commit()

    await _increment_search_count(db, current_user)
    return ClearTextResponse(feedback=feedback.strip(), latency_ms=latency_ms)

@router.post("/voice", response_model=OwnVoiceResponse)
async def write_own_voice(
    request: OwnVoiceRequest,
    llm_client: LLMClient = Depends(get_llm_client),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    _check_search_limit(current_user)
    apply_user_model_tier(llm_client, current_user)
    start = time.time()
    user_text = (
        f"VOICE SAMPLE (how I write):\n{request.voice_sample}\n\n"
        f"INTENT (what I want to say):\n{request.intent}"
    )
    try:
        message, _ = await llm_client.generate_completion(OWNVOICE_V1_PROMPT, user_text)
    except Exception as e:
        error_str = str(e).lower()
        if 'insufficient_quota' in error_str or '429' in error_str:
            await _notify_admin_quota_exhausted(current_user)
            raise HTTPException(status_code=429, detail="Something went wrong")
        raise
    latency_ms = int((time.time() - start) * 1000)
    result = message.strip()

    # Save to history for signed-in users (intent -> text, generated message -> pax)
    if current_user is not None:
        entry = SearchHistory(
            user_id=current_user.id,
            text=request.intent,
            mode="voice",
            pax=result,
            subtext="",
        )
        db.add(entry)
        await db.commit()

    await _increment_search_count(db, current_user)
    return OwnVoiceResponse(message=result, latency_ms=latency_ms)

@router.post("/coach", response_model=PaxCoachResponse)
async def coach_pax(
    request: PaxCoachRequest,
    llm_client: LLMClient = Depends(get_llm_client),
    current_user=Depends(get_optional_user),
):
    """PAX "stuck" flow: judge a draft against the user's chosen goal
    (understanding / peace / respect) without rewriting it.

    Not counted against the search limit — it is a sub-step of an analysis
    the user already spent a search on.
    """
    apply_user_model_tier(llm_client, current_user)
    start = time.time()

    user_text = f"GOAL: {request.goal}\n\nDRAFT MESSAGE:\n{request.text}"
    if request.answers:
        reflections = "\n".join(f"- {a.strip()}" for a in request.answers if a and a.strip())
        if reflections:
            user_text += f"\n\nREFLECTIONS:\n{reflections}"

    try:
        feedback, _ = await llm_client.generate_completion(PAX_COACH_V1_PROMPT, user_text)
    except Exception as e:
        error_str = str(e).lower()
        if 'insufficient_quota' in error_str or '429' in error_str:
            await _notify_admin_quota_exhausted(current_user)
            raise HTTPException(status_code=429, detail="Something went wrong")
        raise

    # The prompt puts a "RISK: HIGH|LOW" marker on the first line — strip it
    # out and surface it as a boolean so the frontend can drop humor for
    # distressed users and point them to a real human.
    high_risk = False
    lines = feedback.strip().splitlines()
    if lines and lines[0].strip().upper().startswith("RISK:"):
        high_risk = "HIGH" in lines[0].upper()
        feedback = "\n".join(lines[1:])

    latency_ms = int((time.time() - start) * 1000)
    return PaxCoachResponse(feedback=feedback.strip(), high_risk=high_risk, latency_ms=latency_ms)

@router.post("/feedback", response_model=PaxFeedbackResponse)
async def submit_feedback(request: PaxFeedbackRequest):
    service = FeedbackService()
    return await service.record_feedback(request)
