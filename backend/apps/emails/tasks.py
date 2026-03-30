from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def send_email_task(to_email, subject, body, log_id=None):
    from .models import EmailLog
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=body,
            fail_silently=False,
        )
        if log_id:
            EmailLog.objects.filter(id=log_id).update(status='Sent')
        return f'Email sent to {to_email}'
    except Exception as e:
        if log_id:
            EmailLog.objects.filter(id=log_id).update(status='Failed')
        raise e
