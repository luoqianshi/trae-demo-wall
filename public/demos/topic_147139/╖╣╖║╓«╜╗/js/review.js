/**
 * 饭泛之交 - Review 评价
 * 模块化拆分自单文件原型
 */

// ==================== REVIEW ====================
let reviewStars = 5;
let reviewSelectedTags = [];

function advanceMealFlow(mealId) {
  const meal = Store.data.mealHistory.find(h => h.id === mealId);
  if(!meal) return;
  const step = meal.flowStep || 0;
  if(step === 0) {
    // Face verification before meal
    LoadingManager.showLoading('🤳 人脸核验中...');
    MockAPI.faceVerify()
      .then(res => {
        LoadingManager.hideLoading();
        showToast('✅ 人脸核验通过！置信度 ' + Math.round(res.confidence * 100) + '%');
        Store.updateMeal(mealId, { flowStep: 1 });
        renderProfile();
      })
      .catch(err => {
        LoadingManager.hideLoading();
        showToast('❌ 人脸核验失败：' + err.message);
      });
  } else if(step === 1) {
    // Check in at restaurant
    LoadingManager.showLoading('📍 正在生成到店动态二维码...');
    MockAPI.checkIn(mealId)
      .then(res => {
        LoadingManager.hideLoading();
        showToast('✅ 签到成功！' + res.checkInTime);
        Store.updateMeal(mealId, { flowStep: 2 });
        if(meal.payment && meal.payment.status === 'frozen') {
          Store.updateMeal(mealId, { payment: { ...meal.payment, status: 'paid', paidAt: new Date().toLocaleString() } });
          Store.addCreditScore(5, '按时赴约');
          showToast('💰 预授权¥58已扣款完成');
        }
        renderProfile();
      })
      .catch(err => {
        LoadingManager.hideLoading();
        showToast('❌ 签到失败：' + err.message);
      });
  } else if(step === 2) {
    // Complete meal
    showToast('✅ 约饭完成！可以评价了');
    Store.updateMeal(mealId, { flowStep: 3, status: 'done' });
    renderProfile();
  }
}

// Simulate no-show (for testing voucher conversion)
function simulateNoShow(mealId) {
  const meal = Store.data.mealHistory.find(h => h.id === mealId);
  if(!meal || !meal.payment || meal.payment.status !== 'frozen') return;
  // Convert frozen payment to voucher
  Store.addVoucher({
    id: Date.now(),
    amount: 58,
    reason: '对方爽约补偿',
    restaurant: meal.restaurant,
    createdAt: new Date().toLocaleDateString(),
    expiry: '30天内有效'
  });
  Store.updateMeal(mealId, { payment: { ...meal.payment, status: 'refund', refundReason: '对方爽约' } });
  Store.addCreditScore(-20, '爽约');
  showToast('❌ 对方爽约！¥58已转为代金券补偿你');
  renderProfile();
}

function openReview(mealId) {
  Store.data.reviewTarget = mealId;
  Store.save();
  reviewStars = 5;
  reviewSelectedTags = [];
  updateStarDisplay();
  document.querySelectorAll('.review-tag').forEach(t => t.classList.remove('selected'));
  document.getElementById('review-text').value = '';
  document.getElementById('review-step1').style.display = 'block';
  document.getElementById('review-step2').style.display = 'none';
  document.getElementById('review-modal').classList.add('active');
}
function setStar(n) {
  reviewStars = n;
  updateStarDisplay();
  const labels = ['非常不满意','不满意','一般','满意','非常满意'];
  document.getElementById('star-label').textContent = labels[n-1];
}
function updateStarDisplay() {
  const stars = document.querySelectorAll('#review-stars .star');
  stars.forEach((s,i) => s.textContent = i < reviewStars ? '⭐' : '☆');
}
function toggleReviewTag(el) {
  el.classList.toggle('selected');
}
function submitReviewStep1() {
  // Collect selected tags
  reviewSelectedTags = [];
  document.querySelectorAll('#review-tags .review-tag.selected').forEach(t => {
    reviewSelectedTags.push(t.textContent);
  });
  // Build preview
  document.getElementById('preview-stars').textContent = '⭐'.repeat(reviewStars) + '☆'.repeat(5 - reviewStars);
  document.getElementById('preview-tags').innerHTML = reviewSelectedTags.map(t => `<span class="review-preview-tag">${t}</span>`).join('');
  const text = document.getElementById('review-text').value.trim();
  document.getElementById('preview-text').textContent = text || '（未填写文字评价）';
  // Switch to step 2
  document.getElementById('review-step1').style.display = 'none';
  document.getElementById('review-step2').style.display = 'block';
}
function backToReviewStep1() {
  document.getElementById('review-step1').style.display = 'block';
  document.getElementById('review-step2').style.display = 'none';
}
function submitReviewFinal() {
  const meal = Store.data.mealHistory.find(h => h.id === Store.data.reviewTarget);
  const btn = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
  if(btn) { btn.disabled = true; btn.textContent = '提交中...'; }
  
  const reviewData = {
    mealId: Store.data.reviewTarget,
    stars: reviewSelectedStars,
    tags: reviewSelectedTags,
    text: document.getElementById('review-text').value.trim()
  };
  
  MockAPI.submitReview(reviewData)
    .then(res => {
      if(meal) {
        Store.updateMeal(meal.id, { reviewed: true, status: 'done' });
      }
      document.getElementById('review-modal').classList.remove('active');
      showToast('🎉 评价提交成功！信用分 +3');
      Store.addCreditScore(3, '饭后好评');
      renderProfile();
      if(btn) { btn.disabled = false; btn.textContent = '确认提交评价'; }
    })
    .catch(err => {
      showToast('❌ 提交失败：' + err.message);
      if(btn) { btn.disabled = false; btn.textContent = '确认提交评价'; }
    });
}