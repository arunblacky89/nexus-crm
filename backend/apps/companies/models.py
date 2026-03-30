import uuid
from django.db import models


class Company(models.Model):
    INDUSTRY_CHOICES = [
        ('Technology', 'Technology'),
        ('Manufacturing', 'Manufacturing'),
        ('Healthcare', 'Healthcare'),
        ('Finance', 'Finance'),
        ('Retail', 'Retail'),
        ('Real Estate', 'Real Estate'),
        ('Education', 'Education'),
        ('Construction', 'Construction'),
        ('Oil & Gas', 'Oil & Gas'),
        ('Recruitment', 'Recruitment'),
        ('Other', 'Other'),
    ]
    SIZE_CHOICES = [
        ('1-10', '1-10'),
        ('11-50', '11-50'),
        ('51-200', '51-200'),
        ('201-500', '201-500'),
        ('500+', '500+'),
    ]

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    name = models.CharField(max_length=200)
    website = models.URLField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES, blank=True)
    company_size = models.CharField(max_length=20, choices=SIZE_CHOICES, blank=True)
    annual_revenue = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    parent_company = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subsidiaries'
    )
    assigned_to = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_companies'
    )
    # Address
    street = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    # Social
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    linkedin_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    # Soft delete
    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_companies'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Companies'
        ordering = ['name']
