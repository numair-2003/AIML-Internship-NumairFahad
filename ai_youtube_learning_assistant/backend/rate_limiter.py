"""
Shared rate limiter instance used across all routers.
Key function: client IP address (get_remote_address).
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
