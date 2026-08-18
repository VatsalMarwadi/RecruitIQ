from rest_framework import serializers
from .models import CandidateProfile, Education, Experience, Skill, Project, Language, Certificate
from canadmin.models import DriveModel, RoundModel, AptitudeQuestionModel, CodingQuestionModel, CodingTestCaseModel, CodingSubmissionModel, RoundAttemptModel, CodingQuestionSubmissionModel 

class CandidateProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    date_of_birth = serializers.DateField(source="user.date_of_birth", read_only=True)
    
    class Meta:
        model = CandidateProfile
        fields = [
            'id', 'user_id', 'name', 'email', 'date_of_birth', 
            'phone', 'gender', 'nationality', 'address', 'city', 
            'state', 'country', 'zip_code', 'about', 
            'profile_picture', 'resume', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_id', 'name', 'email', 'date_of_birth', 'created_at', 'updated_at']
        extra_kwargs = {"profile_picture": {"required": False}, "resume": {"required": False}}

class EducationSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    
    class Meta:
        model = Education
        fields = [
            'id', 'user_id', 'name', 'email', 'institute', 'degree', 
            'field', 'start_year', 'end_year', 'is_current', 
            'evaluation_format', 'marks', 'degree_image', 'description', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_id', 'name', 'email', 'created_at', 'updated_at']

class ExperienceSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    
    class Meta:
        model = Experience
        fields = [
            'id', 'user_id', 'name', 'email', 'company', 'position', 
            'location', 'start_year', 'end_year', 'is_current', 
            'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_id', 'name', 'email', 'created_at', 'updated_at']

class SkillSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    
    class Meta:
        model = Skill
        fields = [
            'id', 'user_id', 'user_name', 'email', 'name', 'level', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_id', 'user_name', 'email', 'created_at', 'updated_at']

class ProjectSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'user_id', 'user_name', 'email', 'title', 'description', 
            'technologies', 'link', 'start_month_year', 'end_month_year', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_id', 'user_name', 'email', 'created_at', 'updated_at']

class LanguageSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    
    class Meta:
        model = Language
        fields = [
            'id', 'user_id', 'user_name', 'email', 'name', 'proficiency',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_id', 'user_name', 'email', 'created_at', 'updated_at']

class CertificateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    
    class Meta:
        model = Certificate
        fields = [
            'id', 'user_id', 'user_name', 'email', 'name', 'issue_org', 
            'issue_month_year', 'link', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_id', 'user_name', 'email', 'created_at', 'updated_at']

# ✅ Updated: No application_deadline needed
class CandidateDriveSerializer(serializers.ModelSerializer):
    institute_name = serializers.CharField(source="institute.name", read_only=True)
    institute_code = serializers.CharField(source="institute.code", read_only=True)
    total_rounds = serializers.SerializerMethodField()
    
    class Meta:
        model = DriveModel
        fields = [
            "id", 
            "title", 
            "job_role", 
            "description", 
            "ctc", 
            "job_location", 
            "institute_name", 
            "institute_code", 
            "status", 
            "drive_date_time",
            "total_rounds", 
            "created_at", 
            "updated_at"
        ]
    
    def get_total_rounds(self, obj):
        return obj.rounds.count()
    
# candidate/serializers.py - Updated CandidateRoundSerializer

class CandidateRoundSerializer(serializers.ModelSerializer):
    round_type_display = serializers.CharField(source="get_round_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    
    class Meta:
        model = RoundModel
        fields = [
            "id", "round_type", "round_type_display", "round_order", 
            "status", "status_display", "meeting_link", 
            "round_duration_minutes", "test_duration_minutes",
            "round_start_datetime"
        ]

class CandidateDriveDetailSerializer(serializers.ModelSerializer):
    institute_name = serializers.CharField(source="institute.name", read_only=True)
    institute_code = serializers.CharField(source="institute.code", read_only=True)
    rounds = CandidateRoundSerializer(many=True, read_only=True)
    rounds_with_status = serializers.SerializerMethodField()
    
    class Meta:
        model = DriveModel
        fields = [
            "id", "title", "job_role", "description", "ctc", 
            "job_location", "institute_name", "institute_code", 
            "status", "drive_date_time", "rounds", "created_at",
            "rounds_with_status"
        ]
    
    def get_rounds_with_status(self, obj):
        """This will be populated in the view with candidate-specific data"""
        # Return empty list by default, the view will override this
        return []

class CandidateAptitudeQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AptitudeQuestionModel
        fields = ["id", "question", "option_1", "option_2", "option_3", "option_4", "marks"]

class CandidateCodingTestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingTestCaseModel
        fields = ['input_data', 'expected_output']

class CandidateCodingQuestionSerializer(serializers.ModelSerializer):
    sample_test_cases = serializers.SerializerMethodField()
    class Meta:
        model = CodingQuestionModel
        fields = ['id', 'problem_statement', 'description', 'difficulty', 'input_format', 'output_format', 'constraints', 'explanation', 'marks', 'sample_test_cases']
    def get_sample_test_cases(self, obj):
        test_cases = obj.test_cases.filter(is_sample=True).order_by("created_at")
        return CandidateCodingTestCaseSerializer(test_cases, many=True).data

class SaveCodingSubmissionSerializer(serializers.ModelSerializer):
    attempt = serializers.PrimaryKeyRelatedField(queryset=RoundAttemptModel.objects.all())
    question = serializers.PrimaryKeyRelatedField(queryset=CodingQuestionModel.objects.all())
    class Meta:
        model = CodingQuestionSubmissionModel
        fields = ['attempt', 'question', 'language', 'code']

class RunCodeSerializer(serializers.Serializer):
    attempt = serializers.PrimaryKeyRelatedField(queryset=RoundAttemptModel.objects.all())
    question = serializers.PrimaryKeyRelatedField(queryset=CodingQuestionModel.objects.all())
    language = serializers.CharField()
    code = serializers.CharField()

class CodingQuestionSubmissionSerializer(serializers.ModelSerializer):
    attempt = serializers.PrimaryKeyRelatedField(queryset=RoundAttemptModel.objects.all())
    question = serializers.PrimaryKeyRelatedField(queryset=CodingQuestionModel.objects.all())
    class Meta:
        model = CodingQuestionSubmissionModel
        fields = ["attempt", "question", "language", "code"]

class CodingSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingSubmissionModel
        fields = ["id", "attempt", "total_questions", "attempted_questions", "total_marks", "score", "status", "submitted_at", "evaluated_at"]