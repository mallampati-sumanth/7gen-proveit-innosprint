import hashlib
import secrets
import uuid
import re
import httpx
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
try:
    import jwt
    JWTError = getattr(jwt, "PyJWTError", Exception)
except ImportError:
    from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from backend.app.config import settings
from backend.app.db import get_session
from backend.app.entities.models import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])
security = HTTPBearer(auto_error=False)


# ─────────── CRYPTO & PASSWORD HELPERS ───────────
def generate_salt() -> str:
    return secrets.token_hex(16)


def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()


def verify_password(password: str, salt: str, hashed: str) -> bool:
    # 1. Primary: Verify with PBKDF2-HMAC (100,000 rounds) in constant time
    pbkdf2_hash = hash_password(password, salt)
    if secrets.compare_digest(pbkdf2_hash, hashed):
        return True
    # 2. Backward compatibility: Support legacy single-iteration SHA-256 for existing database accounts
    legacy_hash = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    if secrets.compare_digest(legacy_hash, hashed):
        return True
    return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.JWT_EXPIRATION_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# ─────────── SCHEMAS ───────────
class UserPublic(BaseModel):
    user_id: str
    username: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_provider: str = "email"
    is_admin: bool = False
    phone_number: Optional[str] = None
    phone_verified: bool = False
    voice_pin: Optional[str] = "1234"
    voice_enabled: bool = True


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    voice_pin: Optional[str] = None
    voice_enabled: Optional[bool] = None


def user_to_public(user: User) -> UserPublic:
    return UserPublic(
        user_id=user.user_id,
        username=user.username,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        auth_provider=user.auth_provider,
        is_admin=user.is_admin,
        phone_number=user.phone_number,
        phone_verified=user.phone_verified,
        voice_pin=user.voice_pin or "1234",
        voice_enabled=user.voice_enabled if user.voice_enabled is not None else True,
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: UserPublic
    github_token: Optional[str] = None


class LoginRequest(BaseModel):
    username: str  # Can be username or email
    password: str


class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str
    name: Optional[str] = None


class GitHubAuthRequest(BaseModel):
    code: Optional[str] = None
    token: Optional[str] = None


# ─────────── DEPENDENCIES ───────────
def get_current_user_obj(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        username_sub = payload.get("sub")
        if not username_sub or not isinstance(username_sub, str):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject.")
        username: str = username_sub
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid token.")

    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")
    return user


def get_current_user(user: User = Depends(get_current_user_obj)) -> str:
    return user.username


# ─────────── ENDPOINTS ───────────
@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, session: Session = Depends(get_session)):
    """Register a new user with email, username, and password."""
    email_clean = req.email.strip().lower()
    username_clean = req.username.strip()

    # Basic validations
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email_clean):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address format.")
    if len(username_clean) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username must be at least 3 characters long.")
    if len(req.password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters long.")

    # Check for existing email or username
    existing_email = session.exec(select(User).where(User.email == email_clean)).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")

    existing_username = session.exec(select(User).where(User.username == username_clean)).first()
    if existing_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This username is already taken. Please choose another.")

    # Create salted hash
    salt = generate_salt()
    hashed = hash_password(req.password, salt)

    user = User(
        user_id=f"usr_{uuid.uuid4().hex[:12]}",
        email=email_clean,
        username=username_clean,
        name=req.name.strip() if req.name else username_clean,
        hashed_password=hashed,
        salt=salt,
        auth_provider="email",
        avatar_url=f"https://api.dicebear.com/7.x/identicon/svg?seed={username_clean}",
        is_active=True,
        is_admin=False,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(data={"sub": user.username, "email": user.email, "uid": user.user_id})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_minutes=settings.JWT_EXPIRATION_MINUTES,
        user=UserPublic(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            auth_provider=user.auth_provider,
            is_admin=user.is_admin,
        ),
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, session: Session = Depends(get_session)):
    """Authenticate via username or email and password."""
    identifier = req.username.strip().lower()

    # Find user by username or email
    user = session.exec(
        select(User).where(
            (User.username == identifier) | (User.email == identifier)
        )
    ).first()

    # Special demo admin fallback / auto-provisioning
    if not user and identifier == settings.DEMO_USERNAME and req.password == settings.DEMO_PASSWORD:
        salt = generate_salt()
        hashed = hash_password(settings.DEMO_PASSWORD, salt)
        user = User(
            user_id=f"usr_{uuid.uuid4().hex[:12]}",
            email="admin@proveit.cloud",
            username=settings.DEMO_USERNAME,
            name="ProveIt Administrator",
            hashed_password=hashed,
            salt=salt,
            auth_provider="email",
            avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=admin",
            is_admin=True,
            is_active=True,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    # Verify password
    if user.hashed_password and user.salt:
        if not verify_password(req.password, user.salt, user.hashed_password):
            # Check demo password fallback for admin
            if user.username == settings.DEMO_USERNAME and req.password == settings.DEMO_PASSWORD:
                pass
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid username or password."
                )
    elif req.password != settings.DEMO_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    token = create_access_token(data={"sub": user.username, "email": user.email, "uid": user.user_id})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_minutes=settings.JWT_EXPIRATION_MINUTES,
        user=UserPublic(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            auth_provider=user.auth_provider,
            is_admin=user.is_admin,
        ),
    )


@router.post("/github", response_model=TokenResponse)
async def github_auth(req: GitHubAuthRequest, session: Session = Depends(get_session)):
    """Authenticate or register user via GitHub OAuth code or Personal Access Token."""
    gh_token = req.token

    async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
        # If OAuth authorization code was provided, exchange for access token
        if req.code:
            client_id = settings.GITHUB_CLIENT_ID
            client_secret = settings.GITHUB_CLIENT_SECRET
            if not client_id or not client_secret:
                # Provide helpful fallback if OAuth app client secret not yet configured
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="GitHub OAuth credentials (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET) not configured. You can use your GitHub Personal Access Token instead."
                )

            token_res = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "code": req.code,
                },
            )
            token_data = token_res.json()
            gh_token = token_data.get("access_token")
            if not gh_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=token_data.get("error_description", "Failed to exchange GitHub OAuth code for access token.")
                )

        if not gh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either GitHub OAuth code or GitHub Personal Access Token is required."
            )

        # Fetch profile from GitHub API
        user_res = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {gh_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "ProveIt-CloudAgent",
            },
        )
        if user_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not authenticate with GitHub API. Please check your token."
            )

        gh_data = user_res.json()
        gh_id = str(gh_data.get("id"))
        gh_login = gh_data.get("login")
        gh_name = gh_data.get("name") or gh_login
        avatar_url = gh_data.get("avatar_url")

        # Fetch verified email from GitHub
        email = gh_data.get("email")
        if not email:
            email_res = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {gh_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "ProveIt-CloudAgent",
                },
            )
            if email_res.status_code == 200:
                emails = email_res.json()
                for em in emails:
                    if em.get("primary") and em.get("verified"):
                        email = em.get("email")
                        break
                if not email and emails:
                    email = emails[0].get("email")

        if not email:
            email = f"{gh_login}@github.users"

    # Find existing user by github_id, username, or email
    user = session.exec(select(User).where(User.github_id == gh_id)).first()
    if not user:
        user = session.exec(select(User).where(User.email == email)).first()

    if not user:
        # Generate unique username
        existing_u = session.exec(select(User).where(User.username == gh_login)).first()
        final_username = gh_login if not existing_u else f"{gh_login}_{secrets.token_hex(2)}"

        user = User(
            user_id=f"usr_{uuid.uuid4().hex[:12]}",
            email=email,
            username=final_username,
            name=gh_name,
            auth_provider="github",
            github_id=gh_id,
            github_username=gh_login,
            avatar_url=avatar_url,
            is_active=True,
            is_admin=False,
        )
        session.add(user)
    else:
        # Update GitHub links
        user.github_id = gh_id
        user.github_username = gh_login
        if avatar_url:
            user.avatar_url = avatar_url
        if gh_name and not user.name:
            user.name = gh_name
        session.add(user)

    session.commit()
    session.refresh(user)

    # Persist the active GitHub token in runtime config so repo operations work seamlessly
    settings.GITHUB_TOKEN = gh_token

    token = create_access_token(data={"sub": user.username, "email": user.email, "uid": user.user_id})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_minutes=settings.JWT_EXPIRATION_MINUTES,
        user=user_to_public(user),
        github_token=gh_token,
    )


@router.get("/github/url")
def get_github_oauth_url():
    """Get GitHub OAuth authorization URL if configured."""
    client_id = settings.GITHUB_CLIENT_ID
    if not client_id:
        return {
            "configured": False,
            "url": None,
            "message": "GITHUB_CLIENT_ID not configured in backend environment. Use Personal Access Token to connect."
        }
    redirect_uri = "http://localhost:3000/auth/callback"
    scope = "repo,read:user,user:email"
    url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}"
    return {
        "configured": True,
        "url": url,
        "client_id": client_id,
    }


@router.get("/me", response_model=UserPublic)
def get_me(user: User = Depends(get_current_user_obj)):
    """Retrieve profile of currently authenticated user."""
    return user_to_public(user)


@router.put("/profile", response_model=UserPublic)
@router.post("/profile", response_model=UserPublic)
def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user_obj),
    session: Session = Depends(get_session)
):
    """Update profile details such as full name, mobile number, and VoiceOps settings."""
    if req.name is not None:
        user.name = req.name.strip()
    if req.phone_number is not None:
        clean_phone = req.phone_number.strip().replace(" ", "").replace("-", "")
        user.phone_number = clean_phone
        user.phone_verified = bool(clean_phone)
    if req.voice_pin is not None:
        user.voice_pin = req.voice_pin.strip()
    if req.voice_enabled is not None:
        user.voice_enabled = req.voice_enabled

    user.updated_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user_to_public(user)
