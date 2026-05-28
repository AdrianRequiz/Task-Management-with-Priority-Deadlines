from django.db import models
from django.utils import timezone
from django.conf import settings

class Project(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='projects'
    )

    def __str__(self):
        return self.name


class Task(models.Model):
    class PriorityChoices(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'

    class StatusChoices(models.TextChoices):
        TODO = 'TODO', 'Todo'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        DONE = 'DONE', 'Done'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PriorityChoices.choices, default=PriorityChoices.MEDIUM)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.TODO)
    deadline = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='tasks'
    )
    attachment = models.FileField(
        upload_to='task_attachments/%Y/%m/%d/',
        null=True,
        blank=True
    )
    image = models.ImageField(
        upload_to='task_images/%Y/%m/%d/',
        null=True,
        blank=True
    )

    @property
    def is_overdue(self):
        return self.status != self.StatusChoices.DONE and self.deadline < timezone.localdate()

    def __str__(self):
        return f'{self.title} ({self.project.name})'