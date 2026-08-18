from rest_framework import serializers
from .models import InstituteModel, DriveModel, RoundAttemptModel, RoundCandidateDecisionModel, RoundModel, AptitudeQuestionModel, CodingQuestionModel, CodingTestCaseModel

class InstituteSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstituteModel
        fields = ['id', 'name', 'code', 'city', 'state', 'country', 'tpo_name', 'tpo_email', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_active', 'created_at', 'updated_at']

class DriveSerializer(serializers.ModelSerializer):
    institute_details = InstituteSerializer(source='institute', read_only=True)
    
    class Meta:
        model = DriveModel
        fields = ['id', 'title', 'job_role', 'description', 'ctc', 'job_location', 
                  'institute', 'institute_details', 'status', 'drive_date_time', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']
    
    def validate(self, data):
        # For editing, status cannot be changed through API
        if self.instance and 'status' in data:
            # Remove status from data if it's being sent
            data.pop('status', None)
        return data

# canadmin/serializers.py - Updated RoundSerializer

class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundModel
        fields = ['id', 'drive', 'round_type', 'round_order', 'status', 
                  'meeting_link', 'round_start_datetime', 'round_duration_minutes',
                  'test_duration_minutes', 'is_test_started', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'is_test_started', 'created_at', 'updated_at']
    
    def validate(self, data):
        from django.utils import timezone
        round_type = data.get("round_type", self.instance.round_type if self.instance else None)
        meeting_link = data.get("meeting_link", self.instance.meeting_link if self.instance else None)
        round_start_datetime = data.get("round_start_datetime", self.instance.round_start_datetime if self.instance else None)
        round_duration_minutes = data.get("round_duration_minutes", self.instance.round_duration_minutes if self.instance else None)
        test_duration_minutes = data.get("test_duration_minutes", self.instance.test_duration_minutes if self.instance else None)
        
        # For editing, status cannot be changed through API
        if self.instance and 'status' in data:
            data.pop('status', None)
        
        # Validate meeting link for interview rounds
        interview_rounds = ["gd", "technical", "hr"]
        if round_type in interview_rounds and not meeting_link:
            raise serializers.ValidationError(
                {
                    "meeting_link": "Meeting link is required for this round."
                }
            )
        
        # Validate round_start_datetime is not in the past for new rounds
        if round_start_datetime and not self.instance:
            if round_start_datetime < timezone.now():
                raise serializers.ValidationError(
                    {
                        "round_start_datetime": "Round start date and time cannot be in the past."
                    }
                )
        
        # Validate round_duration_minutes
        if round_duration_minutes and round_duration_minutes <= 0:
            raise serializers.ValidationError(
                {
                    "round_duration_minutes": "Round duration must be greater than 0."
                }
            )
        
        # Validate test_duration_minutes
        if test_duration_minutes and test_duration_minutes <= 0:
            raise serializers.ValidationError(
                {
                    "test_duration_minutes": "Test duration must be greater than 0."
                }
            )
        
        # Validate test_duration_minutes <= round_duration_minutes
        if round_duration_minutes and test_duration_minutes:
            if test_duration_minutes > round_duration_minutes:
                raise serializers.ValidationError(
                    {
                        "test_duration_minutes": "Test duration cannot be longer than round duration."
                    }
                )
        
        return data
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('round_start_datetime') is None:
            data['round_start_datetime'] = None
        return data

# Updated DriveRoundSerializer
class DriveRoundSerializer(serializers.ModelSerializer):
    round_end_datetime = serializers.SerializerMethodField()
    
    class Meta:
        model = RoundModel
        fields = ['id', 'round_type', 'round_order', 'status', 'meeting_link', 
                  'round_start_datetime', 'round_duration_minutes', 'test_duration_minutes',
                  'round_end_datetime', 'is_test_started', 'created_at', 'updated_at']
    
    def get_round_end_datetime(self, obj):
        return obj.get_round_end_datetime()
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('round_start_datetime') is None:
            data['round_start_datetime'] = None
        return data

class DriveDetailsSerializer(serializers.ModelSerializer):
    institute = InstituteSerializer(read_only=True)
    rounds = DriveRoundSerializer(many=True, read_only=True)
    class Meta:
        model = DriveModel
        fields = ['id', 'title', 'job_role', 'description', 'ctc', 'job_location', 'institute', 'status', 'drive_date_time', 'rounds', 'created_at', 'updated_at']

class AptitudeQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AptitudeQuestionModel
        fields = ['id', 'round', 'question', 'option_1', 'option_2', 'option_3', 'option_4', 'correct_option', 'marks', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    def validate_round(self, round_instance):
        if round_instance.round_type != "aptitude":
            raise serializers.ValidationError("Aptitude questions can only be added to an aptitude round.")
        return round_instance

class UploadAptitudeQuestionSerializer(serializers.Serializer):
    round_id = serializers.IntegerField(min_value=1)
    file = serializers.FileField()
    def validate_file(self, value):
        allowed_extensions = [".xlsx"]
        if not any(value.name.lower().endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(
                "Only .xlsx Excel files are allowed."
            )
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(
                "File size should not exceed 5 MB."
            )
        return value

class CodingQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingQuestionModel
        fields = ['id', 'round', 'problem_statement', 'description', 'difficulty', 'input_format', 'output_format', 'constraints', 'explanation', 'marks', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    def validate_round(self, round_instance):
        if round_instance.round_type != "coding":
            raise serializers.ValidationError("Coding questions can only be added to a coding round.")
        return round_instance

class CodingTestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingTestCaseModel
        fields = ['id', 'question', 'input_data', 'expected_output', 'is_sample', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    def validate_question(self, question):
        if question.round.round_type != "coding":
            raise serializers.ValidationError("Test cases can only be added to coding questions.")
        return question

class AptitudeResultSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    candidate_decision = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = RoundAttemptModel
        fields = [
            'attempt_id', 
            'candidate_name', 
            'score', 
            'total_marks', 
            'percentage',
            'status', 
            'submitted_at',
            'candidate_decision'
        ]
    
    def get_candidate_decision(self, obj):
        """Get the candidate's decision from RoundCandidateDecisionModel"""
        try:
            decision_obj = RoundCandidateDecisionModel.objects.get(attempt=obj)
            return {
                'decision': decision_obj.decision,
                'score': decision_obj.score,
                'total_marks': decision_obj.total_marks,
                'percentage': float(decision_obj.percentage)
            }
        except RoundCandidateDecisionModel.DoesNotExist:
            return None
    
    def get_percentage(self, obj):
        """Calculate percentage if not available in candidate_decision"""
        try:
            decision_obj = RoundCandidateDecisionModel.objects.get(attempt=obj)
            return float(decision_obj.percentage)
        except RoundCandidateDecisionModel.DoesNotExist:
            if obj.total_marks > 0:
                return round((obj.score / obj.total_marks) * 100, 2)
            return 0.0