from rest_framework import serializers
from .models import InstituteModel

class InstituteSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstituteModel
        fields = ['id', 'name', 'code', 'city', 'state', 'country', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_active', 'created_at', 'updated_at']