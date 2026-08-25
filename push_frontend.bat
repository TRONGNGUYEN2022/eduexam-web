@echo off
chcp 65001 >nul
title EduExam - Day Code Frontend Len GitHub
color 0B

echo ======================================================
echo    DANG DAY CODE FRONTEND LEN GITHUB VA VERCEL
echo ======================================================
cd /d "%~dp0"

:: 1. Don dep file index.lock neu co
if exist ".git\index.lock" del /f /q ".git\index.lock"

:: 2. Khoi tao hoac ket noi lai remote
echo [*] Dang kiem tra ket noi Git Repository...
if not exist ".git" (
    git init
    git branch -M main
)
git remote remove origin >nul 2>&1
git remote add origin https://github.com/TRONGNGUYEN2022/eduexam-web.git

:: 3. Ep Git them tat ca cac file thay doi
echo [*] Dang dong goi code va tao commit moi...
git add -A
git commit -m "Auto Update %date% %time% - Floating Toolbar and KaTeX Direct Render" --allow-empty

:: 4. Day thang len GitHub
echo [*] Dang day code len GitHub (origin main)...
git push -u origin main --force

echo.
echo ======================================================
echo    DA HOAN TAT DAY FRONTEND LEN GITHUB!
echo ======================================================
pause