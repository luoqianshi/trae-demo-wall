from django.urls import path
from .views import (
    StudentInfoView, StudentCertifyView,
    StudentAddressListView, StudentAddressDetailView
)

urlpatterns = [
    # 学生信息相关
    path('info/', StudentInfoView.as_view(), name='student-info'),
    path('info/certify/', StudentCertifyView.as_view(), name='student-certify'),
    
    # 学生地址相关
    path('address/', StudentAddressListView.as_view(), name='student-address-list'),
    path('address/<int:address_id>/', StudentAddressDetailView.as_view(), name='student-address-detail'),
]