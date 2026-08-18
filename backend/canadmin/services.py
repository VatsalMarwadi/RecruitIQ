# canadmin/services.py - Updated AutoStatusService

from django.utils import timezone
from datetime import timedelta
from .models import DriveModel, RoundModel
import logging

logger = logging.getLogger(__name__)

class AutoStatusService:
    """Service to handle automatic status updates"""
    
    @staticmethod
    def update_round_status(round_obj):
        """
        Update a single round's status based on current time
        """
        now = timezone.now()
        updated = False
        
        # Skip if final status
        if round_obj.status in ['completed', 'cancelled']:
            return False
        
        logger.info(f"Checking round {round_obj.id} - Current status: {round_obj.status}")
        logger.info(f"  Round Start: {round_obj.round_start_datetime}")
        
        # Pending → Active
        if round_obj.status == 'pending':
            if round_obj.round_start_datetime and round_obj.round_start_datetime <= now:
                round_obj.status = 'active'
                updated = True
                logger.info(f"Round {round_obj.id} auto-updated to active")
            else:
                if round_obj.round_start_datetime:
                    time_diff = (round_obj.round_start_datetime - now).total_seconds() / 60
                    logger.info(f"Round {round_obj.id} remains pending - {time_diff:.0f} minutes until start")
        
        # Active → Completed (duration expired)
        elif round_obj.status == 'active':
            if round_obj.round_start_datetime:
                # Use round_duration_minutes if available, otherwise fallback to duration_minutes
                duration = getattr(round_obj, 'round_duration_minutes', None)
                if duration is None:
                    duration = getattr(round_obj, 'duration_minutes', 60)
                
                end_time = round_obj.round_start_datetime + timedelta(minutes=duration)
                if now >= end_time:
                    round_obj.status = 'completed'
                    updated = True
                    logger.info(f"Round {round_obj.id} auto-updated to completed (duration expired)")
                else:
                    remaining = (end_time - now).total_seconds() / 60
                    logger.info(f"Round {round_obj.id} remains active - {remaining:.1f} minutes remaining")
        
        if updated:
            round_obj.save(update_fields=['status', 'updated_at'])
        
        return updated
    
    @staticmethod
    def update_drive_status(drive):
        """
        Update a single drive's status based on current time and rounds
        """
        now = timezone.now()
        updated = False
        
        # Skip if final status
        if drive.status in ['completed', 'cancelled']:
            logger.info(f"Drive {drive.id} is {drive.status}, skipping")
            return False
        
        logger.info(f"Checking drive {drive.id} ({drive.title}) - Current status: {drive.status}")
        
        # Draft → Published
        if drive.status == 'draft':
            if drive.drive_date_time <= now:
                drive.status = 'published'
                updated = True
                logger.info(f"Drive {drive.id} auto-published")
        
        # Published → In Progress (if any round is active)
        elif drive.status == 'published':
            active_rounds = drive.rounds.filter(status='active')
            if active_rounds.exists():
                drive.status = 'in_progress'
                updated = True
                logger.info(f"Drive {drive.id} auto-updated to in_progress")
        
        # In Progress → Completed (if all rounds completed)
        elif drive.status == 'in_progress':
            rounds = drive.rounds.all()
            if rounds and all(r.status == 'completed' for r in rounds):
                drive.status = 'completed'
                updated = True
                logger.info(f"Drive {drive.id} auto-updated to completed")
        
        if updated:
            drive.save(update_fields=['status', 'updated_at'])
        
        return updated
    
    @staticmethod
    def update_all():
        """
        Update all drives and rounds
        """
        updated_drives = []
        updated_rounds = []
        
        logger.info("=" * 60)
        logger.info("Starting AutoStatusService.update_all()")
        logger.info(f"Current time: {timezone.now()}")
        logger.info("=" * 60)
        
        # Update all rounds first
        logger.info("Updating rounds...")
        for round_obj in RoundModel.objects.exclude(status__in=['completed', 'cancelled']):
            if AutoStatusService.update_round_status(round_obj):
                updated_rounds.append(round_obj.id)
        
        # Then update drives
        logger.info("Updating drives...")
        for drive in DriveModel.objects.exclude(status__in=['completed', 'cancelled']):
            if AutoStatusService.update_drive_status(drive):
                updated_drives.append(drive.id)
        
        logger.info(f"Update complete - Drives: {updated_drives}, Rounds: {updated_rounds}")
        logger.info("=" * 60)
        
        return {
            'updated_drives': updated_drives,
            'updated_rounds': updated_rounds
        }