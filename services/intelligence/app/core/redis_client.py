import redis
from app.core.config import REDIS_URL

_redis_pool = None


def get_redis_client() -> redis.Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = redis.ConnectionPool.from_url(REDIS_URL, decode_responses=True)
    return redis.Redis(connection_pool=_redis_pool)
