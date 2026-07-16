from django.db import models

# Create your models here.
class InstituteModel(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=20, unique=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default="India")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["name"]
    def __str__(self):
        return self.name
    
class DriveModel(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=100)
    job_role = models.CharField(max_length=100)
    description = models.TextField()
    ctc = models.CharField(max_length=20)
    job_location = models.CharField(max_length=100)
    institute = models.ForeignKey(InstituteModel, on_delete=models.PROTECT, related_name="drives")
    STATUS_OPTIONS = (
        ("draft", "Draft"),
        ("published", "Published"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled")
    )
    status = models.CharField(max_length=20, choices=STATUS_OPTIONS, default="draft")
    drive_date_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["created_at"]
    def __str__(self):
        return self.title
    
class RoundModel(models.Model):
    id = models.AutoField(primary_key=True)
    drive = models.ForeignKey(DriveModel, on_delete=models.CASCADE, related_name="rounds")
    ROUND_TYPES_OPTIONS = (
        ("aptitude", "Aptitude"),
        ("coding", "Coding"),
        ("gd", "Group Discussion"),
        ("technical", "Technical Interview"),
        ("hr", "HR Interview"),
    )
    round_type = models.CharField(max_length=50, choices=ROUND_TYPES_OPTIONS)
    round_order = models.PositiveIntegerField()
    STATUS_OPTIONS = (
        ("pending", "Pending"),
        ("active", "Active"),
        ("completed", "Completed"),
    )
    status = models.CharField(max_length=50, choices=STATUS_OPTIONS, default="pending")
    meeting_link = models.URLField(blank=True, null=True)
    duration_minutes = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["round_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["drive", "round_order"],
                name="unique_round_order_per_drive"
            ),
            models.UniqueConstraint(
                fields=["drive", "round_type"],
                name="unique_round_type_per_drive"
            ),
        ]
    def __str__(self):
        return f"{self.drive.title} - {self.get_round_type_display()}"
    
class AptitudeQuestionModel(models.Model):
    id = models.AutoField(primary_key=True)
    round = models.ForeignKey(RoundModel, on_delete=models.CASCADE, related_name="aptitude_questions")
    question = models.TextField()
    option_1 = models.CharField(max_length=255)
    option_2 = models.CharField(max_length=255)
    option_3 = models.CharField(max_length=255)
    option_4 = models.CharField(max_length=255)
    OPTION_CHOICES = (
        ("option_1", "Option 1"),
        ("option_2", "Option 2"),
        ("option_3", "Option 3"),
        ("option_4", "Option 4"),
    )
    correct_option = models.CharField(max_length=10, choices=OPTION_CHOICES)
    marks = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["created_at"]
    def __str__(self):
        return self.question
    
class CodingQuestionModel(models.Model):
    id = models.AutoField(primary_key=True)
    round = models.ForeignKey(RoundModel, on_delete=models.CASCADE, related_name="coding_questions")
    problem_statement = models.CharField(max_length=255)
    description = models.TextField()
    DIFFICULTY_OPTIONS = (
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard")
    )
    difficulty = models.CharField(max_length=50, choices=DIFFICULTY_OPTIONS)
    input_format = models.TextField()
    output_format = models.TextField()
    constraints = models.TextField()
    sample_input = models.TextField()
    sample_output = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["created_at"]
    def __str__(self):
        return self.problem_statement