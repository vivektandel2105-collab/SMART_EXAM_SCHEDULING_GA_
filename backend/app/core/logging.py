import logging
import sys
from app.core.config import settings


def setup_logging():
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format="%(asctime)s - %(name)s - [%(levelname)s] - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    logger = logging.getLogger("smartexam")
    logger.info(f"Logging initialized. Log level: {settings.LOG_LEVEL}")
    return logger


logger = setup_logging()
