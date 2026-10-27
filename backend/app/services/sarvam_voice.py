import os
import re
import json
import logging
import requests
from difflib import SequenceMatcher
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

    def clean_spoken_query(self, query: str) -> str:
        """Strips filler phrases and common voice commands from spoken utterances."""
        filler_words = {
            "deploy", "deployment", "launch", "check", "inspect", "run", "build",
            "repository", "repo", "project", "app", "application", "the", "my",
            "to", "in", "on", "a", "an", "for", "please", "can", "you", "start",
            "open", "test", "find", "search", "what", "is", "about", "called",
            "publish", "push", "serve", "host"
        }
        tokens = [w for w in re.sub(r"[^a-zA-Z0-9\s]", " ", (query or "").lower()).split() if w not in filler_words]
        return " ".join(tokens).strip() or (query or "").lower().strip()

    def score_repository_match(self, spoken_query: str, repo: str) -> float:
        """
        Calculates similarity between caller's spoken utterance and repository identifier.
        Combines exact token equality, substring containment, compact alphanumeric matching,
        and Levenshtein / SequenceMatcher ratio.
        """
        if not repo:
            return 0.0
        clean_q = self.clean_spoken_query(spoken_query)
        q_compact = re.sub(r"[^a-z0-9]", "", clean_q)
        repo_lower = repo.lower()
        repo_short = repo_lower.split("/")[-1]
        r_compact = re.sub(r"[^a-z0-9]", "", repo_short)

        # 1. Exact match
        if clean_q == repo_short or q_compact == r_compact:
            return 1.0

        # 2. Substring containment
        if q_compact and r_compact:
            if q_compact in r_compact:
                return 0.88 + (len(q_compact) / max(len(r_compact), 1)) * 0.11
            if r_compact in q_compact:
                return 0.85 + (len(r_compact) / max(len(q_compact), 1)) * 0.14

        # 3. Compact / SequenceMatcher similarity
        sim_ratio = SequenceMatcher(None, clean_q, repo_short).ratio()
        compact_ratio = SequenceMatcher(None, q_compact, r_compact).ratio() if q_compact and r_compact else 0.0

        # 4. Token overlap
        q_words = set(clean_q.split())
        r_words = set(re.sub(r"[^a-z0-9\s]", " ", repo_lower).split())
        overlap = len(q_words.intersection(r_words)) / max(len(q_words), 1) if q_words else 0.0

        return round(max(sim_ratio, compact_ratio, overlap * 0.85), 3)

    def search_repositories(
        self,
        query: str,
        user_repos: List[str],
        min_threshold: float = 0.35,
    ) -> Dict[str, Any]:
        """
        Fuzzy searches user's repositories against what the caller said during a call.
        Returns ranked candidate matches, match confidence, and whether high confidence match found.
        """
        if not user_repos:
            return {
                "found": False,
                "query": query,
                "clean_query": self.clean_spoken_query(query),
                "matched_repo": None,
                "confidence": 0.0,
                "matches": [],
            }

        clean_q = self.clean_spoken_query(query)
        scored = []
        for r in user_repos:
            score = self.score_repository_match(query, r)
            scored.append({
                "repo": r,
                "short_name": r.split("/")[-1],
                "score": score,
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        top = scored[0] if scored else None

        if top and top["score"] >= min_threshold:
            return {
                "found": True,
                "query": query,
                "clean_query": clean_q,
                "matched_repo": top["repo"],
                "short_name": top["short_name"],
                "confidence": top["score"],
                "is_exact": top["score"] >= 0.95,
                "matches": scored[:5],
            }

        return {
            "found": False,
            "query": query,
            "clean_query": clean_q,
            "matched_repo": None,
            "confidence": top["score"] if top else 0.0,
            "matches": scored[:5],
        }

    def match_repository(self, speech_text: str, user_repos: List[str]) -> Optional[str]:
        """Backward-compatible helper: returns the best matching repository string or None."""
        res = self.search_repositories(speech_text, user_repos, min_threshold=0.35)
        if res.get("found"):
            return res.get("matched_repo")
        return None


sarvam_voice_service = SarvamVoiceService()
