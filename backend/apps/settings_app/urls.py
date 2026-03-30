from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TagViewSet, CustomFieldViewSet

router = DefaultRouter()
router.register('tags', TagViewSet, basename='tags')
router.register('custom-fields', CustomFieldViewSet, basename='custom-fields')

urlpatterns = [
    path('', include(router.urls)),
]
