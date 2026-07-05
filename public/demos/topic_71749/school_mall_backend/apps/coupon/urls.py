from django.urls import path
from .views import (
    CouponView, CouponDetailView, UserCouponView, UserCouponDetailView,
    CouponAutoSendView, CouponSendView
)

urlpatterns = [
    # 优惠券管理（管理员）
    path('admin/', CouponView.as_view(), name='coupon-admin'),
    path('admin/<int:coupon_id>/', CouponDetailView.as_view(), name='coupon-admin-detail'),
    
    # 用户优惠券管理
    path('user/', UserCouponView.as_view(), name='user-coupon'),
    path('user/list/', UserCouponView.as_view(), name='user-coupon-list'),
    path('user/<int:user_coupon_id>/', UserCouponDetailView.as_view(), name='user-coupon-detail'),
    
    # 自动发放优惠券
    path('auto-send/', CouponAutoSendView.as_view(), name='coupon-auto-send'),
    
    # 管理员按范围发放优惠券
    path('send/', CouponSendView.as_view(), name='coupon-send'),
]