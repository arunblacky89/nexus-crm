from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.leads.models import Lead
        from apps.contacts.models import Contact
        from apps.companies.models import Company
        from apps.deals.models import Deal
        from apps.activities.models import Activity

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)

        user = request.user

        def lead_qs():
            qs = Lead.objects.filter(is_deleted=False)
            if not user.is_admin:
                if user.is_manager and user.team:
                    qs = qs.filter(assigned_to__in=user.team.members.all())
                else:
                    qs = qs.filter(assigned_to=user)
            return qs

        def deal_qs():
            qs = Deal.objects.filter(is_deleted=False)
            if not user.is_admin:
                if user.is_manager and user.team:
                    qs = qs.filter(assigned_to__in=user.team.members.all())
                else:
                    qs = qs.filter(assigned_to=user)
            return qs

        leads = lead_qs()
        deals = deal_qs()

        total_leads = leads.count()
        leads_this_month = leads.filter(created_at__gte=month_start).count()
        leads_last_month = leads.filter(created_at__gte=last_month_start, created_at__lt=month_start).count()
        leads_converted = leads.filter(converted=True).count()

        total_contacts = Contact.objects.filter(is_deleted=False).count()
        total_companies = Company.objects.filter(is_deleted=False).count()
        total_deals = deals.count()

        won_this_month = deals.filter(status='Won', actual_close_date__gte=month_start.date())
        won_this_month_agg = won_this_month.aggregate(count=Count('id'), value=Sum('amount'))

        lost_this_month = deals.filter(status='Lost', actual_close_date__gte=month_start.date())
        lost_this_month_agg = lost_this_month.aggregate(count=Count('id'), value=Sum('amount'))

        open_deals_value = deals.filter(status='Open').aggregate(total=Sum('amount'))['total'] or 0

        activities_due_today = Activity.objects.filter(
            is_deleted=False, completed=False,
            due_date__date=now.date()
        ).count()
        overdue_activities = Activity.objects.filter(
            is_deleted=False, completed=False,
            due_date__lt=now
        ).count()

        # Pipeline by stage
        from apps.deals.models import PipelineStage, Pipeline
        default_pipeline = Pipeline.objects.filter(is_default=True).first()
        pipeline_by_stage = []
        if default_pipeline:
            for stage in default_pipeline.stages.all():
                stage_deals = deals.filter(stage=stage, status='Open')
                agg = stage_deals.aggregate(count=Count('id'), value=Sum('amount'))
                pipeline_by_stage.append({
                    'stage': stage.name,
                    'color': stage.color,
                    'count': agg['count'] or 0,
                    'value': float(agg['value'] or 0),
                })

        # Recent activities
        recent_activities = Activity.objects.filter(is_deleted=False).order_by('-created_at')[:10]
        recent_activities_data = [
            {
                'id': a.id,
                'type': a.activity_type,
                'title': a.title,
                'due_date': a.due_date,
                'completed': a.completed,
                'assigned_to': a.assigned_to.get_full_name() if a.assigned_to else None,
            }
            for a in recent_activities
        ]

        # Top performers
        from django.contrib.auth import get_user_model
        User = get_user_model()
        top_performers_qs = deals.filter(
            status='Won', actual_close_date__gte=month_start.date()
        ).values('assigned_to__id', 'assigned_to__first_name', 'assigned_to__last_name', 'assigned_to__username'
        ).annotate(
            deals_won=Count('id'), revenue=Sum('amount')
        ).order_by('-revenue')[:5]

        top_performers = [
            {
                'user_id': p['assigned_to__id'],
                'name': f"{p['assigned_to__first_name']} {p['assigned_to__last_name']}".strip() or p['assigned_to__username'],
                'deals_won': p['deals_won'],
                'revenue': float(p['revenue'] or 0),
            }
            for p in top_performers_qs
        ]

        # Lead source distribution
        lead_sources = leads.values('lead_source').annotate(count=Count('id')).order_by('-count')

        return Response({
            'total_leads': total_leads,
            'leads_this_month': leads_this_month,
            'leads_last_month': leads_last_month,
            'leads_converted': leads_converted,
            'total_contacts': total_contacts,
            'total_companies': total_companies,
            'total_deals': total_deals,
            'deals_won_this_month': {
                'count': won_this_month_agg['count'] or 0,
                'value': float(won_this_month_agg['value'] or 0),
            },
            'deals_lost_this_month': {
                'count': lost_this_month_agg['count'] or 0,
                'value': float(lost_this_month_agg['value'] or 0),
            },
            'open_deals_value': float(open_deals_value),
            'activities_due_today': activities_due_today,
            'overdue_activities': overdue_activities,
            'pipeline_by_stage': pipeline_by_stage,
            'recent_activities': recent_activities_data,
            'top_performers': top_performers,
            'lead_sources': list(lead_sources),
        })


class PipelineReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.deals.models import Deal, PipelineStage, Pipeline
        pipeline_id = request.query_params.get('pipeline_id')

        pipelines = Pipeline.objects.all()
        if pipeline_id:
            pipelines = pipelines.filter(id=pipeline_id)

        result = []
        for pipeline in pipelines:
            stages_data = []
            for stage in pipeline.stages.all():
                deals = Deal.objects.filter(stage=stage, is_deleted=False)
                agg = deals.aggregate(count=Count('id'), value=Sum('amount'))
                stages_data.append({
                    'stage_id': stage.id,
                    'stage_name': stage.name,
                    'color': stage.color,
                    'probability': stage.probability,
                    'count': agg['count'] or 0,
                    'value': float(agg['value'] or 0),
                })
            result.append({'pipeline': pipeline.name, 'stages': stages_data})

        return Response(result)


class SalesByUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.deals.models import Deal
        from django.contrib.auth import get_user_model
        User = get_user_model()

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        data = Deal.objects.filter(
            is_deleted=False, status='Won', actual_close_date__gte=month_start.date()
        ).values(
            'assigned_to__id', 'assigned_to__first_name',
            'assigned_to__last_name', 'assigned_to__username'
        ).annotate(
            deals_won=Count('id'), revenue=Sum('amount'), avg_deal=Sum('amount')
        ).order_by('-revenue')

        result = []
        for d in data:
            result.append({
                'user_id': d['assigned_to__id'],
                'name': f"{d['assigned_to__first_name']} {d['assigned_to__last_name']}".strip() or d['assigned_to__username'],
                'deals_won': d['deals_won'],
                'revenue': float(d['revenue'] or 0),
            })
        return Response(result)


class ActivitiesSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.activities.models import Activity
        summary = Activity.objects.filter(is_deleted=False).values('activity_type').annotate(
            total=Count('id'),
            completed=Count('id', filter=Q(completed=True)),
            pending=Count('id', filter=Q(completed=False)),
        )
        return Response(list(summary))


class RevenueTrendView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.deals.models import Deal
        from django.db.models.functions import TruncMonth

        data = Deal.objects.filter(
            is_deleted=False, status='Won', actual_close_date__isnull=False
        ).annotate(
            month=TruncMonth('actual_close_date')
        ).values('month').annotate(
            revenue=Sum('amount'), count=Count('id')
        ).order_by('month')

        result = [
            {
                'month': d['month'].strftime('%b %Y') if d['month'] else None,
                'revenue': float(d['revenue'] or 0),
                'count': d['count'],
            }
            for d in data
        ]
        return Response(result)
