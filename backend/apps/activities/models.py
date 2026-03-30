import uuid
from django.db import models


class Activity(models.Model):
    TYPE_CHOICES = [
        ('Call', 'Call'),
        ('Meeting', 'Meeting'),
        ('Task', 'Task'),
        ('Note', 'Note'),
        ('Email', 'Email'),
    ]
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    activity_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')
    assigned_to = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_activities'
    )
    related_lead = models.ForeignKey(
        'leads.Lead', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='activities'
    )
    related_contact = models.ForeignKey(
        'contacts.Contact', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='activities'
    )
    related_deal = models.ForeignKey(
        'deals.Deal', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='activities'
    )
    related_company = models.ForeignKey(
        'companies.Company', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='activities'
    )
    # Call-specific
    call_direction = models.CharField(max_length=10, choices=[('Inbound', 'Inbound'), ('Outbound', 'Outbound')], blank=True)
    call_duration_minutes = models.IntegerField(null=True, blank=True)
    call_result = models.CharField(max_length=30, choices=[
        ('Connected', 'Connected'), ('No Answer', 'No Answer'), ('Busy', 'Busy'),
        ('Left Voicemail', 'Left Voicemail'), ('Wrong Number', 'Wrong Number'),
    ], blank=True)
    call_recording_url = models.URLField(blank=True)
    # Meeting-specific
    location = models.CharField(max_length=200, blank=True)
    meeting_link = models.URLField(blank=True)
    meeting_type = models.CharField(max_length=20, choices=[
        ('In-Person', 'In-Person'), ('Video Call', 'Video Call'), ('Phone Call', 'Phone Call'),
    ], blank=True)
    attendees = models.ManyToManyField(
        'accounts.CustomUser', blank=True, related_name='meeting_attendees'
    )

    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_activities'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'[{self.activity_type}] {self.title}'

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Activities'
