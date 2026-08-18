from datetime import timedelta

from django.db import models

# Create your models here.
class InstituteModel(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=20, unique=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default="India")
    tpo_name = models.CharField(max_length=100, null=True, blank=True)
    tpo_email = models.EmailField(unique=True, null=True, blank=True)
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
        ("cancelled", "Cancelled")
    )
    status = models.CharField(max_length=50, choices=STATUS_OPTIONS, default="pending")
    meeting_link = models.URLField(blank=True, null=True)
    
    # When the round becomes active
    round_start_datetime = models.DateTimeField()
    
    # How long the round is active (in minutes)
    round_duration_minutes = models.PositiveIntegerField(default=60)
    
    # How long candidates have to complete the test (in minutes)
    test_duration_minutes = models.PositiveIntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Track if test has been started by candidate
    is_test_started = models.BooleanField(default=False)
    
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
    
    def get_round_end_datetime(self):
        """Calculate when the round ends"""
        return self.round_start_datetime + timedelta(minutes=self.round_duration_minutes)
    
    def get_test_end_datetime(self, test_start_time):
        """Calculate when the test ends based on test_start_time"""
        return test_start_time + timedelta(minutes=self.test_duration_minutes)
    
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
    explanation = models.TextField(blank=True)
    marks = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["created_at"]
    def __str__(self):
        return self.problem_statement

class CodingTestCaseModel(models.Model):
    id = models.AutoField(primary_key=True)
    question = models.ForeignKey(CodingQuestionModel, on_delete=models.CASCADE, related_name="test_cases")
    input_data = models.TextField()
    expected_output = models.TextField()
    is_sample = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["created_at"]

class RoundAttemptModel(models.Model):
    id = models.AutoField(primary_key=True)
    candidate = models.ForeignKey("authentication.UserTable", on_delete=models.CASCADE, related_name="round_attempts")
    round = models.ForeignKey(RoundModel, on_delete=models.CASCADE, related_name="attempts")
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(blank=True, null=True)
    score = models.PositiveIntegerField(default=0)
    total_marks = models.PositiveIntegerField(default=0)
    STATUS_OPTIONS = (
        ('in_progress', 'In Progress'),
        ('completed', 'Completed')
    )
    status = models.CharField(max_length=20, choices=STATUS_OPTIONS, default='in_progress')
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['candidate', 'round'], name="unique_candidate_round_attempt")
        ]

class RoundCandidateDecisionModel(models.Model):
    id = models.AutoField(primary_key=True)
    attempt = models.OneToOneField(RoundAttemptModel, on_delete=models.CASCADE, related_name="candidate_decision")
    DECISION_OPTIONS = (
        ("pending", "Pending"),
        ("shortlisted", "Shortlisted"),
        ("rejected", "Rejected"),
        ("on_hold", "On Hold"),
    )
    decision = models.CharField(max_length=20, choices=DECISION_OPTIONS, default="pending")
    score = models.PositiveIntegerField(default=0)
    total_marks = models.PositiveIntegerField(default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    next_round = models.ForeignKey(RoundModel, on_delete=models.SET_NULL, null=True, blank=True, related_name="selected_candidates")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["-percentage"]
    def __str__(self):
        return (f"{self.attempt.candidate.name} - {self.attempt.round.get_round_type_display()} - {self.decision}")

class AptitudeAnswerModel(models.Model):
    id = models.AutoField(primary_key=True)
    attempt = models.ForeignKey(RoundAttemptModel, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(AptitudeQuestionModel, on_delete=models.CASCADE)
    selected_option = models.CharField(max_length=10, choices=AptitudeQuestionModel.OPTION_CHOICES, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    marks_obtained = models.PositiveIntegerField(default=0)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"],
                name="unique_attempt_question_answer"
            )
        ]

class CodingQuestionSubmissionModel(models.Model):
    id = models.AutoField(primary_key=True)
    attempt = models.ForeignKey(RoundAttemptModel, on_delete=models.CASCADE, related_name="coding_question_submissions")
    question = models.ForeignKey(CodingQuestionModel, on_delete=models.CASCADE, related_name="candidate_submissions")
    LANGUAGE_OPTIONS = (
        ("python", "Python"),
        ("java", "Java"),
        ("cpp", "C++"),
        ("c", "C"),
        ("javascript", "JavaScript"),
    )
    language = models.CharField(max_length=20, choices=LANGUAGE_OPTIONS)
    code = models.TextField()
    total_test_cases = models.PositiveIntegerField(default=0)
    passed_test_cases = models.PositiveIntegerField(default=0)
    score = models.PositiveIntegerField(default=0)
    STATUS_OPTIONS = (
        ("saved", "Saved"),
        ("submitted", "Submitted"),
    )
    status = models.CharField(max_length=20, choices=STATUS_OPTIONS, default="saved")
    submitted_at = models.DateTimeField(auto_now=True)
    evaluated_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["attempt", "question"], name="unique_candidate_question_submission")]
    def __str__(self):
        return f"{self.attempt.candidate.name} - Q{self.question.id}"

class CodingSubmissionModel(models.Model):
    id = models.AutoField(primary_key=True)
    attempt = models.OneToOneField(RoundAttemptModel, on_delete=models.CASCADE, related_name="coding_submission")
    total_questions = models.PositiveIntegerField(default=0)
    attempted_questions = models.PositiveIntegerField(default=0)
    total_marks = models.PositiveIntegerField(default=0)
    score = models.PositiveIntegerField(default=0)
    STATUS_OPTIONS = (
        ("pending","Pending"),
        ("submitted", "Submitted"),
        ("evaluated", "Evaluated"),
    )
    status = models.CharField(max_length=20, choices=STATUS_OPTIONS, default="pending")
    submitted_at = models.DateTimeField(null=True, blank=True)
    evaluated_at = models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return f"Submission Result - Attempt {self.attempt.id}"