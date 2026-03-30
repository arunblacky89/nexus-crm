import uuid
from django.db import models


class Lead(models.Model):
    SOURCE_CHOICES = [
        ('Website', 'Website'),
        ('Cold Call', 'Cold Call'),
        ('Email', 'Email'),
        ('LinkedIn', 'LinkedIn'),
        ('Referral', 'Referral'),
        ('Trade Show', 'Trade Show'),
        ('WhatsApp', 'WhatsApp'),
        ('Walk-in', 'Walk-in'),
        ('Other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('New', 'New'),
        ('Contacted', 'Contacted'),
        ('Qualified', 'Qualified'),
        ('Unqualified', 'Unqualified'),
        ('Lost', 'Lost'),
        ('Converted', 'Converted'),
    ]
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    company_name = models.CharField(max_length=200, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    lead_source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='Other')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='New')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')
    assigned_to = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_leads'
    )
    tags = models.ManyToManyField('settings_app.Tag', blank=True, related_name='leads')
    lead_score = models.IntegerField(default=0)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    converted = models.BooleanField(default=False)
    converted_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_leads'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    class Meta:
        ordering = ['-created_at']
