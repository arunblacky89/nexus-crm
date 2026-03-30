from celery import shared_task
from django.utils import timezone
from datetime import timedelta


@shared_task
def activity_due_reminder_task():
    from .models import Activity
    from apps.notifications.models import Notification

    now = timezone.now()
    one_hour_later = now + timedelta(hours=1)

    due_activities = Activity.objects.filter(
        is_deleted=False,
        completed=False,
        due_date__gte=now,
        due_date__lte=one_hour_later,
    ).select_related('assigned_to')

    created_count = 0
    for activity in due_activities:
        if activity.assigned_to:
            _, created = Notification.objects.get_or_create(
                user=activity.assigned_to,
                notification_type='activity_due',
                object_id=activity.id,
                defaults={
                    'title': f'Activity Due Soon: {activity.title}',
                    'message': f'Your {activity.activity_type} "{activity.title}" is due in less than 1 hour.',
                }
            )
            if created:
                created_count += 1

    return f'Created {created_count} activity due reminders.'
