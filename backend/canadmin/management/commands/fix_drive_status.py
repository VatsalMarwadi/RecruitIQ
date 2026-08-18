# canadmin/management/commands/fix_drive_status.py

from django.core.management.base import BaseCommand
from canadmin.models import DriveModel, RoundModel
from django.utils import timezone

class Command(BaseCommand):
    help = 'Fix drive statuses manually'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write('FIXING DRIVE STATUSES')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        
        drives = DriveModel.objects.all()
        updated_count = 0
        
        for drive in drives:
            self.stdout.write(f"\nProcessing: {drive.title} (ID: {drive.id})")
            self.stdout.write(f"  Current Status: {drive.status}")
            
            now = timezone.now()
            updated = False
            
            # Draft → Published
            if drive.status == 'draft' and drive.drive_date_time <= now:
                self.stdout.write(self.style.SUCCESS(f"  ✅ Updating draft → published"))
                drive.status = 'published'
                drive.save(update_fields=['status', 'updated_at'])
                updated = True
                updated_count += 1
            
            # Published → In Progress
            elif drive.status == 'published':
                active_rounds = drive.rounds.filter(status='active')
                if active_rounds.exists():
                    self.stdout.write(self.style.SUCCESS(f"  ✅ Updating published → in_progress"))
                    drive.status = 'in_progress'
                    drive.save(update_fields=['status', 'updated_at'])
                    updated = True
                    updated_count += 1
                else:
                    self.stdout.write(f"  ⚠️ No active rounds found. Rounds statuses:")
                    for r in drive.rounds.all().order_by('round_order'):
                        self.stdout.write(f"     Round {r.round_order}: {r.status}")
            
            # In Progress → Completed
            elif drive.status == 'in_progress':
                rounds = drive.rounds.all()
                if rounds and all(r.status == 'completed' for r in rounds):
                    self.stdout.write(self.style.SUCCESS(f"  ✅ Updating in_progress → completed"))
                    drive.status = 'completed'
                    drive.save(update_fields=['status', 'updated_at'])
                    updated = True
                    updated_count += 1
                else:
                    self.stdout.write(f"  ⚠️ Not all rounds completed:")
                    for r in rounds:
                        self.stdout.write(f"     Round {r.round_order}: {r.status}")
            
            if not updated:
                self.stdout.write(f"  ℹ️ No change needed")
        
        self.stdout.write("\n" + "="*50)
        self.stdout.write(self.style.SUCCESS('FINAL STATUS:'))
        for drive in DriveModel.objects.all():
            self.stdout.write(f"  {drive.title}: {drive.status}")
        self.stdout.write("="*50)
        self.stdout.write(self.style.SUCCESS(f"\n✅ Updated {updated_count} drives"))