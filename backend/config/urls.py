"""
URL Configuration for SwachDrishti.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/incidents/', include('incidents.urls')),
    path('api/hotspots/', include('hotspots.urls')),
    path('api/pickups/', include('pickups.urls')),
    path('api/operations/', include('operations.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/awareness/', include('awareness.urls')),
    path('api/ai/', include('ai_service.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
