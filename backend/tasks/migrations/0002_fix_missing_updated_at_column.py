from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE tasks_task
                ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

                UPDATE tasks_task
                SET updated_at = created_at
                WHERE updated_at IS NULL;

                ALTER TABLE tasks_task
                ALTER COLUMN updated_at SET DEFAULT NOW();

                ALTER TABLE tasks_task
                ALTER COLUMN updated_at SET NOT NULL;
            """,
            reverse_sql="""
                ALTER TABLE tasks_task
                DROP COLUMN IF EXISTS updated_at;
            """,
        ),
    ]
