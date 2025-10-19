@echo off
REM 自動部署 GitHub Pages

git add .
git commit -m "自動部署更新"
git push

pause
