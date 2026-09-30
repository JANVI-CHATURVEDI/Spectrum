from rest_framework.permissions import BasePermission

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
