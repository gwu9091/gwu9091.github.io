
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
});
