from django.urls import path
from .views import (
    MerchantView, MerchantListView, MerchantDetailView,
    MerchantPublicView, MerchantDashboardStatsView, MyMerchantsView,
    MerchantRefundAuditView
)

urlpatterns = [
    # 用户操作
    path('my-merchants/', MyMerchantsView.as_view(), name='my_merchants'),

    # 商户自身操作
    path('info/', MerchantView.as_view(), name='merchant_info'),
    path('dashboard-stats/', MerchantDashboardStatsView.as_view(), name='merchant_dashboard_stats'),
    path('refund-audit/', MerchantRefundAuditView.as_view(), name='merchant_refund_audit'),

    # 管理员操作
    path('list/', MerchantListView.as_view(), name='merchant_list'),
    path('detail/<int:merchant_id>/', MerchantDetailView.as_view(), name='merchant_detail'),

    # 公开接口
    path('public/<int:merchant_id>/', MerchantPublicView.as_view(), name='merchant_public'),
]
