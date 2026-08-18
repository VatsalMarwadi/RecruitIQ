# canadmin/management/commands/auto_update_statuses.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.models import User
from canadmin.models import DriveModel, RoundModel
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Auto-update drive and round statuses based on time'

    def handle(self, *args, **options):
        self.stdout.write('Starting auto-update statuses...')
        
        try:
            now = timezone.now()
            updated_drive_ids = []
            updated_round_ids = []
            
            # ========================================================
            # 1. UPDATE DRIVE STATUSES
            # ========================================================
            self.stdout.write('Updating drives...')
            
            # 1.1 Draft → Published when drive date/time arrives
            draft_drives = DriveModel.objects.filter(
                status='draft',
                drive_date_time__lte=now
            )
            for drive in draft_drives:
                drive.status = 'published'
                drive.save(update_fields=["status", "updated_at"])
                updated_drive_ids.append(drive.id)
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Drive "{drive.title}" auto-published (Draft → Published)')
                )
                logger.info(f"Drive {drive.id} auto-published to published")
            
            # 1.2 Published → In Progress when at least one round is active
            published_drives = DriveModel.objects.filter(status='published')
            for drive in published_drives:
                active_rounds = drive.rounds.filter(status='active')
                if active_rounds.exists():
                    drive.status = 'in_progress'
                    drive.save(update_fields=["status", "updated_at"])
                    updated_drive_ids.append(drive.id)
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✅ Drive "{drive.title}" auto-updated to in_progress (Round active)')
                    )
                    logger.info(f"Drive {drive.id} auto-updated to in_progress")
            
            # 1.3 In Progress → Completed when all rounds are completed
            in_progress_drives = DriveModel.objects.filter(status='in_progress')
            for drive in in_progress_drives:
                rounds = drive.rounds.all()
                if rounds and all(round.status == 'completed' for round in rounds):
                    drive.status = 'completed'
                    drive.save(update_fields=["status", "updated_at"])
                    updated_drive_ids.append(drive.id)
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✅ Drive "{drive.title}" auto-updated to completed')
                    )
                    logger.info(f"Drive {drive.id} auto-updated to completed")
            
            # ========================================================
            # 2. UPDATE ROUND STATUSES
            # ========================================================
            self.stdout.write('Updating rounds...')
            
            # 2.1 Pending → Active when start time arrives
            pending_rounds = RoundModel.objects.filter(
                status='pending',
                round_start_datetime__lte=now
            )
            for round_obj in pending_rounds:
                round_obj.status = 'active'
                round_obj.save(update_fields=["status", "updated_at"])
                updated_round_ids.append(round_obj.id)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✅ Round {round_obj.round_order} for drive "{round_obj.drive.title}" '
                        f'auto-updated to active'
                    )
                )
                logger.info(f"Round {round_obj.id} auto-updated to active")
            
            # 2.2 Active → Completed when round duration expires
            active_rounds = RoundModel.objects.filter(status='active')
            for round_obj in active_rounds:
                if round_obj.round_start_datetime:
                    # Use round_duration_minutes if available, otherwise fallback to duration_minutes
                    duration = getattr(round_obj, 'round_duration_minutes', None)
                    if duration is None:
                        # Try to get from duration_minutes (for backward compatibility)
                        duration = getattr(round_obj, 'duration_minutes', 60)
                    
                    end_time = round_obj.round_start_datetime + timezone.timedelta(
                        minutes=duration
                    )
                    if now >= end_time:
                        round_obj.status = 'completed'
                        round_obj.save(update_fields=["status", "updated_at"])
                        updated_round_ids.append(round_obj.id)
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  ✅ Round {round_obj.round_order} for drive "{round_obj.drive.title}" '
                                f'auto-updated to completed'
                            )
                        )
                        logger.info(f"Round {round_obj.id} auto-updated to completed")
            
            # ========================================================
            # 3. SUMMARY
            # ========================================================
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('=' * 50))
            self.stdout.write(self.style.SUCCESS('AUTO-UPDATE COMPLETED'))
            self.stdout.write(self.style.SUCCESS('=' * 50))
            self.stdout.write(f'  📊 Drives updated: {len(updated_drive_ids)}')
            if updated_drive_ids:
                self.stdout.write(f'     IDs: {updated_drive_ids}')
            self.stdout.write(f'  📊 Rounds updated: {len(updated_round_ids)}')
            if updated_round_ids:
                self.stdout.write(f'     IDs: {updated_round_ids}')
            self.stdout.write(self.style.SUCCESS('=' * 50))
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error during auto-update: {str(e)}')
            )
            logger.error(f"Error in auto_update_statuses: {str(e)}", exc_info=True)
            raise

        self.stdout.write('Auto-update completed.')