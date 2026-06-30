from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("themes/", views.themes, name="themes"),
    path("drama/<slug:theme_slug>/", views.drama, name="drama"),
    path("card/<slug:theme_slug>/", views.card, name="card"),
    path("about/", views.about, name="about"),
    path("api/theme/<slug:theme_slug>/", views.api_theme_data, name="api_theme_data"),
]