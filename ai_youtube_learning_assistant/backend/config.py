import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = os.environ.get("GEMINI_API_KEY", "")
    gemini_model: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    embedding_model: str = os.environ.get(
        "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
    )
    intent_model_path: str = os.environ.get(
        "INTENT_MODEL_PATH", "./models/intent_classifier"
    )
    sqlite_db_path: str = os.environ.get("SQLITE_DB_PATH", "./app.db")
    chroma_persist_dir: str = os.environ.get("CHROMA_PERSIST_DIR", "./chroma_db")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
