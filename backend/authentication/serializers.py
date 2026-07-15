from rest_framework import serializers
from .models import UserTable

class UserSerializers(serializers.ModelSerializer):
    class Meta:
        model = UserTable
        fields = ['id', 'name', 'email', 'date_of_birth', 'institute', 'password', 'role', 'is_active', 'date_joined', 'last_login']
        read_only_fields = ['id', 'role', 'is_active', 'date_joined', 'last_login']
        extra_kwargs = {"password": {"write_only": True}}
    def validate_institute(self, value):
        if value and not value.is_active:
            raise serializers.ValidationError("Selected institute is inactive.")
        return value
    def create(self, validated_data):
        return UserTable.objects.create_user(**validated_data)