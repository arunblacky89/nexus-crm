from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the CRM with initial data (default pipeline, superuser, tags)'

    def handle(self, *args, **options):
        self.stdout.write('Seeding CRM...')

        # Create superuser
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@nexuscrm.com',
                password='admin123',
                first_name='Admin',
                last_name='User',
                role='super_admin',
            )
            self.stdout.write(self.style.SUCCESS('✓ Superuser created: admin / admin123'))

        # Create demo sales rep
        if not User.objects.filter(username='sales1').exists():
            User.objects.create_user(
                username='sales1',
                email='sales1@nexuscrm.com',
                password='sales123',
                first_name='Magesh',
                last_name='Kumar',
                role='sales_rep',
            )
            self.stdout.write(self.style.SUCCESS('✓ Demo sales rep: sales1 / sales123'))

        # Create default pipeline
        from apps.deals.models import Pipeline, PipelineStage
        if not Pipeline.objects.exists():
            pipeline = Pipeline.objects.create(name='Sales Pipeline', is_default=True)
            stages = [
                ('Prospecting', 10, '#64748b'),
                ('Qualified', 25, '#3b82f6'),
                ('Proposal Sent', 40, '#8b5cf6'),
                ('Negotiation', 60, '#f59e0b'),
                ('Won', 100, '#22c55e'),
                ('Lost', 0, '#ef4444'),
            ]
            for i, (name, prob, color) in enumerate(stages):
                PipelineStage.objects.create(
                    pipeline=pipeline, name=name, order=i,
                    probability=prob, color=color
                )
            self.stdout.write(self.style.SUCCESS('✓ Default pipeline created with 6 stages'))

        # Create default tags
        from apps.settings_app.models import Tag
        default_tags = [
            ('Hot', '#ef4444'),
            ('Warm', '#f59e0b'),
            ('Cold', '#3b82f6'),
            ('VIP', '#8b5cf6'),
            ('Follow Up', '#22c55e'),
        ]
        for name, color in default_tags:
            Tag.objects.get_or_create(name=name, defaults={'color': color})
        self.stdout.write(self.style.SUCCESS('✓ Default tags created'))

        self.stdout.write(self.style.SUCCESS('\n🎉 CRM seeded successfully!'))
        self.stdout.write('Login: http://localhost:8000/admin/ → admin / admin123')
        self.stdout.write('API:   http://localhost:8000/api/v1/auth/login/')
