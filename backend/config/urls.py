from django.contrib import admin
from django.urls import path, include
from user.views import register_user, activate_account, UserProfileView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('djoser.urls')),
    path('api/', include('djoser.urls.jwt')),
    path('api/register/', register_user, name='register-user'),
    path('api/activate/', activate_account, name='activate-account'),
    path('api/profile/', UserProfileView.as_view(), name='user-profile'),
    path('api/', include('tasks.urls')),
    path('api/', include('chatbot.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)