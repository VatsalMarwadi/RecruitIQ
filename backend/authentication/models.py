from django.db import models
from django.contrib.auth.models import AbstractUser
from canadmin.models import InstituteModel
from .managers import UserManager

class UserTable(AbstractUser):
    ROLE_OPTIONS = (
        ('candidate', 'Candidate'),
        ('admin', 'Admin'),
    )

    username = None

    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    date_of_birth = models.DateField()
    institute = models.ForeignKey(InstituteModel, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    role = models.CharField(max_length=20, choices=ROLE_OPTIONS, default="candidate")
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]
    objects = UserManager()

    def __str__(self):
        return self.name