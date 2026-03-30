import uuid
from django.db import models


class Contact(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    whatsapp = models.CharField(max_length=20, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    company = models.ForeignKey(
        'companies.Company', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='contacts'
    )
    lead = models.OneToOneField(
        'leads.Lead', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='converted_contact'
    )
    assigned_to = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_contacts'
    )
    tags = models.ManyToManyField('settings_app.Tag', blank=True, related_name='contacts')
    linkedin_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    street = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to='contact_avatars/', null=True, blank=True)
    do_not_contact = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_contacts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    class Meta:
        ordering = ['first_name', 'last_name']
