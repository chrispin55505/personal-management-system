@echo off
echo Starting automatic git commit and push...

REM Navigate to the repository root
cd /d "C:\Users\USER\Downloads\Personal"

REM Check if we're in a git repository
if not exist ".git" (
    echo Not a git repository. Initializing...
    git init
    git branch -M main
    git remote add origin https://github.com/chrispin55505/personal-management-system.git
)

REM Get current branch name
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set currentBranch=%%i
echo Current branch: %currentBranch%

REM Add all changes
echo Adding all changes...
git add .

REM Check if there are changes to commit
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
    REM Generate commit message with timestamp
    for /f "tokens=1-6 delims=/ " %%a in ('date /t') do set commitdate=%%c-%%a-%%b
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set committime=%%a:%%b
    set commitMessage=Auto-commit: %commitdate% %committime%
    
    echo Committing changes...
    git commit -m "%commitMessage%"
    
    REM Push to remote repository
    echo Pushing to remote repository...
    git push -u origin %currentBranch%
    
    echo Successfully committed and pushed changes!
) else (
    echo No changes to commit.
)

echo Git automation complete.
pause
