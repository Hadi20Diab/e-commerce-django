import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()

# When gunicorn uses --preload, the Django app is loaded in the master process
# and workers are forked from it. Each worker must close inherited DB connections
# so it creates its own fresh connection rather than sharing the master's.
try:
    from django.db import connections
    for conn in connections.all():
        conn.close()
except Exception:
    pass

