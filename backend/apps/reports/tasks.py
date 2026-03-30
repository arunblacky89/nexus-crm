from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def daily_report_email_task():
    from apps.leads.models import Lead
    from apps.deals.models import Deal
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from django.db.models import Sum, Count

    User = get_user_model()
    now = timezone.now()
    today = now.date()

    total_leads = Lead.objects.filter(is_deleted=False).count()
    open_deals = Deal.objects.filter(is_deleted=False, status='Open')
    open_deals_agg = open_deals.aggregate(count=Count('id'), value=Sum('amount'))

    subject = f'NexusCRM Daily Summary — {today}'
    message = f"""
NexusCRM Daily Summary

Date: {today}

📊 Overview:
- Total Leads: {total_leads}
- Open Deals: {open_deals_agg['count'] or 0}
- Open Deal Value: ₹{float(open_deals_agg['value'] or 0):,.2f}

Log in to NexusCRM for full details.
"""

    admin_emails = list(User.objects.filter(role__in=['super_admin', 'admin'], is_active=True).values_list('email', flat=True))
    if admin_emails:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,
            fail_silently=True,
        )

    return f'Daily report sent to {len(admin_emails)} admin(s).'
