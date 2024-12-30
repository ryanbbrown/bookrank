"""
URL configuration for djangoapp project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
# from django.contrib.auth.views import LogoutView
from . import views

router = DefaultRouter()
router.register(r'api/userbooks', views.UserBooksViewSet, basename='userbooks')
router.register(r'api/to-be-read', views.ToBeReadViewSet, basename='to-be-read')

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/login/', views.LoginView.as_view()),
    path('api/search/', views.SearchView.as_view()),
    path('api/compare-book/', views.CompareBookView.as_view()),
    path('api/recommendations/', views.RecommendationView.as_view()),
    # path('api/add-recommendations/', views.AddRecommendationView.as_view()),
    # path('api/chat/', views.ChatView.as_view()),
    path('api/goodreads-import/', views.GoodreadsImportView.as_view()),
    path('api/unranked-books/', views.UnrankedBooksView.as_view()),
    path('api/logout/', views.LogoutView.as_view()),
    path('api/signup/', views.SignupView.as_view()),
    path('api/user/', views.UserView.as_view(), name='user'),
    path('', views.ReactAppView.as_view(), name='react-app'),
    path('', include(router.urls)),
]
