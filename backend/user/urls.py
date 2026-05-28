from django.urls import include, path

urlpatterns = [
    path('', include('djoser.urls')),          # /api/auth/ -> djoser endpoints
    path('', include('djoser.urls.jwt')),      # /api/auth/jwt/... for JWT
]