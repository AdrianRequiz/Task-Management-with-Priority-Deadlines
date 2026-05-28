import os
from django.utils import timezone
from rest_framework import serializers
from .models import Project, Task

# Allowed file types and size
ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.docx', '.txt', '.xlsx']
ALLOWED_IMAGES = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


class SafeDateField(serializers.DateField):
    def to_representation(self, value):
        if hasattr(value, 'date'):
            value = value.date()
        return super().to_representation(value)


class ProjectSerializer(serializers.ModelSerializer):
    owner_email = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at', 'owner_email']

    def get_owner_email(self, obj):
        return obj.owner.email if obj.owner else None

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Project name cannot be empty.")
        if len(value) > 150:
            raise serializers.ValidationError("Project name must be at most 150 characters.")
        # Check uniqueness (case-insensitive) – exclude current instance if updating
        qs = Project.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A project with this name already exists.")
        return value.strip()

    def validate_description(self, value):
        if value and len(value) > 500:
            raise serializers.ValidationError("Description must be at most 500 characters.")
        return value


class TaskSerializer(serializers.ModelSerializer):
    is_overdue = serializers.SerializerMethodField()
    owner_email = serializers.SerializerMethodField()
    deadline = SafeDateField()

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'priority',
            'status', 'deadline', 'created_at', 'updated_at',
            'is_overdue', 'owner_email', 'attachment', 'image'
        ]

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Task title cannot be empty.")
        if len(value) > 200:
            raise serializers.ValidationError("Task title must be at most 200 characters.")
        return value.strip()

    def validate_description(self, value):
        if value and len(value) > 500:
            raise serializers.ValidationError("Description must be at most 500 characters.")
        return value

    def validate_deadline(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("Deadline cannot be in the past.")
        return value

    def validate_priority(self, value):
        if value not in ['LOW', 'MEDIUM', 'HIGH']:
            raise serializers.ValidationError("Priority must be LOW, MEDIUM, or HIGH.")
        return value

    def validate_project(self, value):
        if not Project.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Selected project does not exist.")
        return value

    def validate_attachment(self, value):
        # If the value is an empty string, treat it as None (no file)
        if value == "":
            return None
        if value:
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise serializers.ValidationError(
                    f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
                )
            if value.size > MAX_FILE_SIZE:
                raise serializers.ValidationError(
                    f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)} MB"
                )
        return value

    def validate_image(self, value):
        if value == "":
            return None
        if value:
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in ALLOWED_IMAGES:
                raise serializers.ValidationError("Only image files are allowed.")
            if value.size > MAX_FILE_SIZE:
                raise serializers.ValidationError("Image too large.")
        return value

    def get_is_overdue(self, obj):
        return obj.is_overdue

    def get_owner_email(self, obj):
        return obj.owner.email if obj.owner else None