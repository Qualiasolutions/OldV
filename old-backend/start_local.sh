#! /bin/bash
python ./register_cron_jobs.py &

python manage.py runserver 0.0.0.0:8000