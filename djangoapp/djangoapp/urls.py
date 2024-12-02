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
from django.urls import path
# from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/login/', views.LoginView.as_view()),
    path('api/search/', views.SearchView.as_view()),
    path('api/userbooks/', views.UserBooksView.as_view()),
    path('api/to-be-read/', views.ToBeReadView.as_view()),
    path('api/compare-book/', views.CompareBookView.as_view()),
    path('api/recommendations/', views.RecommendationView.as_view()),
    path('api/add-recommendations/', views.AddRecommendationView.as_view()),
    # path('api/chat/', views.ChatView.as_view()),
    path('api/goodreads-import/', views.GoodreadsImportView.as_view()),
    path('api/unranked-books/', views.UnrankedBooksView.as_view()),
    path('api/logout/', views.LogoutView.as_view()),
    path('api/signup/', views.SignupView.as_view()),
    path('', views.ReactAppView.as_view(), name='react-app'),
]
