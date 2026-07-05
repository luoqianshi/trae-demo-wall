from django.urls import path
from .views import *

urlpatterns = [
    path('stats/', AdminDashboardStatsView.as_view(), name='admin_stats'),
    path('users/', UserManagementView.as_view(), name='admin_users'),
    path('users/<int:user_id>/balance/', UserBalanceManagementView.as_view(), name='admin_user_balance'),
    path('merchants/', MerchantAuditView.as_view(), name='admin_merchants'),
    path('categories/', CategoryManagementView.as_view(), name='admin_categories'),
    path('products/', AdminProductManagementView.as_view(), name='admin_products'),
    path('orders/', AdminOrderManagementView.as_view(), name='admin_orders'),
    path('coupons/', CouponManagementView.as_view(), name='admin_coupons'),
    path('reviews/', AdminReviewManagementView.as_view(), name='admin_reviews'),
]
