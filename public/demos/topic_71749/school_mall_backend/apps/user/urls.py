from django.urls import path
from .views import (
    UserRegisterView, UserLoginView, UserInfoView, UserPasswordView, UserBalanceView,
    UserRechargeView, UserRechargeConfirmView, UserRechargeRecordsView,
    RechargeAlipayNotifyView, ContactAdminView, RechargePaymentStatusView
)

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('info/', UserInfoView.as_view(), name='user-info'),
    path('password/', UserPasswordView.as_view(), name='user-password'),
    path('balance/', UserBalanceView.as_view(), name='user-balance'),
    path('recharge/', UserRechargeView.as_view(), name='user-recharge'),
    path('recharge/<int:record_id>/confirm/', UserRechargeConfirmView.as_view(), name='user-recharge-confirm'),
    path('recharge/<int:record_id>/payment-status/', RechargePaymentStatusView.as_view(), name='recharge-payment-status'),
    path('recharge/records/', UserRechargeRecordsView.as_view(), name='user-recharge-records'),
    path('recharge/alipay/notify/', RechargeAlipayNotifyView.as_view(), name='recharge-alipay-notify'),
    path('contact-admin/', ContactAdminView.as_view(), name='contact-admin'),
]