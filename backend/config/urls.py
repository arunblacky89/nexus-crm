from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/leads/', include('apps.leads.urls')),
    path('api/v1/contacts/', include('apps.contacts.urls')),
    path('api/v1/companies/', include('apps.companies.urls')),
    path('api/v1/deals/', include('apps.deals.urls')),
    path('api/v1/activities/', include('apps.activities.urls')),
    path('api/v1/emails/', include('apps.emails.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/settings/', include('apps.settings_app.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
