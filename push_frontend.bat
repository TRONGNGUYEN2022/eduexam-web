@echo off
chcp 65001 >nul
echo ======================================================
echo    DANG DAY CODE FRONTEND LEN GITHUB VA VERCEL
echo ======================================================
cd /d "%~dp0"

echo [*] Dang khoi tao git va ket noi repository...
git init
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/TRONGNGUYEN2022/eduexam-web.git

echo [*] Dang chuan bi goi code...
git add .
git commit -m "Update frontend index.html with LaTeX Equation sync"

echo [*] Dang day code len GitHub...
git push -u origin main --force

echo ======================================================
echo    DA HOAN TAT DAY FRONTEND LEN GITHUB!
echo ======================================================
pause