from django.db import models


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default='#3b82f6')  # hex color
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class CustomField(models.Model):
    MODULE_CHOICES = [
        ('lead', 'Lead'),
        ('contact', 'Contact'),
        ('company', 'Company'),
        ('deal', 'Deal'),
    ]
    FIELD_TYPE_CHOICES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('dropdown', 'Dropdown'),
        ('checkbox', 'Checkbox'),
        ('textarea', 'Textarea'),
    ]

    module = models.CharField(max_length=20, choices=MODULE_CHOICES)
    label = models.CharField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    options = models.JSONField(default=list, blank=True)  # For dropdown choices
    is_required = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.module} - {self.label}'

    class Meta:
        ordering = ['module', 'order']
