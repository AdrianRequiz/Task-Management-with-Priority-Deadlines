from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer, UserSerializer as BaseUserSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import User

User = get_user_model()

class RequestCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()

class VerifyAndRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    re_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['re_password']:
            raise serializers.ValidationError("Passwords do not match")
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Email already exists")
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError("Username already exists")
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            is_active=False,
            is_verified=False,
            role='user'
        )
        return user

class UserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'password')

class UserSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'role')

class UserProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField(read_only=True)
    first_name = serializers.CharField(allow_blank=True, required=False, max_length=150)
    last_name = serializers.CharField(allow_blank=True, required=False, max_length=150)
    bio = serializers.CharField(allow_blank=True, required=False, max_length=500)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'bio', 'avatar_url', 'role', 'date_joined']
        read_only_fields = ['id', 'email', 'username', 'role', 'date_joined']

    def get_avatar_url(self, obj):
        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def to_internal_value(self, data):
        mutable = data.copy()
        if 'avatar' in mutable and (mutable['avatar'] is None or mutable['avatar'] == ''):
            del mutable['avatar']
        allowed = {'first_name', 'last_name', 'bio', 'avatar'}
        for key in list(mutable.keys()):
            if key not in allowed:
                del mutable[key]
        return super().to_internal_value(mutable)

    def validate_avatar(self, value):
        if value == "" or value is None:
            return None
        return value