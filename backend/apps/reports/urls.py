from django.urls import path
from .views import DashboardView, PipelineReportView, SalesByUserView, ActivitiesSummaryView, RevenueTrendView

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('pipeline/', PipelineReportView.as_view(), name='pipeline-report'),
    path('sales-by-user/', SalesByUserView.as_view(), name='sales-by-user'),
    path('activities-summary/', ActivitiesSummaryView.as_view(), name='activities-summary'),
    path('revenue-trend/', RevenueTrendView.as_view(), name='revenue-trend'),
]
