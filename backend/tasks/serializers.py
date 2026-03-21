from django.utils import timezone
from rest_framework import serializers

from .models import Project, Task


class SafeDateField(serializers.DateField):
    def to_representation(self, value):
        if hasattr(value, 'date'):
            value = value.date()
        return super().to_representation(value)


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    is_overdue = serializers.SerializerMethodField()
    deadline = SafeDateField()

    class Meta:
        model = Task
        fields = [
            'id',
            'project',
            'title',
            'description',
            'priority',
            'status',
            'deadline',
            'created_at',
            'updated_at',
            'is_overdue',
        ]

    def validate_deadline(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError('Deadline cannot be in the past.')
        return value

    def get_is_overdue(self, obj):
        return obj.is_overdue
