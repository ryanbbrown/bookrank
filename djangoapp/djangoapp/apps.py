from django.apps import AppConfig

class DjangoAppConfig(AppConfig):
    name = 'djangoapp'

    def ready(self):
        # Import views here to ensure the imports are executed
        import djangoapp.views
