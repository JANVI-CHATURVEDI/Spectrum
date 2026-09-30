from django.urls import path
from .views import AIClassifyView, NLAdminSearchView, AIInsightsView

urlpatterns = [
    path('classify/', AIClassifyView.as_view(), name='ai-classify'),
    path('search/', NLAdminSearchView.as_view(), name='ai-search'),
    path('insights/', AIInsightsView.as_view(), name='ai-insights'),
]
