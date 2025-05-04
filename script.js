
document.addEventListener('DOMContentLoaded', function() {
  // 服務篩選功能
  const serviceIcons = document.querySelectorAll('.service-icon');
  const providers = document.querySelectorAll('.provider');
  
  serviceIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      // 移除其他圖標的active狀態
      serviceIcons.forEach(i => i.classList.remove('active'));
      // 添加當前圖標的active狀態
      icon.classList.add('active');
      
      const category = icon.dataset.category;
      
      providers.forEach(provider => {
        const services = provider.dataset.services.split(',');
        if (category === 'all' || services.includes(category)) {
          provider.style.display = 'flex';
        } else {
          provider.style.display = 'none';
        }
      });
    });
  });

  // 初始化評價系統
  window.currentProvider = '';
  
  window.showReviewForm = function(button) {
    const provider = button.dataset.provider;
    window.currentProvider = provider;
    document.getElementById('review-provider').textContent = `服務者：${provider}`;
    document.getElementById('review-form').style.display = 'block';
  }
  
  window.closeReviewForm = function() {
    document.getElementById('review-form').style.display = 'none';
  }
  
  window.submitReview = function() {
    const rating = document.getElementById('rating').value;
    const content = document.getElementById('review-content').value;
    
    if (!content.trim()) {
      alert('請輸入評價內容');
      return;
    }
    
    // 創建新評價
    const review = {
      provider: window.currentProvider,
      rating: rating,
      content: content,
      date: new Date().toLocaleDateString()
    };
    
    // 獲取現有評價
    let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    reviews.push(review);
    
    // 儲存到 localStorage
    localStorage.setItem('reviews', JSON.stringify(reviews));
    
    // 更新顯示
    updateReviews(window.currentProvider);
    
    // 清空並關閉表單
    document.getElementById('review-content').value = '';
    closeReviewForm();
    
    alert('感謝您的評價！');
  }
  
  // 更新評價顯示
  function updateReviews(providerName) {
    const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const providerReviews = reviews.filter(r => r.provider === providerName);
    
    const container = document.querySelector('.reviews-container');
    if(!container) return;
    
    container.innerHTML = `
      <h4>評價列表</h4>
      ${providerReviews.map(review => `
        <div class="review-item">
          <div>評分: ${'⭐'.repeat(review.rating)}</div>
          <div>${review.content}</div>
          <div class="review-date">${review.date}</div>
        </div>
      `).join('')}
    `;
  }
});
