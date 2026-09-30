from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WasteStreamGuideListView, QuizQuestionListView, QuizAnswerCheckView,
    CollectionPointViewSet, QRCollectionPointLookupView
)

router = DefaultRouter()
router.register(r'points', CollectionPointViewSet, basename='collection-points')

urlpatterns = [
    path('streams/', WasteStreamGuideListView.as_view(), name='waste-streams'),
    path('quiz/', QuizQuestionListView.as_view(), name='quiz-questions'),
    path('quiz/<int:pk>/check/', QuizAnswerCheckView.as_view(), name='quiz-check'),
    path('qr/<str:code>/', QRCollectionPointLookupView.as_view(), name='qr-lookup'),
    path('', include(router.urls)),
]
