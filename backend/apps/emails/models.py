from django.db import models


class EmailTemplate(models.Model):
    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=500)
    body = models.TextField()
    category = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class EmailLog(models.Model):
    STATUS_CHOICES = [
        ('Sent', 'Sent'),
        ('Failed', 'Failed'),
        ('Bounced', 'Bounced'),
        ('Opened', 'Opened'),
        ('Clicked', 'Clicked'),
    ]

    to_email = models.EmailField()
    from_email = models.EmailField()
    subject = models.CharField(max_length=500)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Sent')
    related_lead = models.ForeignKey(
        'leads.Lead', on_delete=models.SET_NULL, null=True, blank=True, related_name='email_logs'
    )
    related_contact = models.ForeignKey(
        'contacts.Contact', on_delete=models.SET_NULL, null=True, blank=True, related_name='email_logs'
    )
    related_deal = models.ForeignKey(
        'deals.Deal', on_delete=models.SET_NULL, null=True, blank=True, related_name='email_logs'
    )
    sent_at = models.DateTimeField(auto_now_add=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    sent_by = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self):
        return f'Email to {self.to_email}: {self.subject[:50]}'

    class Meta:
        ordering = ['-sent_at']
