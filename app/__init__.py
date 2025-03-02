from .main import app
from .routes import router
from .storage import storage

app.include_router(router)

__all__ = ["app", "storage"] 