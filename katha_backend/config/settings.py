import os
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
# Read from environment; define DJANGO_SECRET_KEY in your .env or hosting env vars.
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'change-me-in-env')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',  # Required for social-auth
    
    # Third-party apps
    'rest_framework',                  # Django REST Framework
    'corsheaders',                     # Required for React to talk to Django
    'rest_framework_simplejwt',        # JWT Authentication
    'social_django',                   # OAuth/SSO support
    
    # Local apps
    'community.apps.CommunityConfig', 
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # Must be high up
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'katha_db',           # <-- Replace with your database name
        'USER': 'root',         # <-- Replace with your MySQL username
        'PASSWORD': 'password',  # <-- Replace with your MySQL password
        'HOST': '127.0.0.1',          # <-- Use 'localhost' or your server IP
        'PORT': '3306',               # <-- Default MySQL port
        
        # Optional: Required for MySQL to handle timezones and specific character sets
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        }
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Custom Settings for Decoupled App ---

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    # Allow the React frontend to access the Django API during development
    # Your React app runs here via Vite's default port
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]

# Django REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    )
}

# Simple JWT Configuration
SIMPLE_JWT = {
    # Shorter access token lifetime for security (used for API requests)
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5), 
    
    # Longer refresh token lifetime (used to silently request a new access token)
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14), 
    
    # Allows tokens to be used only once to generate new access tokens
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',), # Standard JWT header
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_OBTAIN_SERIALIZER': 'community.serializers.CustomTokenObtainPairSerializer',
}

# Google OAuth Configuration (for SSO)
# Note: Google OAuth is handled via custom view, not social-auth
# Set REACT_APP_GOOGLE_CLIENT_ID in frontend environment variables
