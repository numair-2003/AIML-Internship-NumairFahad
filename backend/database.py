from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy import text as sa_text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from config import settings

DATABASE_URL = f"sqlite:///{settings.sqlite_db_path}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True)  # YouTube video ID
    url = Column(String, nullable=False)
    title = Column(String, nullable=True)
    channel_name = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    status = Column(String, default="processing")  # processing | ready | failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    messages = relationship("ChatMessage", back_populates="video", cascade="all, delete-orphan")
    summary = relationship("Summary", back_populates="video", uselist=False, cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="video", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="video", cascade="all, delete-orphan")
    user_videos = relationship("UserVideo", back_populates="video", cascade="all, delete-orphan")


class UserVideo(Base):
    """
    Ownership table: tracks which Clerk users have added which YouTube videos.
    Video content (transcript, summary, quiz, flashcards) is shared across all
    users who process the same YouTube video, but access is scoped per owner.
    """
    __tablename__ = "user_videos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)   # Clerk sub claim
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "video_id", name="uq_user_video"),)

    video = relationship("Video", back_populates="user_videos")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=True, index=True)   # Clerk sub claim; nullable for migration compat
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    role = Column(String, nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    citations_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    video = relationship("Video", back_populates="messages")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False, unique=True)
    overview = Column(Text, nullable=False)
    key_points_json = Column(Text, nullable=False)
    chapters_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    video = relationship("Video", back_populates="summary")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    questions_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    video = relationship("Video", back_populates="quizzes")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)

    video = relationship("Video", back_populates="flashcards")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Create all tables defined above (additive; existing tables are not dropped)
    Base.metadata.create_all(bind=engine)

    # SQLite doesn't support adding columns via create_all on existing tables,
    # so we run lightweight migrations manually.
    _run_migrations()


def _run_migrations():
    """Apply incremental schema changes to an already-existing database."""
    with engine.connect() as conn:
        # Add user_id column to chat_messages if it was created before this column existed
        result = conn.execute(sa_text("PRAGMA table_info(chat_messages)"))
        existing_cols = {row[1] for row in result}
        if "user_id" not in existing_cols:
            conn.execute(sa_text("ALTER TABLE chat_messages ADD COLUMN user_id VARCHAR"))
            conn.commit()
