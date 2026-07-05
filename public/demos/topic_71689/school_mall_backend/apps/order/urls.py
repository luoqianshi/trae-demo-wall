from django.urls import path
from .views import (
    ShoppingCartView, ShoppingCartDetailView, ShoppingCartSelectView, ShoppingCartClearView,
    OrderView, OrderDetailView, OrderPaymentView, OrderPaymentStatusView, OrderReceiveView, OrderRefundView,
    OrderRefundStatusView, LogisticsView, MerchantOrderView, MerchantOrderShipView,
    MerchantLogisticsUpdateView, AdminOrderView, AdminOrderDetailView, AdminLogisticsView,
    AlipayPaymentView, AlipayNotifyView, AlipayQueryView
)

urlpatterns = [
    # 购物车相关
    path('cart/', ShoppingCartView.as_view(), name='shopping-cart'),
    path('cart/<int:cart_id>/', ShoppingCartDetailView.as_view(), name='shopping-cart-detail'),
    path('cart/select/', ShoppingCartSelectView.as_view(), name='shopping-cart-select'),
    path('cart/clear/', ShoppingCartClearView.as_view(), name='shopping-cart-clear'),

    # 订单相关
    path('', OrderView.as_view(), name='order'),
    path('<int:order_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('payment/', OrderPaymentView.as_view(), name='order-payment'),
    path('<int:order_id>/payment-status/', OrderPaymentStatusView.as_view(), name='order-payment-status'),
    path('<int:order_id>/receive/', OrderReceiveView.as_view(), name='order-receive'),
    path('<int:order_id>/refund/', OrderRefundView.as_view(), name='order-refund'),
    path('<int:order_id>/refund-status/', OrderRefundStatusView.as_view(), name='order-refund-status'),

    # 物流相关
    path('<int:order_id>/logistics/', LogisticsView.as_view(), name='order-logistics'),

    # 商户相关
    path('merchant/list/', MerchantOrderView.as_view(), name='merchant-order-list'),
    path('merchant/ship/<int:order_id>/', MerchantOrderShipView.as_view(), name='merchant-order-ship'),
    path('merchant/logistics/<int:order_id>/', MerchantLogisticsUpdateView.as_view(), name='merchant-logistics-update'),

    # 管理员相关
    path('admin/', AdminOrderView.as_view(), name='admin-order'),
    path('admin/<int:order_id>/', AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path('admin/logistics/<int:logistics_id>/', AdminLogisticsView.as_view(), name='admin-logistics'),

    # 支付宝支付相关
    path('alipay/pay/', AlipayPaymentView.as_view(), name='alipay-payment'),
    path('alipay/notify/', AlipayNotifyView.as_view(), name='alipay-notify'),
    path('alipay/query/', AlipayQueryView.as_view(), name='alipay-query'),
]