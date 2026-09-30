from django.urls import path
from .views import MyNotificationsView, UnreadCountView, MarkReadView

urlpatterns = [
    path('', MyNotificationsView.as_view(), name='my-notifications'),
    path('unread-count/', UnreadCountView.as_view(), name='unread-count'),
    path('mark-read/', MarkReadView.as_view(), name='mark-read'),
]
