from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('super_admin', 'admin')


class IsManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('super_admin', 'admin', 'manager')


class CRMObjectPermission(BasePermission):
    """Admin sees all; Manager sees team's; Sales Rep sees own."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role in ('super_admin', 'admin'):
            return True
        if user.role == 'manager':
            # Can see team members' records
            if hasattr(obj, 'assigned_to') and obj.assigned_to:
                return obj.assigned_to.team == user.team
            return True
        # sales_rep: only own records
        if hasattr(obj, 'assigned_to'):
            return obj.assigned_to == user
        return False
