from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
import os

# Use file-based SQLite for data persistence across server restarts.
_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
os.makedirs(_DB_DIR, exist_ok=True)
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(_DB_DIR, 'careai.db')}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
)

# Fix: virtiofs filesystem doesn't support SQLite's default rollback journal.
# Use MEMORY journal mode to avoid "disk I/O error" on commit.
@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, conn_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=MEMORY")
    cursor.execute("PRAGMA synchronous=OFF")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Default administrator credentials (created on first init).
DEFAULT_ADMIN_NAME = "管理员"
DEFAULT_ADMIN_EMAIL = "admin"
DEFAULT_ADMIN_PASSWORD = "admin123"
PASSWORD_SALT = "careai_2026"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(db=None):
    """Initialize the database: create tables, ensure a default admin exists,
    and insert default system configuration entries.

    - Creates all tables (including ``SystemConfig``) if missing.
    - Migrates the legacy seed admin (email "admin@careai.local" with a
      plaintext password) to the new auth scheme (email "admin", hashed
      password) so existing databases keep working.
    - If the users table is empty, creates the default administrator:
        name="管理员", email="admin", password=sha256("admin123" + salt),
        role="admin", notify_levels="P0,P1,P2,P3".
    - Inserts default system config entries (auto_blur, blur_intensity, etc.)
      for any keys that are not yet present in the database.
    """
    # Ensure all tables are created. The SystemConfig model (and every other
    # model) must be imported before this call so it is registered with
    # Base.metadata. main.py imports the models module at startup.
    Base.metadata.create_all(bind=engine)

    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True
    try:
        # Lazy import to avoid a circular dependency:
        # app.models.models imports `Base` from this module.
        import hashlib
        from app.models.models import User, SystemConfig
        from app.api.config import DEFAULT_CONFIGS

        # --- Legacy admin migration (old seed used a plaintext password) ---
        legacy = db.query(User).filter(User.email == "admin@careai.local").first()
        if legacy:
            legacy.email = DEFAULT_ADMIN_EMAIL
            legacy.password = hashlib.sha256(
                (DEFAULT_ADMIN_PASSWORD + PASSWORD_SALT).encode("utf-8")
            ).hexdigest()
            legacy.role = "admin"
            legacy.notify_levels = "P0,P1,P2,P3"
            db.commit()

        # --- Create the default administrator when no users exist yet ---
        if db.query(User).count() == 0:
            admin = User(
                name=DEFAULT_ADMIN_NAME,
                email=DEFAULT_ADMIN_EMAIL,
                password=hashlib.sha256(
                    (DEFAULT_ADMIN_PASSWORD + PASSWORD_SALT).encode("utf-8")
                ).hexdigest(),
                role="admin",
                permissions="全部权限",
                notify_levels="P0,P1,P2,P3",
            )
            db.add(admin)
            db.commit()

        # --- Insert default system configuration entries if missing ---
        for key, value in DEFAULT_CONFIGS.items():
            existing = db.query(SystemConfig).filter(SystemConfig.key == key).first()
            if not existing:
                db.add(SystemConfig(key=key, value=value))
        db.commit()
    finally:
        if own_session:
            db.close()
