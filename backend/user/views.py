import random
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import EmailVerificationCode, User
from .serializers import (
    RequestCodeSerializer, VerifyAndRegisterSerializer, UserProfileSerializer,
    RegisterSerializer
)

# --------------------------
# Registration (post‑registration activation)
# --------------------------
@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    
    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    EmailVerificationCode.objects.filter(email=user.email).delete()
    EmailVerificationCode.objects.create(email=user.email, code=code)
    
    send_mail(
        subject='Activate your account',
        message=f'Your activation code is: {code}\nIt expires in 10 minutes.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return Response({'message': 'User created. Please check email for activation code.'}, status=status.HTTP_201_CREATED)

# --------------------------
# Activation endpoint (post‑registration, using 6-digit code)
# --------------------------
@api_view(['POST'])
def activate_account(request):
    email = request.data.get('email')
    code = request.data.get('code')
    if not email or not code:
        return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email, is_active=False)
        verification = EmailVerificationCode.objects.get(email=email, code=code)
        if not verification.is_valid():
            return Response({'error': 'Code expired'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = True
        user.is_verified = True
        user.save()
        verification.delete()
        return Response({'message': 'Account activated successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User not found or already active'}, status=status.HTTP_404_NOT_FOUND)
    except EmailVerificationCode.DoesNotExist:
        return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

# --------------------------
# Profile view (get/update)
# --------------------------
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --------------------------
# (Optional) Keep old pre‑registration endpoints if needed
# --------------------------
@api_view(['POST'])
def request_verification_code(request):
    serializer = RequestCodeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']

    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'User with this email already exists.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    EmailVerificationCode.objects.filter(email=email).delete()
    code = f"{random.randint(100000, 999999)}"
    EmailVerificationCode.objects.create(email=email, code=code)

    send_mail(
        subject='Your verification code',
        message=f'Your verification code is: {code}\nIt expires in 10 minutes.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
    return Response({'message': 'Verification code sent.'})

@api_view(['POST'])
def verify_and_register(request):
    serializer = VerifyAndRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']
    code = serializer.validated_data['code']
    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    try:
        verification = EmailVerificationCode.objects.get(email=email, code=code)
        if not verification.is_valid():
            return Response(
                {'error': 'Code expired.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except EmailVerificationCode.DoesNotExist:
        return Response(
            {'error': 'Invalid code.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    User.objects.create_user(
        email=email,
        username=username,
        password=password,
        is_active=True,
        is_verified=True,
        role='user'
    )
    verification.delete()
    return Response(
        {'message': 'User created successfully. Please log in.'},
        status=status.HTTP_201_CREATED
    )