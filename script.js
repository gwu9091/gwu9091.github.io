
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
    
    // 這裡可以加入API呼叫來儲存評價
    alert('感謝您的評價！');
    
    // 清空並關閉表單
    document.getElementById('review-content').value = '';
    closeReviewForm();
  }
});
