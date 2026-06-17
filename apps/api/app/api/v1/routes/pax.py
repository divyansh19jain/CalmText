from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import time
import asyncio
from app.schemas.pax import PaxAnalyzeRequest, PaxAnalyzeResponse, PaxFeedbackRequest, PaxFeedbackResponse, ClearTextRequest, ClearTextResponse, OwnVoiceRequest, OwnVoiceResponse
from app.prompts.pax_variants import CLEARTEXT_V1_PROMPT, OWNVOICE_V1_PROMPT
from app.services.pax_service import PaxService
from app.services.feedback_service import FeedbackService
from app.core.dependencies import get_llm_client, get_claude_client, get_optional_user
from app.core.email_service import send_admin_notification
from app.clients.llm_client import LLMClient
from app.db.session import get_db
from app.models.history import SearchHistory

router = APIRouter()

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
        existing_entry.pax = result.pax
        existing_entry.subtext = result.subtext
        await db.commit()
    else:
        # Create new entry only if message doesn't exist
        entry = SearchHistory(
            user_id=user.id,
            text=request.text,
            mode=request.mode,
            pax=result.pax,
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
    try:
        service = PaxService(llm_client)
        result = await service.analyze(request)
        await _save_history(db, current_user, result, request)
        return result
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
    try:
        service = PaxService(llm_client)
        result = await service.analyze(request)
        await _save_history(db, current_user, result, request)
        return result
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

    return ClearTextResponse(feedback=feedback.strip(), latency_ms=latency_ms)

@router.post("/voice", response_model=OwnVoiceResponse)
async def write_own_voice(
    request: OwnVoiceRequest,
    llm_client: LLMClient = Depends(get_llm_client),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
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

    return OwnVoiceResponse(message=result, latency_ms=latency_ms)

@router.post("/feedback", response_model=PaxFeedbackResponse)
async def submit_feedback(request: PaxFeedbackRequest):
    service = FeedbackService()
    return await service.record_feedback(request)
