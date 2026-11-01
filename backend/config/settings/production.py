from .base import *

DEBUG = False

ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['localhost', '127.0.0.1', 'backend', 'web', '.onrender.com'])

# PostgreSQL is required for production, with fallback to SQLite if DB is not yet provisioned
if os.environ.get('DATABASE_URL'):
    DATABASES = {'default': env.db('DATABASE_URL')}
elif env('POSTGRES_HOST', default=''):
    DATABASES = {
        'default': env.db(
            'DATABASE_URL',
            default=f"postgres://{env('POSTGRES_USER', default='app_user')}:{env('POSTGRES_PASSWORD', default='')}@{env('POSTGRES_HOST', default='localhost')}:{env('POSTGRES_PORT', default='5432')}/{env('POSTGRES_DB', default='app_db')}"
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Production Security
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=False)
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=False)

# WhiteNoise production caching
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
