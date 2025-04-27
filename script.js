
document.addEventListener('DOMContentLoaded', function() {
  // 為標題添加動畫效果
  const header = document.querySelector('header');
  header.style.opacity = '0';
  
  setTimeout(() => {
    header.style.transition = 'opacity 1s ease-in';
    header.style.opacity = '1';
  }, 100);
});
