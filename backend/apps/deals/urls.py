from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PipelineViewSet, PipelineStageViewSet, DealViewSet

router = DefaultRouter()
router.register('pipelines', PipelineViewSet, basename='pipelines')
router.register('stages', PipelineStageViewSet, basename='stages')
router.register('', DealViewSet, basename='deals')

urlpatterns = [
    path('', include(router.urls)),
]
