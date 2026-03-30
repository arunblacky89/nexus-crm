from celery import shared_task


@shared_task
def lead_score_update_task(lead_id):
    from .models import Lead
    try:
        lead = Lead.objects.get(id=lead_id)
    except Lead.DoesNotExist:
        return

    score = 0
    if lead.email:
        score += 20
    if lead.phone or lead.mobile:
        score += 15
    if lead.company_name:
        score += 15

    # Activity count (each +5, max 30)
    activity_count = lead.activities.filter(is_deleted=False).count() if hasattr(lead, 'activities') else 0
    score += min(activity_count * 5, 30)

    # Source scoring
    high_value_sources = ['LinkedIn', 'Referral']
    if lead.lead_source in high_value_sources:
        score += 20
    else:
        score += 10

    # Recent contact bonus
    from django.utils import timezone
    from datetime import timedelta
    recent_activity = lead.activities.filter(
        created_at__gte=timezone.now() - timedelta(days=7)
    ).exists() if hasattr(lead, 'activities') else False
    if recent_activity:
        score += 10

    lead.lead_score = min(score, 100)
    lead.save(update_fields=['lead_score'])
    return f'Lead {lead_id} score updated to {lead.lead_score}'
