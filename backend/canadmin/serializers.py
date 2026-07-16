from rest_framework import serializers
from .models import InstituteModel, DriveModel, RoundModel, AptitudeQuestionModel, CodingQuestionModel

class InstituteSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstituteModel
        fields = ['id', 'name', 'code', 'city', 'state', 'country', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_active', 'created_at', 'updated_at']

class DriveSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriveModel
        fields = ['id', 'title', 'job_role', 'description', 'ctc', 'job_location', 'institute', 'status', 'drive_date_time', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundModel
        fields = ['id', 'drive', 'round_type', 'round_order', 'status', 'meeting_link', 'duration_minutes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']
    def validate(self, data):
        round_type = data.get("round_type")
        meeting_link = data.get("meeting_link")
        interview_rounds = ["gd", "technical", "hr"]
        if round_type in interview_rounds and not meeting_link:
            raise serializers.ValidationError(
                {
                    "meeting_link": "Meeting link is required for this round."
                }
            )
        return data 
    
class AptitudeQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AptitudeQuestionModel
        fields = ['id', 'round', 'question', 'option_1', 'option_2', 'option_3', 'option_4', 'correct_option', 'marks', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    def validate_round(self, round_instance):
        if round_instance.round_type != "aptitude":
            raise serializers.ValidationError("Aptitude questions can only be added to an aptitude round.")
        return round_instance
    
class CodingQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingQuestionModel
        fields = ['id', 'round', 'problem_statement', 'description', 'difficulty', 'input_format', 'output_format', 'constraints', 'sample_input', 'sample_output', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    def validate_round(self, round_instance):
        if round_instance.round_type != "coding":
            raise serializers.ValidationError("Coding questions can only be added to a coding round.")
        return round_instance