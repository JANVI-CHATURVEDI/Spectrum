from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok", "service": "SwachDrishti API"})

urlpatterns = [
    path('health', health_check),
    path('health/', health_check),
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

if settings.DEBUG or not getattr(settings, 'USE_NEON_OBJECT_STORAGE', False):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
