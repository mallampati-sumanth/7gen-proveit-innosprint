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
    phone_number: Optional[str] = None
    voice_pin: Optional[str] = None
    voice_enabled: Optional[bool] = None


class SimulateCallRequest(BaseModel):
    caller_phone: str
    pin: Optional[str] = None
    spoken_prompt: Optional[str] = ""
    target_ec2: Optional[str] = "NEW_INSTANCE"
    confirmed_decision: Optional[bool] = False


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
        "voice_enabled": admin_user.voice_enabled if (admin_user and admin_user.voice_enabled is not None) else True,
        "total_calls_handled": call_logs_count,
    }


@router.post("/profile/link")
def link_user_phone(req: LinkPhoneRequest, session: Session = Depends(get_session)):
    """Link user phone number, 4-digit deployment Voice PIN, and toggle voice_enabled."""
    user = session.exec(select(User).where(User.username == req.username.strip())).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{req.username}' not found.")

    if req.phone_number is not None:
        clean_phone = req.phone_number.strip().replace(" ", "").replace("-", "")
        user.phone_number = clean_phone
        user.phone_verified = bool(clean_phone)
    if req.voice_pin is not None:
        user.voice_pin = req.voice_pin.strip()
    if req.voice_enabled is not None:
        user.voice_enabled = req.voice_enabled

    session.add(user)
    session.commit()
    session.refresh(user)

    return {
        "status": "UPDATED",
        "username": user.username,
        "phone_number": user.phone_number,
        "voice_pin": user.voice_pin,
        "voice_enabled": user.voice_enabled,
        "message": f"Successfully updated VoiceOps settings for @{user.username}.",
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
    2. Voice PIN verification (ONLY discloses details when PIN matches!)
    3. Sarvam speech parsing & repository presence check
    4. Decision Gate: Never take autonomous decisions; ask user regarding EC2 creation & deploy
    5. Deployment trigger upon user confirmation
    6. Sarvam TTS voice audio synthesis
    """
    caller_phone = req.caller_phone.strip().replace(" ", "").replace("-", "")
    call_sid = f"call_{uuid.uuid4().hex[:12]}"
    prompt_text = (req.spoken_prompt or "").strip()

    # Step 1: Caller ID Verification
    user = session.exec(select(User).where(User.phone_number == caller_phone)).first()
    if not user:
        reply = f"Access Denied: Phone number {caller_phone} is not linked to any active ProveIt account. Please add your mobile number in Settings Profile."
        log = VoiceCallLog(
            call_sid=call_sid,
            caller_phone=caller_phone,
            pin_verified=False,
            transcript=prompt_text,
            status="UNAUTHORIZED",
            agent_response=reply,
        )
        session.add(log)
        session.commit()
        tts_result = sarvam_voice_service.text_to_speech(reply)
        return {
            "status": "UNAUTHORIZED",
            "message": reply,
            "agent_spoken_reply": reply,
            "tts_audio": tts_result,
            "call_sid": call_sid,
        }

    # Step 1b: Check if VoiceOps is enabled
    if not user.voice_enabled:
        reply = f"VoiceOps is currently disabled for account @{user.username}. Please enable Sarvam VoiceOps in your web console."
        log = VoiceCallLog(
            call_sid=call_sid,
            caller_phone=caller_phone,
            username=user.username,
            pin_verified=False,
            transcript=prompt_text,
            status="VOICE_DISABLED",
            agent_response=reply,
        )
        session.add(log)
        session.commit()
        tts_result = sarvam_voice_service.text_to_speech(reply)
        return {
            "status": "VOICE_DISABLED",
            "message": reply,
            "agent_spoken_reply": reply,
            "tts_audio": tts_result,
            "call_sid": call_sid,
        }

    # Step 2: Voice PIN Verification (Say details ONLY when password is verified)
    pin_input = (req.pin or "").strip()
    expected_pin = (user.voice_pin or "1234").strip()
    if pin_input != expected_pin:
        reply = "Security PIN verification failed. Account details and cloud resources are protected until the correct 4-digit PIN is provided."
        log = VoiceCallLog(
            call_sid=call_sid,
            caller_phone=caller_phone,
            username=user.username,
            pin_verified=False,
            transcript=prompt_text,
            status="INVALID_PIN",
            agent_response=reply,
        )
        session.add(log)
        session.commit()
        tts_result = sarvam_voice_service.text_to_speech(reply)
        return {
            "status": "INVALID_PIN",
            "message": reply,
            "agent_spoken_reply": reply,
            "tts_audio": tts_result,
            "call_sid": call_sid,
        }

    # Step 3: PIN is verified! Fetch user details to announce
    user_repos_objs = session.exec(select(RepoConfig)).all()
    user_repos = [r.repo_id for r in user_repos_objs]
    if not user_repos:
        user_repos = ["pallets/flask", "fastapi/fastapi", "vercel/next.js"]
    repo_names = [r.split("/")[-1] for r in user_repos]

    ec2_instances = session.exec(select(EC2Instance)).all()
    ec2_count = len(ec2_instances)

    details_summary = (
        f"Authentication verified, {user.name or user.username}! "
        f"Your linked mobile {caller_phone} is authenticated. "
        f"Account details: {len(user_repos)} active repositories ({', '.join(repo_names[:3])}) "
        f"and {ec2_count} AWS EC2 instances running."
    )

    # Step 4: Check if spoken prompt specifies a repository
    lower_prompt = prompt_text.lower()
    matched_repo = None
    if prompt_text:
        matched_repo = sarvam_voice_service.match_repository(prompt_text, user_repos)

    # If no repo mentioned or just asking for details / greeting
    if not matched_repo and not any(kw in lower_prompt for kw in ["deploy", "repo", "instance", "ec2", "flask", "fastapi", "next"]):
        spoken_reply = f"{details_summary} Which repository would you like to check or deploy? Please say the repository name."
        tts_result = sarvam_voice_service.text_to_speech(spoken_reply)
        log = VoiceCallLog(
            call_sid=call_sid,
            caller_phone=caller_phone,
            username=user.username,
            pin_verified=True,
            transcript=prompt_text,
            intent="DETAILS_INQUIRY",
            agent_response=spoken_reply,
            status="AUTHENTICATED",
        )
        session.add(log)
        session.commit()
        return {
            "status": "AUTHENTICATED",
            "authenticated_user": user.username,
            "caller_phone": caller_phone,
            "agent_spoken_reply": spoken_reply,
            "account_details": {
                "repos_count": len(user_repos),
                "repositories": user_repos,
                "ec2_count": ec2_count,
            },
            "tts_audio": tts_result,
            "call_sid": call_sid,
        }

    # If repo mentioned but not present in connected repos
    if not matched_repo:
        spoken_reply = (
            f"{details_summary} I checked your account, but could not find the repository mentioned in your command. "
            f"Your available repositories are: {', '.join(repo_names)}."
        )
        tts_result = sarvam_voice_service.text_to_speech(spoken_reply)
        log = VoiceCallLog(
            call_sid=call_sid,
            caller_phone=caller_phone,
            username=user.username,
            pin_verified=True,
            transcript=prompt_text,
            intent="REPO_NOT_FOUND",
            agent_response=spoken_reply,
            status="REPO_NOT_FOUND",
        )
        session.add(log)
        session.commit()
        return {
            "status": "REPO_NOT_FOUND",
            "authenticated_user": user.username,
            "caller_phone": caller_phone,
            "agent_spoken_reply": spoken_reply,
            "tts_audio": tts_result,
            "call_sid": call_sid,
        }

    # Step 5: Repository is present!
    # Requirement: "the agent should not take any decisions it should ask the user like ec2 instance creation deploy in it"
    decision_keywords = ["confirm", "yes", "create new ec2", "create instance and deploy", "deploy now", "approved", "go ahead"]
    has_user_decision = req.confirmed_decision or any(kw in lower_prompt for kw in decision_keywords)

    if not has_user_decision:
        spoken_reply = (
            f"{details_summary} Repository '{matched_repo}' is present in your GitHub account and verified. "
            f"I do not make autonomous decisions: Would you like to create a new EC2 instance to deploy it, "
            f"or deploy to an existing running instance? Please confirm your decision to proceed."
        )
        tts_result = sarvam_voice_service.text_to_speech(spoken_reply)
        log = VoiceCallLog(
            call_sid=call_sid,
            caller_phone=caller_phone,
            username=user.username,
            pin_verified=True,
            transcript=prompt_text,
            intent="AWAITING_DECISION",
            matched_repo=matched_repo,
            agent_response=spoken_reply,
            status="AWAITING_DECISION",
        )
        session.add(log)
        session.commit()
        return {
            "status": "AWAITING_DECISION",
            "requires_decision": True,
            "authenticated_user": user.username,
            "caller_phone": caller_phone,
            "matched_repo": matched_repo,
            "agent_spoken_reply": spoken_reply,
            "prompt_for_user": "Would you like to create a new EC2 instance to deploy it?",
            "tts_audio": tts_result,
            "call_sid": call_sid,
        }

    # Step 6: User confirmed decision -> Trigger Deployment
    run_id = f"run-v{hashlib.md5(f'{call_sid}{time.time()}'.encode()).hexdigest()[:7]}"
    target_ec2 = req.target_ec2 or "NEW_INSTANCE"

    new_run = Run(
        run_id=run_id,
        prompt=f"VoiceOps Phone Command: Verified repo '{matched_repo}' with user confirmation for EC2 instance creation and deployment from {caller_phone}",
        target_repo=matched_repo,
        target_ec2=target_ec2,
        environment="production",
        cloud_mode=settings.CLOUD_MODE,
        status="RUNNING",
    )
    session.add(new_run)

    spoken_reply = (
        f"{details_summary} Confirmed! Creating a new AWS EC2 instance and deploying '{matched_repo}'. "
        f"Live health probes and cryptographic SHA-256 proof ledger logging are initiated. "
        f"Your deployment run ID is {run_id}."
    )
    tts_result = sarvam_voice_service.text_to_speech(spoken_reply)

    log = VoiceCallLog(
        call_sid=call_sid,
        caller_phone=caller_phone,
        username=user.username,
        pin_verified=True,
        transcript=prompt_text,
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
    <Say voice="Polly.Aditi">Welcome to ProveIt Cloud. This phone number is not linked to any active ProveIt account. Please visit your web dashboard Settings Profile to link your mobile number.</Say>
    <Hangup/>
</Response>"""
        return Response(content=twiml, media_type="application/xml")

    if not user.voice_enabled:
        twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">Sarvam VoiceOps is currently disabled for this account. Please toggle and enable VoiceOps in your web console.</Say>
    <Hangup/>
</Response>"""
        return Response(content=twiml, media_type="application/xml")

    # User exists & enabled: Ask for 4-digit voice PIN (details protected until PIN is entered!)
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="/api/voice/webhook/verify-pin?user_id={user.id}" numDigits="4" timeout="8">
        <Say voice="Polly.Aditi">Welcome to ProveIt VoiceOps. Please enter your 4-digit security PIN on your keypad to authenticate.</Say>
    </Gather>
    <Say voice="Polly.Aditi">We did not receive your PIN. Good bye.</Say>
    <Hangup/>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@router.post("/webhook/verify-pin")
async def telephony_verify_pin(request: Request, session: Session = Depends(get_session)):
    """Telephony Webhook: Validates entered DTMF digits and discloses details ONLY upon verification."""
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

    # PIN Verified! Now announce account details and prompt for repo name
    user_repos = [r.repo_id.split("/")[-1] for r in session.exec(select(RepoConfig)).all()]
    repo_list_speech = ", ".join(user_repos[:3]) if user_repos else "Flask or FastAPI"
    ec2_count = len(session.exec(select(EC2Instance)).all())

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/voice/webhook/process-speech?user_id={user.id}" timeout="6" speechTimeout="auto">
        <Say voice="Polly.Aditi">Authentication verified, {user.username}! You have {len(user_repos)} repositories: {repo_list_speech}, and {ec2_count} EC2 instances running. Which repository would you like to check or deploy?</Say>
    </Gather>
    <Say voice="Polly.Aditi">We did not hear a command. Good bye.</Say>
    <Hangup/>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@router.post("/webhook/process-speech")
async def telephony_process_speech(request: Request, session: Session = Depends(get_session)):
    """Telephony Webhook: Verifies repository presence and asks user decision before deploying."""
    form_data = await request.form()
    user_id = request.query_params.get("user_id")
    speech_result = form_data.get("SpeechResult") or form_data.get("RecordingUrl") or ""

    user = session.get(User, int(user_id)) if user_id else None
    username = user.username if user else "engineer"

    user_repos = [r.repo_id for r in session.exec(select(RepoConfig)).all()] or ["pallets/flask"]
    matched_repo = sarvam_voice_service.match_repository(speech_result, user_repos)

    if not matched_repo:
        repo_names = ", ".join([r.split('/')[-1] for r in user_repos[:3]])
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">Repository not found in your connected GitHub accounts. Available repositories are: {repo_names}.</Say>
    <Hangup/>
</Response>"""
        return Response(content=twiml, media_type="application/xml")

    # Check if user confirmed deployment to new EC2 instance
    lower_speech = speech_result.lower()
    decision_keywords = ["confirm", "yes", "create new ec2", "deploy now", "create instance"]
    has_decision = any(kw in lower_speech for kw in decision_keywords)

    if not has_decision:
        # Prompt user for decision
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/voice/webhook/process-speech?user_id={user.id}" timeout="6" speechTimeout="auto">
        <Say voice="Polly.Aditi">Repository {matched_repo.split('/')[-1]} is verified and present. I do not make autonomous decisions: Would you like to create a new EC2 instance and deploy it? Please say confirm create EC2 instance to proceed.</Say>
    </Gather>
    <Say voice="Polly.Aditi">We did not hear your confirmation. Call ended.</Say>
    <Hangup/>
</Response>"""
        return Response(content=twiml, media_type="application/xml")

    # User confirmed! Trigger deployment
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
        f"Confirmed, {username}! Launching fresh EC2 instance in AWS and deploying {matched_repo.split('/')[-1]}. "
        f"Live health checks and SHA-256 cryptographic audit ledger are running."
    )

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">{reply_text}</Say>
    <Hangup/>
</Response>"""
    return Response(content=twiml, media_type="application/xml")
