from django.db import models
from authentication.models import UserTable
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from datetime import datetime
from django.contrib.postgres.fields import ArrayField

current_year = datetime.now().year

# Create your models here.
class CandidateProfile(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(UserTable, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=15, unique=True, validators=[RegexValidator(regex='^[6-9]\d{9}$', message="Enter A Valid 10-Digit Mobile Number")], blank=True, null=True)
    GENDER_OPTIONS = (
        ("Male", "Male"),
        ("Female", "Female"),
        ("Others", "Others")
    )
    gender = models.CharField(max_length=10, choices=GENDER_OPTIONS, blank=True)
    nationality = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=50, blank=True)
    state = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    about = models.TextField(blank=True)
    profile_picture = models.URLField(blank=True, null=True)
    resume = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now =True)
    class Meta:
        ordering = ["-created_at"]
    def __str__(self):
        return self.user.name
    
class Education(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(UserTable, on_delete=models.CASCADE, related_name="educations")
    institute = models.CharField(max_length=100)
    degree = models.CharField(max_length=100)
    field = models.CharField(max_length=100)
    start_year = models.PositiveIntegerField(validators=[MinValueValidator(1900), MaxValueValidator(current_year + 10)])
    end_year = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(1900), MaxValueValidator(current_year + 10)])
    is_current = models.BooleanField(default=False)
    EVALUATION_OPTIONS = (
        ("Percentage", "Percentage"),
        ("CGPA", "CGPA")
    )
    evaluation_format = models.CharField(max_length=20, choices=EVALUATION_OPTIONS)
    marks = models.CharField(max_length=20)
    degree_image = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now =True)
    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "institute"],
                name="unique_user_institute"
            )
        ]
    def __str__(self):
        return f"{self.user.name} - {self.degree} ({self.institute})"
    
class Experience(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(UserTable, on_delete=models.CASCADE, related_name='experiences')
    company = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    start_year = models.PositiveIntegerField(validators=[MinValueValidator(1900), MaxValueValidator(current_year + 10)])
    end_year = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(1900), MaxValueValidator(current_year + 10)])
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now =True)
    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "company"],
                name="unique_user_company"
            )
        ]
    def __str__(self):
        return f"{self.user.name} - {self.company} ({self.position})"
    
class Skill(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(UserTable, on_delete=models.CASCADE, related_name="skills")
    name = models.CharField(max_length=50)
    LEVEL_OPTIONS = (
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
        ('Expert', 'Expert')
    )
    level = models.CharField(max_length=20, choices=LEVEL_OPTIONS)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now =True)
    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_user_skill"
            )
        ]
    def __str__(self):
        return f"{self.user.name} - {self.name} ({self.level})"
    
class Project(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(UserTable, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    technologies = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    link = models.URLField(blank=True)
    start_month_year = models.DateField()
    end_month_year = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now =True)
    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "title"],
                name="unique_user_project"
            )
        ]
    def __str__(self):
        return f"{self.user.name} - {self.title}"
    
class Language(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(UserTable, on_delete=models.CASCADE, related_name="languages")
    name = models.CharField(max_length=50)
    PROFICIENCY_LEVELS = (
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
        ('Fluent', 'Fluent'),
        ('Native', 'Native'),
    )
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_LEVELS)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now =True)
    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_user_language"
            )
        ]
    def __str__(self):
        return f"{self.user.name} - {self.name} ({self.proficiency})"
    
class Certificate(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(UserTable, on_delete=models.CASCADE, related_name="certificates")
    name = models.CharField(max_length=50)
    issue_org = models.CharField(max_length=100)
    issue_month_year = models.DateField()
    link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now =True)
    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_user_certificate"
            )
        ]
    def __str__(self):
        return f"{self.user.name} - {self.name} ({self.issue_org})"