import random
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import User, ActivationCode

@receiver(post_save, sender=User)
def send_activation_code(sender, instance, created, **kwargs):
    if created and not instance.is_active:
        code = f"{random.randint(100000, 999999)}"
        ActivationCode.objects.update_or_create(user=instance, defaults={'code': code})
        send_mail(
            subject='Activate your account',
            message=f'Your activation code is: {code}\nIt expires in 10 minutes.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.email],
            fail_silently=False,
        )