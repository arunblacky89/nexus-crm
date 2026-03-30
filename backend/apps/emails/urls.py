from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailTemplateViewSet, EmailLogViewSet

router = DefaultRouter()
router.register('templates', EmailTemplateViewSet, basename='email-templates')
router.register('logs', EmailLogViewSet, basename='email-logs')

urlpatterns = [
    path('', include(router.urls)),
]
