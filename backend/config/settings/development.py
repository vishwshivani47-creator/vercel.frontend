from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# Database: PostgreSQL with fallback to SQLite for local standalone development
DATABASES = {
    'default': env.db(
        'DATABASE_URL',
        default=f"postgres://{env('POSTGRES_USER', default='app_user')}:{env('POSTGRES_PASSWORD', default='change_me_super_secure_password_here')}@{env('POSTGRES_HOST', default='localhost')}:{env('POSTGRES_PORT', default='5432')}/{env('POSTGRES_DB', default='app_db')}"
    )
}

# If PostgreSQL connection cannot be made in local standalone dev, fallback to sqlite
import sys
if not os.environ.get('DATABASE_URL') and env('POSTGRES_HOST', default='') in ('', 'localhost', '127.0.0.1'):
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }

CORS_ALLOW_ALL_ORIGINS = True

# Disable WhiteNoise manifest caching in development for instant asset reload
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
