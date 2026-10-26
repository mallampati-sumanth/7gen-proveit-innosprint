import os
import json
import time
import uuid
import hashlib
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Form, Request, Response
from pydantic import BaseModel
from sqlmodel import Session, select

from backend.app.config import settings
from backend.app.db import get_session
from backend.app.entities.models import User, RepoConfig, EC2Instance, Run, VoiceCallLog
from backend.app.services.sarvam_voice import sarvam_voice_service
from backend.app.routers.agent import agent_instance

router = APIRouter(prefix="/api/voice", tags=["voice"])


# ─────────── SCHEMAS ───────────
class LinkPhoneRequest(BaseModel):
    username: str
    phone_number: str
    voice_pin: Optional[str] = "1234"


class SimulateCallRequest(BaseModel):
    caller_phone: str
    pin: Optional[str] = "1234"
    spoken_prompt: str
    target_ec2: Optional[str] = "NEW_INSTANCE"


# ─────────── 1. VOICEOPS STATUS & PROFILE ───────────
@router.get("/status")
def get_voiceops_status(session: Session = Depends(get_session)):
    """Returns telephony agent phone number, Sarvam AI config, and webhook URLs."""
    admin_user = session.exec(select(User).where(User.username == settings.DEMO_USERNAME)).first()
    call_logs_count = len(session.exec(select(VoiceCallLog)).all())
    
    return {
        "telephony_agent_phone": settings.TELEPHONY_AGENT_PHONE,
        "sarvam_configured": bool(settings.SARVAM_API_KEY and not settings.SARVAM_API_KEY.startswith("your_")),
        "sarvam_voice_model": settings.SARVAM_VOICE_MODEL,
        "sarvam_speaker": settings.SARVAM_SPEAKER,
        "sarvam_stt_model": settings.SARVAM_STT_MODEL,
        "sarvam_language": settings.SARVAM_LANGUAGE_CODE,
        "webhook_url": f"{settings.TELEPHONY_WEBHOOK_BASE_URL}/api/voice/webhook/incoming",
        "demo_user_phone": admin_user.phone_number if admin_user else "+919876543210",
        "demo_user_pin": admin_user.voice_pin if admin_user else "1234",
        "total_calls_handled": call_logs_count,
    }


@router.post("/profile/link")
def link_user_phone(req: LinkPhoneRequest, session: Session = Depends(get_session)):
    """Link user phone number and 4-digit deployment Voice PIN."""
    user = session.exec(select(User).where(User.username == req.username.strip())).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{req.username}' not found.")

    clean_phone = req.phone_number.strip().replace(" ", "").replace("-", "")
    user.phone_number = clean_phone
    user.phone_verified = True
    user.voice_pin = (req.voice_pin or "1234").strip()
    user.voice_enabled = True
    session.add(user)
    session.commit()
    session.refresh(user)

    return {
        "status": "LINKED",
        "username": user.username,
        "phone_number": user.phone_number,
        "voice_pin": user.voice_pin,
        "message": f"Successfully linked phone {user.phone_number} to account @{user.username} with 4-digit voice PIN.",
    }


@router.get("/logs")
def get_voice_call_logs(session: Session = Depends(get_session)):
    """Fetch history of incoming voice calls and actions."""
    logs = session.exec(select(VoiceCallLog).order_by(VoiceCallLog.created_at.desc()).limit(50)).all()
    return logs


# ─────────── 2. IN-APP INTERACTIVE VOICE SIMULATOR ───────────
@router.post("/simulate-call")
def simulate_voice_call(req: SimulateCallRequest, session: Session = Depends(get_session)):
    """
    Simulate an entire voice call session:
    1. Caller ID authentication lookup
    2. Voice PIN verification
    3. Sarvam speech parsing & fuzzy repo matching
    4. Autonomous AWS EC2 deployment execution
    5. Sarvam TTS voice audio synthesis
    """
    caller_phone = req.caller_phone.strip().replace(" ", "").replace("-", "")
    call_sid = f"call_{uuid.uuid4().hex[:12]}"

    # Step 1: Caller ID Verification
    user = session.exec(select(User).where(User.phone_number == caller_phone)).first()
    if not user:
        log = VoiceCallLog(
            call_sid=call_sid,
            caller_phone=caller_phone,
            pin_verified=False,
            transcript=req.spoken_prompt,
            status="UNAUTHORIZED",
            agent_response="Phone number not registered. Please link mobile in ProveIt dashboard.",
        )
        session.add(log)
        session.commit()
        return {
            "status": "UNAUTHORIZED",
            "message": "Phone number not recognized. Please link your phone number in the ProveIt Dashboard.",
            "call_sid": call_sid,
        }

    # Step 2: Voice PIN Verification
    pin_input = (req.pin or "").strip()
    if user.voice_pin and pin_input != user.voice_pin:
        log = VoiceCallLog(
            call_sid=call_sid,
            caller_phone=caller_phone,
            username=user.username,
            pin_verified=False,
            transcript=req.spoken_prompt,
            status="INVALID_PIN",
            agent_response="Invalid 4-digit PIN provided.",
        )
        session.add(log)
        session.commit()
        return {
            "status": "INVALID_PIN",
            "message": "Authentication failed: 4-digit voice PIN is incorrect.",
            "call_sid": call_sid,
        }

    # Step 3: Fetch User's Repositories & Match Spoken Utterance
    user_repos = [r.repo_id for r in session.exec(select(RepoConfig)).all()]
    if not user_repos:
        user_repos = ["pallets/flask", "fastapi/fastapi", "vercel/next.js"]

    matched_repo = sarvam_voice_service.match_repository(req.spoken_prompt, user_repos) or user_repos[0]

    # Step 4: Initiate Autonomous Deployment
    run_id = f"run-v{hashlib.md5(f'{call_sid}{time.time()}'.encode()).hexdigest()[:7]}"
    target_ec2 = req.target_ec2 or "NEW_INSTANCE"

    new_run = Run(
        run_id=run_id,
        prompt=f"VoiceOps Phone Command: '{req.spoken_prompt}' from {caller_phone}",
        target_repo=matched_repo,
        target_ec2=target_ec2,
        environment="production",
        cloud_mode=settings.CLOUD_MODE,
        status="RUNNING",
    )
    session.add(new_run)

    # Step 5: Synthesize Voice Response via Sarvam AI TTS
    spoken_reply = (
        f"Hello {user.username}! Voice authentication verified. "
        f"I am now launching a new AWS EC2 instance and deploying your {matched_repo.split('/')[-1]} repository. "
        f"Cryptographic proof and live health checks will be committed to your audit ledger."
    )
    tts_result = sarvam_voice_service.text_to_speech(spoken_reply)

    # Record Log
    log = VoiceCallLog(
        call_sid=call_sid,
        caller_phone=caller_phone,
        username=user.username,
        pin_verified=True,
        transcript=req.spoken_prompt,
        intent="DEPLOY_REPOSITORY",
        matched_repo=matched_repo,
        deployment_run_id=run_id,
        agent_response=spoken_reply,
        status="COMPLETED",
    )
    session.add(log)
    session.commit()

    return {
        "status": "SUCCESS",
        "authenticated_user": user.username,
        "caller_phone": caller_phone,
        "matched_repo": matched_repo,
        "deployment_run_id": run_id,
        "agent_spoken_reply": spoken_reply,
        "tts_audio": tts_result,
        "call_sid": call_sid,
    }


# ─────────── 3. TELEPHONY WEBHOOKS (TWILIO / EXOTEL / SARVAM) ───────────
@router.post("/webhook/incoming")
async def telephony_incoming_call(request: Request, session: Session = Depends(get_session)):
    """Telephony Webhook: Called when a user dials into the agent's phone number."""
    form_data = await request.form()
    caller_phone = (form_data.get("From") or form_data.get("CallFrom") or "").strip().replace(" ", "").replace("-", "")

    # Look up user by caller ID
    user = session.exec(select(User).where(User.phone_number == caller_phone)).first()
    
    if not user:
        twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">Welcome to ProveIt Cloud. This phone number is not linked to any active ProveIt account. Please visit your web dashboard settings to link your mobile number.</Say>
    <Hangup/>
</Response>"""
        return Response(content=twiml, media_type="application/xml")

    # User exists: Ask for 4-digit voice PIN
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="/api/voice/webhook/verify-pin?user_id={user.id}" numDigits="4" timeout="8">
        <Say voice="Polly.Aditi">Hello {user.username}! Welcome to ProveIt Autonomous Deployment. Please enter your 4-digit security PIN on your keypad to authenticate.</Say>
    </Gather>
    <Say voice="Polly.Aditi">We did not receive your PIN. Good bye.</Say>
    <Hangup/>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@router.post("/webhook/verify-pin")
async def telephony_verify_pin(request: Request, session: Session = Depends(get_session)):
    """Telephony Webhook: Validates entered DTMF digits and prompts for speech action."""
    form_data = await request.form()
    user_id = request.query_params.get("user_id")
    digits = form_data.get("Digits") or ""

    user = session.get(User, int(user_id)) if user_id else None
    if not user or digits.strip() != user.voice_pin:
        twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">Security PIN is incorrect. Authentication failed. Good bye.</Say>
    <Hangup/>
</Response>"""
        return Response(content=twiml, media_type="application/xml")

    # PIN Verified! Prompt user to speak which repo they want to deploy
    user_repos = [r.repo_id.split("/")[-1] for r in session.exec(select(RepoConfig)).all()]
    repo_list_speech = ", ".join(user_repos[:3]) if user_repos else "Flask, FastAPI, or Next.js"

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/voice/webhook/process-speech?user_id={user.id}" timeout="5" speechTimeout="auto">
        <Say voice="Polly.Aditi">Authentication verified! You have repositories available: {repo_list_speech}. Which repository would you like to deploy to AWS?</Say>
    </Gather>
    <Say voice="Polly.Aditi">We did not hear a command. Good bye.</Say>
    <Hangup/>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@router.post("/webhook/process-speech")
async def telephony_process_speech(request: Request, session: Session = Depends(get_session)):
    """Telephony Webhook: Captures spoken repo, matches it, and triggers deployment."""
    form_data = await request.form()
    user_id = request.query_params.get("user_id")
    speech_result = form_data.get("SpeechResult") or form_data.get("RecordingUrl") or "deploy flask"

    user = session.get(User, int(user_id)) if user_id else None
    username = user.username if user else "user"

    user_repos = [r.repo_id for r in session.exec(select(RepoConfig)).all()] or ["pallets/flask"]
    matched_repo = sarvam_voice_service.match_repository(speech_result, user_repos) or user_repos[0]

    # Trigger deployment in background
    run_id = f"run-call-{uuid.uuid4().hex[:6]}"
    new_run = Run(
        run_id=run_id,
        prompt=f"Voice Command from {user.phone_number if user else 'phone'}: {speech_result}",
        target_repo=matched_repo,
        target_ec2="NEW_INSTANCE",
        environment="production",
        cloud_mode=settings.CLOUD_MODE,
        status="RUNNING",
    )
    session.add(new_run)
    session.commit()

    reply_text = (
        f"Got it, {username}! Launching fresh EC2 instance in AWS and deploying {matched_repo.split('/')[-1]}. "
        f"Your application will be live in 60 seconds with cryptographic proof committed to your ledger."
    )

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">{reply_text}</Say>
    <Hangup/>
</Response>"""
    return Response(content=twiml, media_type="application/xml")
