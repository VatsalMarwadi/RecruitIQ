# canadmin/middleware.py

from django.utils.deprecation import MiddlewareMixin
from .services import AutoStatusService
import logging

logger = logging.getLogger(__name__)

class AutoStatusMiddleware(MiddlewareMixin):
    """
    Middleware that checks and updates statuses on every request
    This ensures statuses are always up-to-date when users access the system
    """
    
    def process_request(self, request):
        # Only check for admin and candidate requests
        if request.path.startswith('/admin') or request.path.startswith('/candidate'):
            try:
                logger.info(f"Middleware triggered by request: {request.path}")
                result = AutoStatusService.update_all()
                if result['updated_drives'] or result['updated_rounds']:
                    logger.info(f"Auto-updated: Drives {result['updated_drives']}, Rounds {result['updated_rounds']}")
            except Exception as e:
                logger.error(f"Error in auto-status middleware: {e}", exc_info=True)