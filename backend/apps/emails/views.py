from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from .models import EmailTemplate, EmailLog
from .serializers import EmailTemplateSerializer, EmailLogSerializer, SendEmailSerializer
from .tasks import send_email_task


class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name', 'subject', 'category']
    filterset_fields = ['category']
    ordering = ['name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EmailLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'related_lead', 'related_contact', 'related_deal', 'sent_by']
    ordering = ['-sent_at']

    def get_queryset(self):
        qs = EmailLog.objects.all().select_related('sent_by')
        user = self.request.user
        if user.is_admin:
            return qs
        return qs.filter(sent_by=user)

    @action(detail=False, methods=['post'], url_path='send')
    def send(self, request):
        serializer = SendEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        log = EmailLog.objects.create(
            to_email=data['to_email'],
            from_email=settings.DEFAULT_FROM_EMAIL,
            subject=data['subject'],
            body=data['body'],
            status='Sent',
            related_lead_id=data.get('related_lead'),
            related_contact_id=data.get('related_contact'),
            related_deal_id=data.get('related_deal'),
            sent_by=request.user,
        )
        send_email_task.delay(data['to_email'], data['subject'], data['body'], log.id)
        return Response({'detail': 'Email queued.', 'log_id': log.id}, status=status.HTTP_201_CREATED)
