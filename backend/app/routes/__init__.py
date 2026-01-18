from .auth_routes import router as auth_router
from .profile_routes import router as profile_router
from .roles_routes import router as roles_router
from .cv_routes import router as cv_router
from .payment_routes import router as payment_router
from .screening_routes import router as screening_router
from .interview_routes import router as interview_router
from .activity_routes import router as activity_router

__all__ = [
    "auth_router",
    "profile_router", 
    "roles_router",
    "cv_router",
    "payment_router",
    "screening_router",
    "interview_router",
    "activity_router",
]


