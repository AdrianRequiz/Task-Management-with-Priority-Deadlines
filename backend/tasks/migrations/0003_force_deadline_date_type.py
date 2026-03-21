from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('tasks', '0002_fix_missing_updated_at_column'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE tasks_task
                ALTER COLUMN deadline TYPE date
                USING deadline::date;
            """,
            reverse_sql="""
                ALTER TABLE tasks_task
                ALTER COLUMN deadline TYPE timestamp with time zone
                USING deadline::timestamp with time zone;
            """,
        ),
    ]
