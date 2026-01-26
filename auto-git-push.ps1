#!/usr/bin/env pwsh

# Auto Git Commit and Push Script
# This script automatically commits changes and pushes to the remote repository

Write-Host "Starting automatic git commit and push..." -ForegroundColor Green

# Navigate to the repository root
Set-Location -Path "C:\Users\USER\Downloads\Personal"

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Not a git repository. Initializing..." -ForegroundColor Yellow
    git init
    git branch -M main
    git remote add origin https://github.com/chrispin55505/personal-management-system.git
}

# Get current branch name
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Blue

# Add all changes
Write-Host "Adding all changes..." -ForegroundColor Blue
git add .

# Check if there are changes to commit
$changes = git status --porcelain
if ($changes) {
    # Generate commit message with timestamp
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "Auto-commit: $timestamp"
    
    Write-Host "Committing changes..." -ForegroundColor Blue
    git commit -m $commitMessage
    
    # Push to remote repository
    Write-Host "Pushing to remote repository..." -ForegroundColor Blue
    git push -u origin $currentBranch
    
    Write-Host "Successfully committed and pushed changes!" -ForegroundColor Green
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

Write-Host "Git automation complete." -ForegroundColor Green
