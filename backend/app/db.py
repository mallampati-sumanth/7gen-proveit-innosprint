from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import event, text
from backend.app.config import settings

# Configure engine dynamically for SQLite or Supabase (PostgreSQL)
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False, "timeout": 30.0} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True
)

if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA journal_mode=WAL;")
            cursor.execute("PRAGMA busy_timeout=30000;")
            cursor.execute("PRAGMA synchronous=NORMAL;")
        finally:
            cursor.close()


def init_db() -> None:
    """Initialize database tables."""
    from backend.app.entities.models import (
        Run,
        Event,
        Incident,
        Approval,
        LedgerEntry,
        RepoConfig,
        RepoEnvVar,
        EC2Instance,
        User,
        VoiceCallLog,
    )
    import hashlib
    import secrets
    import uuid
    from sqlmodel import select

    SQLModel.metadata.create_all(engine)

    # Auto-migrate new VoiceOps columns into "user" table if not already present
    with engine.connect() as conn:
        from sqlalchemy import text
        if is_sqlite:
            try:
                res = conn.execute(text("PRAGMA table_info('user');"))
                existing_cols = {row[1] for row in res.fetchall()}
                cols_to_add = [
                    ("phone_number", "VARCHAR"),
                    ("phone_verified", "BOOLEAN DEFAULT 0"),
                    ("voice_pin", "VARCHAR DEFAULT '1234'"),
                    ("voice_enabled", "BOOLEAN DEFAULT 1"),
                ]
                for col_name, col_def in cols_to_add:
                    if col_name not in existing_cols:
                        conn.execute(text(f'ALTER TABLE "user" ADD COLUMN {col_name} {col_def};'))
                # Auto-migrate run table columns
                res_run = conn.execute(text("PRAGMA table_info('run');"))
                existing_run_cols = {row[1] for row in res_run.fetchall()}
                run_cols_to_add = [
                    ("target_ec2", "VARCHAR"),
                    ("environment", "VARCHAR DEFAULT 'production'"),
                    ("injected_env_json", "VARCHAR DEFAULT '{}'"),
                    ("user_id", "VARCHAR"),
                    ("blast_radius_score", "FLOAT"),
                    ("sandbox_tested", "BOOLEAN"),
                ]
                for col_name, col_def in run_cols_to_add:
                    if col_name not in existing_run_cols:
                        conn.execute(text(f'ALTER TABLE "run" ADD COLUMN {col_name} {col_def};'))

                # Auto-migrate repoconfig table columns
                res_repo = conn.execute(text("PRAGMA table_info('repoconfig');"))
                existing_repo_cols = {row[1] for row in res_repo.fetchall()}
                repo_cols_to_add = [
                    ("user_id", "VARCHAR"),
                    ("root_directory", "VARCHAR"),
                ]
                for col_name, col_def in repo_cols_to_add:
                    if col_name not in existing_repo_cols:
                        conn.execute(text(f'ALTER TABLE "repoconfig" ADD COLUMN {col_name} {col_def};'))

                conn.commit()
            except Exception:
                pass
        else:
            try:
                conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS phone_number VARCHAR;'))
                conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;'))
                conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS voice_pin VARCHAR DEFAULT \'1234\';'))
                conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT TRUE;'))
                conn.execute(text('ALTER TABLE "run" ADD COLUMN IF NOT EXISTS target_ec2 VARCHAR;'))
                conn.execute(text('ALTER TABLE "run" ADD COLUMN IF NOT EXISTS environment VARCHAR DEFAULT \'production\';'))
                conn.execute(text('ALTER TABLE "run" ADD COLUMN IF NOT EXISTS injected_env_json VARCHAR DEFAULT \'{}\';'))
                conn.execute(text('ALTER TABLE "run" ADD COLUMN IF NOT EXISTS user_id VARCHAR;'))
                conn.execute(text('ALTER TABLE "run" ADD COLUMN IF NOT EXISTS blast_radius_score FLOAT;'))
                conn.execute(text('ALTER TABLE "run" ADD COLUMN IF NOT EXISTS sandbox_tested BOOLEAN;'))
                conn.execute(text('ALTER TABLE "repoconfig" ADD COLUMN IF NOT EXISTS user_id VARCHAR;'))
                conn.execute(text('ALTER TABLE "repoconfig" ADD COLUMN IF NOT EXISTS root_directory VARCHAR;'))
                conn.commit()
            except Exception:
                pass

    with Session(engine) as session:
        # Seed Admin User if not exists
        admin_user = session.exec(select(User).where(User.username == settings.DEMO_USERNAME)).first()
        if not admin_user:
            salt = secrets.token_hex(16)
            hashed = hashlib.pbkdf2_hmac("sha256", settings.DEMO_PASSWORD.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
            admin = User(
                user_id=f"usr_{uuid.uuid4().hex[:12]}",
                email="admin@proveit.cloud",
                username=settings.DEMO_USERNAME,
                name="ProveIt Administrator",
                hashed_password=hashed,
                salt=salt,
                auth_provider="email",
                phone_number=None,
                phone_verified=False,
                voice_pin="1234",
                voice_enabled=True,
                is_admin=True,
                is_active=True,
            )
            session.add(admin)
            session.commit()

        # Seed EC2 Fleet Instances if empty
        existing_ec2 = session.exec(select(EC2Instance)).first()
        if not existing_ec2:
            initial_instances = [
                EC2Instance(
                    instance_id="i-0a8f9c12345678",
                    name="Production App Host (EC2-01)",
                    public_ip="54.210.14.88",
                    private_ip="10.0.1.42",
                    region="us-east-1",
                    instance_type="t3.small",
                    state="running",
                    ssh_user="ubuntu",
                    auth_method="ssh_key",
                    docker_installed=True,
                    docker_version="Docker v26.1.4, compose v2.27.0",
                    deployed_containers_count=0,
                    deployed_apps_json="[]",
                    last_ping_status="HEALTHY",
                    last_ping_latency_ms=16.4,
                ),
                EC2Instance(
                    instance_id="i-0b7e2d98765432",
                    name="Staging & Worker Node (EC2-02)",
                    public_ip="3.235.19.112",
                    private_ip="10.0.2.19",
                    region="us-east-1",
                    instance_type="t3.medium",
                    state="running",
                    ssh_user="ubuntu",
                    auth_method="ssh_key",
                    docker_installed=True,
                    docker_version="Docker v26.1.4, compose v2.27.0",
                    deployed_containers_count=0,
                    deployed_apps_json="[]",
                    last_ping_status="HEALTHY",
                    last_ping_latency_ms=22.1,
                ),
            ]
            session.add_all(initial_instances)
            session.commit()



def get_session():
    """Dependency for obtaining database sessions."""
    with Session(engine) as session:
        yield session

