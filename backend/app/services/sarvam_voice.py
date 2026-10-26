import os
import json
import logging
import requests
from typing import Optional, List, Dict, Any
from backend.app.config import settings

logger = logging.getLogger(__name__)


class SarvamVoiceService:
    """
    Integration service for Sarvam AI Voice capabilities:
    - Sarvam Speech-to-Text (Saaras:v1) for Indic & Indian English STT
    - Sarvam Text-to-Speech (Bulbul:v1) for humanlike speech synthesis
    - Fuzzy repository matching and VoiceOps authentication
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SARVAM_API_KEY
        self.stt_url = "https://api.sarvam.ai/speech-to-text"
        self.tts_url = "https://api.sarvam.ai/text-to-speech"
        self.headers = {
            "api-subscription-key": self.api_key,
        }

    def speech_to_text(
        self,
        audio_content: bytes,
        filename: str = "audio.wav",
        language_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Transcribe caller audio using Sarvam Saaras model."""
        lang = language_code or settings.SARVAM_LANGUAGE_CODE
        if not self.api_key or self.api_key.startswith("your_"):
            return {
                "transcript": "deploy pallets/flask to ec2 in production mode",
                "language_code": lang,
                "confidence": 0.96,
                "provider": "sarvam_mock",
            }

        try:
            files = {
                "file": (filename, audio_content, "audio/wav")
            }
            data = {
                "language_code": lang,
                "model": settings.SARVAM_STT_MODEL,
            }
            res = requests.post(
                self.stt_url,
                headers={"api-subscription-key": self.api_key},
                files=files,
                data=data,
                timeout=15.0,
            )
            if res.status_code == 200:
                payload = res.json()
                return {
                    "transcript": payload.get("transcript", ""),
                    "language_code": payload.get("language_code", lang),
                    "confidence": payload.get("confidence", 0.95),
                    "provider": "sarvam_ai",
                }
            else:
                logger.warning(f"Sarvam STT HTTP error {res.status_code}: {res.text}")
                return {"transcript": "", "error": res.text, "provider": "sarvam_error"}
        except Exception as e:
            logger.error(f"Sarvam STT failed: {e}")
            return {"transcript": "", "error": str(e), "provider": "sarvam_error"}

    def text_to_speech(
        self,
        text: str,
        speaker: Optional[str] = None,
        language_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Synthesize natural agent audio using Sarvam Bulbul model."""
        lang = language_code or settings.SARVAM_LANGUAGE_CODE
        spk = speaker or settings.SARVAM_SPEAKER

        if not self.api_key or self.api_key.startswith("your_"):
            return {
                "status": "SIMULATED",
                "text": text,
                "speaker": spk,
                "provider": "sarvam_mock",
                "audio_base64": None,
            }

        try:
            headers = {
                "api-subscription-key": self.api_key,
                "Content-Type": "application/json",
            }
            payload = {
                "inputs": [text[:500]],
                "target_language_code": lang,
                "speaker": spk,
                "model": settings.SARVAM_VOICE_MODEL,
                "enable_preprocessing": True,
            }
            res = requests.post(self.tts_url, headers=headers, json=payload, timeout=12.0)
            if res.status_code == 200:
                data = res.json()
                audios = data.get("audios", [])
                return {
                    "status": "SUCCESS",
                    "text": text,
                    "speaker": spk,
                    "audio_base64": audios[0] if audios else None,
                    "provider": "sarvam_ai",
                }
            else:
                logger.warning(f"Sarvam TTS HTTP error {res.status_code}: {res.text}")
                return {"status": "ERROR", "text": text, "error": res.text}
        except Exception as e:
            logger.error(f"Sarvam TTS failed: {e}")
            return {"status": "ERROR", "text": text, "error": str(e)}

    def match_repository(self, speech_text: str, user_repos: List[str]) -> Optional[str]:
        """Fuzzy match caller's spoken utterance against user's connected GitHub repos."""
        if not user_repos:
            return None

        clean_text = speech_text.lower().replace("-", " ").replace("_", " ")

        # 1. Exact or partial repo name match
        for repo in user_repos:
            repo_clean = repo.lower().replace("-", " ").replace("_", " ")
            repo_short = repo_clean.split("/")[-1]
            if repo_short in clean_text or repo_clean in clean_text:
                return repo

        # 2. Token overlap check
        words = set(clean_text.split())
        best_match = None
        best_overlap = 0

        for repo in user_repos:
            repo_tokens = set(repo.lower().replace("-", " ").replace("_", " ").replace("/", " ").split())
            overlap = len(words.intersection(repo_tokens))
            if overlap > best_overlap:
                best_overlap = overlap
                best_match = repo

        if best_overlap > 0:
            return best_match

        # Default fallback to first available repo
        return user_repos[0]


sarvam_voice_service = SarvamVoiceService()
