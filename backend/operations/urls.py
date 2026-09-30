from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskAssignmentViewSet, AssignTaskView, TransitionTaskStatusView, SupervisorTeamSummaryView

router = DefaultRouter()
router.register(r'tasks', TaskAssignmentViewSet, basename='tasks')

urlpatterns = [
    path('assign/', AssignTaskView.as_view(), name='assign-task'),
    path('tasks/<int:pk>/transition/', TransitionTaskStatusView.as_view(), name='task-transition'),
    path('team-summary/', SupervisorTeamSummaryView.as_view(), name='team-summary'),
    path('', include(router.urls)),
]
