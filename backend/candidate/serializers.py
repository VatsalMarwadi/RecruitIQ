from rest_framework import serializers
from .models import CandidateProfile, Education, Experience, Skill, Project, Language, Certificate

class CandidateProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    date_of_birth = serializers.DateField(source="user.date_of_birth", read_only=True)
    class Meta:
        model = CandidateProfile
        fields = ['id', 'user_id', 'name', 'email', 'date_of_birth', 'phone', 'gender', 'nationality', 'address', 'city', 'state', 'country', 'zip_code', 'about', 'profile_picture', 'resume', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user_id', 'name', 'email', 'date_of_birth', 'created_at', 'updated_at']
        extra_kwargs = {"profile_picture": {"required": False}, "resume": {"required": False}}

class EducationSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    class Meta:
        model = Education
        fields = ['id', 'user_id', 'name', 'email', 'institute', 'degree', 'field', 'start_year', 'end_year', 'is_current', 'evaluation_format', 'marks', 'degree_image', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user_id', 'name', 'email', 'created_at', 'updated_at']

class ExperienceSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    class Meta:
        model = Experience
        fields = ['id', 'user_id', 'name', 'email', 'company', 'position', 'location', 'start_year', 'end_year', 'is_current', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user_id', 'name', 'email', 'created_at', 'updated_at']

class SkillSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    class Meta:
        model = Skill
        fields = ['id', 'user_id', 'user_name', 'email', 'name', 'level', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user_id', 'user_name', 'email', 'created_at', 'updated_at']

class ProjectSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    class Meta:
        model = Project
        fields = ['id', 'user_id', 'user_name', 'email', 'title', 'description', 'technologies', 'link', 'start_month_year', 'end_month_year', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user_id', 'user_name', 'email', 'created_at', 'updated_at']

class LanguageSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    class Meta:
        model = Language
        fields = ['id', 'user_id', 'user_name', 'email', 'name', 'proficiency','created_at', 'updated_at']
        read_only_fields = ['id', 'user_id', 'user_name', 'email', 'created_at', 'updated_at']

class CertificateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    class Meta:
        model = Certificate
        fields = ['id', 'user_id', 'user_name', 'email', 'name', 'issue_org', 'issue_month_year', 'link', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user_id', 'user_name', 'email', 'created_at', 'updated_at']