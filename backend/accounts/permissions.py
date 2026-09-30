from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.conf import settings

class IsCitizen(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'CITIZEN')

class IsSanitationWorker(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['WORKER', 'SUPERVISOR', 'ADMIN'])

class IsSupervisor(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['SUPERVISOR', 'ADMIN'])

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_superuser))

class IsStaffOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['WORKER', 'SUPERVISOR', 'ADMIN'])

class IsSupervisorOrAdmin(BasePermission):
    """Only supervisors or admins can assign tasks. Allows unauthenticated fallback when DEMO_MODE is True."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return getattr(settings, 'DEMO_MODE', True)
        return bool(request.user.role in ['SUPERVISOR', 'ADMIN'] or request.user.is_superuser)

class IsAssignedWorkerOrSupervisor(BasePermission):
    """Only assigned worker or supervisor can transition their task."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return getattr(settings, 'DEMO_MODE', True)
        return bool(request.user.role in ['WORKER', 'SUPERVISOR', 'ADMIN'] or request.user.is_superuser)

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return getattr(settings, 'DEMO_MODE', True)
        if request.user.role in ['SUPERVISOR', 'ADMIN'] or request.user.is_superuser:
            return True
        return obj.worker_id == request.user.id

class IsReportOwnerOrStaff(BasePermission):
    """
    Citizens can only edit or delete their own reports;
    Staff can review and manage any report.
    """
    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if not (request.user and request.user.is_authenticated):
            return getattr(settings, 'DEMO_MODE', True)
        if request.user.role in ['SUPERVISOR', 'ADMIN', 'WORKER'] or request.user.is_superuser:
            return True
        return obj.citizen_id == request.user.id
