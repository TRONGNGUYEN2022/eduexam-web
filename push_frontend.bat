@echo off
title EduExam - Day Code Frontend Len GitHub va Vercel
color 0B

echo ======================================================
echo    DANG DONG GOI VA DAY CODE FRONTEND LEN PRODUCTION
echo ======================================================
cd /d "%~dp0"

:: 1. Kiem tra su ton tai cua file
if not exist "index.html" (
    echo [LOI] Khong tim thay file index.html!
    pause
    exit /b
)

if not exist "bank.html" (
    echo [CANH BAO] Khong tim thay file bank.html trong thu muc!
    pause
    exit /b
)

:: 2. Don dep file index.lock neu bi ket
if exist ".git\index.lock" del /f /q ".git\index.lock"

:: 3. Khoi tao va ket noi remote Git
echo [*] Dang kiem tra ket noi Git Repository...
if not exist ".git" (
    git init
    git branch -M main
)
git remote remove origin >nul 2>&1
git remote add origin https://github.com/TRONGNGUYEN2022/eduexam-web.git

:: 4. Dong goi va tao commit moi
echo [*] Dang dong goi index.html, bank.html va cac tai nguyen...
git add -A
git commit -m "Update Frontend: Tich hop bank.html va index.html - %date% %time%" --allow-empty

:: 5. Day code len GitHub
echo [*] Dang day code len GitHub (origin main)...
git push -u origin main --force

:: 6. Trien khai len Vercel Production
echo.
echo [*] Dang deploy truc tiep len Vercel Production...
call vercel --prod --yes

echo.
echo ======================================================
echo    HOAN TAT!
echo    - Trang tao de:  https://eduexam-web.vercel.app/
echo    - Trang nap kho: https://eduexam-web.vercel.app/bank.html
echo ======================================================
pause