from django.contrib import admin
from .models import Project, Task
from django.contrib.auth import get_user_model 

User = get_user_model()

admin.site.register(Project)
admin.site.register(Task)
admin.site.register(User)  

# Register your models here.
