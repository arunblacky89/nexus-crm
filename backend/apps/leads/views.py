import csv
import io
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Lead
from .serializers import LeadSerializer
from .filters import LeadFilter


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = LeadFilter
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'company_name']
    ordering_fields = ['first_name', 'last_name', 'created_at', 'lead_score', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Lead.objects.filter(is_deleted=False).select_related('assigned_to', 'created_by').prefetch_related('tags')
        user = self.request.user
        if user.is_admin:
            return qs
        if user.is_manager:
            team_members = user.team.members.all() if user.team else []
            return qs.filter(assigned_to__in=team_members)
        return qs.filter(assigned_to=user)

    def perform_create(self, serializer):
        lead = serializer.save(
            created_by=self.request.user,
            assigned_to=serializer.validated_data.get('assigned_to') or self.request.user
        )
        from .tasks import lead_score_update_task
        lead_score_update_task.delay(lead.id)

    def perform_update(self, serializer):
        lead = serializer.save()
        from .tasks import lead_score_update_task
        lead_score_update_task.delay(lead.id)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.is_deleted = True
        obj.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='convert')
    def convert(self, request, pk=None):
        lead = self.get_object()
        if lead.converted:
            return Response({'detail': 'Lead already converted.'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.contacts.models import Contact
        from apps.companies.models import Company
        from apps.deals.models import Deal, Pipeline

        # Create or get company
        company = None
        if lead.company_name:
            company, _ = Company.objects.get_or_create(
                name=lead.company_name,
                defaults={
                    'assigned_to': request.user,
                    'created_by': request.user,
                }
            )

        # Create contact
        contact = Contact.objects.create(
            first_name=lead.first_name,
            last_name=lead.last_name,
            email=lead.email,
            phone=lead.phone,
            mobile=lead.mobile,
            job_title=lead.job_title,
            company=company,
            lead=lead,
            assigned_to=lead.assigned_to or request.user,
            city=lead.city,
            state=lead.state,
            country=lead.country,
            created_by=request.user,
        )

        # Create deal if requested
        deal = None
        create_deal = request.data.get('create_deal', False)
        if create_deal:
            pipeline = Pipeline.objects.filter(is_default=True).first()
            if pipeline:
                first_stage = pipeline.stages.order_by('order').first()
                if first_stage:
                    deal = Deal.objects.create(
                        title=request.data.get('deal_title', f'Deal - {lead.full_name}'),
                        amount=request.data.get('deal_amount', 0),
                        pipeline=pipeline,
                        stage=first_stage,
                        contact=contact,
                        company=company,
                        assigned_to=lead.assigned_to or request.user,
                        created_by=request.user,
                    )

        lead.converted = True
        lead.converted_at = timezone.now()
        lead.status = 'Converted'
        lead.save()

        return Response({
            'detail': 'Lead converted successfully.',
            'contact_id': contact.id,
            'contact_uuid': str(contact.uuid),
            'company_id': company.id if company else None,
            'deal_id': deal.id if deal else None,
        })

    @action(detail=False, methods=['post'], url_path='bulk-assign')
    def bulk_assign(self, request):
        ids = request.data.get('ids', [])
        user_id = request.data.get('assigned_to')
        if not ids or not user_id:
            return Response({'detail': 'ids and assigned_to required.'}, status=status.HTTP_400_BAD_REQUEST)
        updated = Lead.objects.filter(id__in=ids, is_deleted=False).update(assigned_to_id=user_id)
        return Response({'updated': updated})

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'detail': 'ids required.'}, status=status.HTTP_400_BAD_REQUEST)
        updated = Lead.objects.filter(id__in=ids, is_deleted=False).update(is_deleted=True)
        return Response({'deleted': updated})

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        qs = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="leads.csv"'
        writer = csv.writer(response)
        writer.writerow(['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Priority', 'Lead Score', 'Created At'])
        for lead in qs:
            writer.writerow([
                lead.first_name, lead.last_name, lead.email, lead.phone,
                lead.company_name, lead.status, lead.lead_source, lead.priority,
                lead.lead_score, lead.created_at.strftime('%Y-%m-%d')
            ])
        return response

    @action(detail=False, methods=['post'], url_path='import', parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        decoded = file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        created_count = 0
        errors = []

        for i, row in enumerate(reader, 1):
            try:
                Lead.objects.create(
                    first_name=row.get('First Name', '').strip(),
                    last_name=row.get('Last Name', '').strip(),
                    email=row.get('Email', '').strip(),
                    phone=row.get('Phone', '').strip(),
                    company_name=row.get('Company', '').strip(),
                    lead_source=row.get('Source', 'Other').strip(),
                    status=row.get('Status', 'New').strip(),
                    priority=row.get('Priority', 'Medium').strip(),
                    assigned_to=request.user,
                    created_by=request.user,
                )
                created_count += 1
            except Exception as e:
                errors.append({'row': i, 'error': str(e)})

        return Response({'created': created_count, 'errors': errors})
