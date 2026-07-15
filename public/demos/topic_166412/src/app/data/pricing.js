(function () {
  const data = window.MiniFishData = window.MiniFishData || {};
  data.product = {
    pricingPeriod: 'monthly',
    // 支付与 Credits 尚无后端契约；保留空集合避免页面误展示可购买套餐。
    pricingPlans: []
  };
})();
