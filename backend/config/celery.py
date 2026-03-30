import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

app = Celery('crm')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat schedules
from celery.schedules import crontab

app.conf.beat_schedule = {
    'activity-due-reminders': {
        'task': 'apps.activities.tasks.activity_due_reminder_task',
        'schedule': crontab(minute=0),  # Every hour
    },
    'daily-report-email': {
        'task': 'apps.reports.tasks.daily_report_email_task',
        'schedule': crontab(hour=9, minute=0),  # 9 AM daily
    },
}
