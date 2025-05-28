#! /bin/bash
python manage.py migrate

python ./register_cron_jobs.py &>> /var/log/uwsgi/api.log

uwsgi --ini /app/uwsgi.ini --static-map /api-static=/static
tail -f /var/log/uwsgi/api.log
