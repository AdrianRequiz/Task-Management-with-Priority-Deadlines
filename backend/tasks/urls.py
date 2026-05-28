from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TaskViewSet, overdue_tasks
from .views import DashboardStatsView

router = DefaultRouter()
router.register('projects', ProjectViewSet, basename='project')
router.register('tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('tasks/overdue/', overdue_tasks, name='overdue-tasks'),
    path('', include(router.urls)),
      path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats')
]