from datetime import datetime

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Project, Task
from .serializers import ProjectSerializer, TaskSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related('project').all().order_by('deadline', '-created_at')
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        deadline_lte = self.request.query_params.get('deadline_lte')
        if deadline_lte:
            try:
                parsed_date = datetime.strptime(deadline_lte, '%Y-%m-%d').date()
                queryset = queryset.filter(deadline__lte=parsed_date)
            except ValueError:
                pass
        return queryset


@api_view(['GET'])
def overdue_tasks(request):
    tasks = Task.objects.filter(deadline__lt=timezone.localdate()).exclude(status=Task.StatusChoices.DONE)
    serializer = TaskSerializer(tasks, many=True)
    return Response(
        {
            'count': tasks.count(),
            'results': serializer.data,
        }
    )
