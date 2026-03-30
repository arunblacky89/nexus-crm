from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Team

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'full_name', 'role', 'team', 'is_active']
    list_filter = ['role', 'team', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('CRM Info', {'fields': ('role', 'team', 'phone', 'avatar', 'timezone')}),
    )

    def full_name(self, obj):
        return obj.get_full_name()

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'manager', 'created_at']
