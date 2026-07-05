from django.urls import path
from .views import (
    ProductCategoryView, ProductCategoryDetailView, ProductCategoryListView,
    ProductView, ProductPublicListView, ProductPublicDetailView,
    ProductRecommendView, ProductHotView, CollectionView, CollectionDetailView,
    ProductReviewView, MerchantCategoryListView, GlobalSearchView,
    MerchantProductStatusView, MerchantProductDetailView
)

urlpatterns = [
    # 商品分类相关（管理员）
    path('admin/category/', ProductCategoryView.as_view(), name='admin-product-category'),
    path('admin/category/<int:category_id>/', ProductCategoryDetailView.as_view(), name='admin-product-category-detail'),
    
    # 商品分类相关（公开）
    path('category/list/', ProductCategoryListView.as_view(), name='product-category-list'),
    path('category/merchant/<int:merchant_id>/', MerchantCategoryListView.as_view(), name='merchant-product-category-list'),
    
    # 商品相关（商户）
    path('merchant/list/', ProductView.as_view(), name='merchant-product-list'),
    path('merchant/add/', ProductView.as_view(), name='merchant-product-add'),
    path('merchant/detail/<int:product_id>/', MerchantProductDetailView.as_view(), name='merchant-product-detail'),
    path('merchant/status/<int:product_id>/', MerchantProductStatusView.as_view(), name='merchant-product-status'),
    
    # 商品相关（公开）
    path('list/', ProductPublicListView.as_view(), name='product-list'),
    path('detail/<int:product_id>/', ProductPublicDetailView.as_view(), name='product-detail'),
    path('recommend/', ProductRecommendView.as_view(), name='product-recommend'),
    path('hot/', ProductHotView.as_view(), name='product-hot'),
    path('global-search/', GlobalSearchView.as_view(), name='global-search'),
    path('<int:product_id>/review/', ProductReviewView.as_view(), name='product-review'),
    
    # 收藏相关
    path('collection/', CollectionView.as_view(), name='product-collection'),
    path('collection/<int:collection_id>/', CollectionDetailView.as_view(), name='product-collection-detail'),
]