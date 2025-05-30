# Generated by Django 4.0.4 on 2023-09-26 12:31

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_referencessetupcompletion'),
    ]

    operations = [
        migrations.CreateModel(
            name='EntityTypeSetupCompletion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entity_type', models.CharField(max_length=127)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='entity_type_completions', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
