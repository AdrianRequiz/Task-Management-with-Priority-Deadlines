from datetime import datetime
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Project, Task
from .serializers import ProjectSerializer, TaskSerializer
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
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

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
        
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def overdue_tasks(request):
    if request.user.role == 'admin':
        tasks = Task.objects.filter(deadline__lt=timezone.localdate()).exclude(status=Task.StatusChoices.DONE)
    else:
        tasks = Task.objects.filter(owner=request.user, deadline__lt=timezone.localdate()).exclude(status=Task.StatusChoices.DONE)
    serializer = TaskSerializer(tasks, many=True)
    return Response({
        'count': tasks.count(),
        'results': serializer.data
    })


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'admin':
            tasks = Task.objects.all()
            projects = Project.objects.all()
        else:
            tasks = Task.objects.filter(owner=user)
            projects = Project.objects.filter(owner=user)

        todo = tasks.filter(status='TODO').count()
        in_progress = tasks.filter(status='IN_PROGRESS').count()
        done = tasks.filter(status='DONE').count()
        overdue = tasks.filter(deadline__lt=timezone.now().date(), status__in=['TODO', 'IN_PROGRESS']).count()
        project_count = projects.count()

        recent_tasks = tasks.order_by('-created_at')[:5]
        recent_tasks_data = [
            {'id': t.id, 'title': t.title, 'status': t.status, 'deadline': t.deadline}
            for t in recent_tasks
        ]

        return Response({
            'todo': todo,
            'in_progress': in_progress,
            'done': done,
            'overdue': overdue,
            'project_count': project_count,
            'recent_tasks': recent_tasks_data,
        })