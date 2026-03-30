from django.db import models


class Notification(models.Model):
    TYPE_CHOICES = [
        ('deal_stage_change', 'Deal Stage Change'),
        ('activity_due', 'Activity Due'),
        ('lead_assigned', 'Lead Assigned'),
        ('contact_assigned', 'Contact Assigned'),
        ('deal_assigned', 'Deal Assigned'),
        ('mention', 'Mention'),
        ('system', 'System'),
    ]

    user = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.CASCADE, related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='system')
    object_id = models.IntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.user.username}] {self.title}'
