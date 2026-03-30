import uuid
from django.db import models


class Pipeline(models.Model):
    name = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_default:
            Pipeline.objects.exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class PipelineStage(models.Model):
    pipeline = models.ForeignKey(Pipeline, on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0)
    probability = models.IntegerField(default=0)
    color = models.CharField(max_length=7, default='#3b82f6')

    def __str__(self):
        return f'{self.pipeline.name} → {self.name}'

    class Meta:
        ordering = ['pipeline', 'order']


class Deal(models.Model):
    DEAL_TYPE_CHOICES = [
        ('New Business', 'New Business'),
        ('Renewal', 'Renewal'),
        ('Upsell', 'Upsell'),
        ('Cross-sell', 'Cross-sell'),
    ]
    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('Won', 'Won'),
        ('Lost', 'Lost'),
        ('On Hold', 'On Hold'),
    ]

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='INR')
    pipeline = models.ForeignKey(Pipeline, on_delete=models.SET_NULL, null=True, related_name='deals')
    stage = models.ForeignKey(PipelineStage, on_delete=models.SET_NULL, null=True, related_name='deals')
    contact = models.ForeignKey(
        'contacts.Contact', on_delete=models.SET_NULL, null=True, blank=True, related_name='deals'
    )
    company = models.ForeignKey(
        'companies.Company', on_delete=models.SET_NULL, null=True, blank=True, related_name='deals'
    )
    assigned_to = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_deals'
    )
    expected_close_date = models.DateField(null=True, blank=True)
    actual_close_date = models.DateField(null=True, blank=True)
    deal_type = models.CharField(max_length=20, choices=DEAL_TYPE_CHOICES, default='New Business')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    lost_reason = models.CharField(max_length=200, blank=True)
    tags = models.ManyToManyField('settings_app.Tag', blank=True, related_name='deals')
    description = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_deals'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class DealStageHistory(models.Model):
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='stage_history')
    from_stage = models.ForeignKey(
        PipelineStage, on_delete=models.SET_NULL, null=True, related_name='history_from'
    )
    to_stage = models.ForeignKey(
        PipelineStage, on_delete=models.SET_NULL, null=True, related_name='history_to'
    )
    changed_by = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True
    )
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']
