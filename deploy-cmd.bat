@echo off
chcp 65001 >nul
echo ========================================
echo   WuYi Trip - GitHub Deploy Tool
echo ========================================
echo.

cd /d C:\Users\simba\wuyi-trip

echo [1/6] Checking Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo [X] Git not found. Please install from https://git-scm.com/download/win
    pause
    exit /b 1
)
echo [OK] Git installed

echo.
echo [2/6] Init Git repo...
if exist .git (
    echo [!] Git repo already exists
) else (
    git init
    echo [OK] Git repo initialized
)

echo.
echo [3/6] Config user info...
git config user.name "wuyi-trip"
git config user.email "wuyi-trip@users.noreply.github.com"
echo [OK] User info set

echo.
echo [4/6] Add files...
git add .
echo [OK] Files added

echo.
echo [5/6] Commit...
git commit -m "Initial commit"
if errorlevel 1 (
    echo [!] Nothing to commit or failed, continue...
)

echo.
echo [6/6] Setup remote and push...
git remote remove origin 2>nul
git remote add origin https://github.com/wuyi-trip/wuyi-trip.git
echo [OK] Remote set

echo.
echo ----------------------------------------
echo  Next: Enter your GitHub credentials
echo  Username: wuyi-trip
echo  Password: Your GitHub password
echo  (Use Personal Access Token if 2FA enabled)
echo ----------------------------------------
echo.

git branch -M main
git push -u origin main

if errorlevel 1 (
    echo.
    echo [X] Push failed!
    echo.
    echo Possible reasons:
    echo 1. Repository does not exist on GitHub
    echo 2. Wrong username or password
    echo 3. Two-factor auth enabled, need Token
    echo.
    echo Fix:
    echo 1. Go to https://github.com/new
    echo 2. Repository name: wuyi-trip
    echo 3. Select Public, click Create
    echo 4. Run this script again
    pause
    exit /b 1
)

echo.
echo ========================================
echo [OK] Push success!
echo ========================================
echo.
echo Next steps:
echo 1. Visit: https://github.com/wuyi-trip/wuyi-trip
echo 2. Click Settings - Pages
echo 3. Source: Deploy from a branch
echo 4. Branch: main / (root)
echo 5. Click Save
echo.
echo Wait 1-2 min, then visit:
echo    https://wuyi-trip.github.io/wuyi-trip/
echo.
pause
