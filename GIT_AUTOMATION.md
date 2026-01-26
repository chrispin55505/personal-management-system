# Git Automation Scripts

This directory contains automated git commit and push scripts for the personal-management-system project.

## Available Scripts

### 1. PowerShell Script (Recommended)
**File**: `auto-git-push.ps1`

**Usage**:
```powershell
powershell -ExecutionPolicy Bypass -File auto-git-push.ps1
```

**Or via npm**:
```bash
npm run git-push
```

### 2. Batch File
**File**: `auto-git-push.bat`

**Usage**:
```cmd
auto-git-push.bat
```

**Or via npm**:
```bash
npm run git-push-bat
```

## Features

- **Automatic Initialization**: If the repository isn't initialized, it will automatically run `git init` and set up the remote
- **Branch Detection**: Automatically detects the current branch (master/main) and pushes to the correct branch
- **Change Detection**: Only commits and pushes when there are actual changes
- **Timestamped Commits**: Each commit includes a timestamp for easy tracking
- **No Prompting**: Fully automated - no user interaction required

## What the Scripts Do

1. Navigate to the project root directory
2. Check if git repository exists, initialize if needed
3. Detect current branch name
4. Add all changes (`git add .`)
5. Check if there are changes to commit
6. If changes exist:
   - Create a commit with timestamp
   - Push to the remote repository
7. Report success or no-changes status

## Remote Repository

The scripts are configured to push to:
```
https://github.com/chrispin55505/personal-management-system.git
```

## Automation Integration

You can set up these scripts to run automatically:
- **Windows Task Scheduler**: Schedule the PowerShell script to run at specific intervals
- **Git Hooks**: Add to pre-commit or post-commit hooks
- **IDE Integration**: Configure your IDE to run the script on file save

## Troubleshooting

- **Permission Denied**: Ensure you have push access to the GitHub repository
- **Network Issues**: Check your internet connection
- **Git Not Found**: Ensure Git is installed and in your PATH
- **PowerShell Execution Policy**: Use `-ExecutionPolicy Bypass` as shown in the usage examples
