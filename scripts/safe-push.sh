#!/bin/bash

# Configuration
REMOTE_URL="https://github.com/idrokaiassistant-wq/MasterPrompt.git"
BRANCH="main"

echo "🚀 Starting Safe Push to $REMOTE_URL..."

# 1. Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo "⚠️  You have uncommitted changes."
  read -p "Do you want to commit them now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter commit message: " COMMIT_MSG
    git add .
    git commit -m "$COMMIT_MSG"
  else
    echo "❌ Push aborted. Please commit or stash your changes."
    exit 1
  fi
fi

# 2. Validation (Linting & Testing)
echo "🔍 Running validation checks..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Run linting
echo "   Running lint..."
if pnpm lint; then
    echo "✅ Lint passed."
else
    echo "❌ Lint failed. Please fix errors before pushing."
    exit 1
fi

# Run tests (optional, if tests exist)
# echo "   Running tests..."
# if pnpm test; then
#     echo "✅ Tests passed."
# else
#     echo "❌ Tests failed. Please fix errors before pushing."
#     exit 1
# fi

# 3. Push to Remote
echo "📤 Pushing to $BRANCH..."

# Check if remote matches
CURRENT_REMOTE=$(git remote get-url origin)
if [ "$CURRENT_REMOTE" != "$REMOTE_URL" ]; then
    echo "⚠️  Remote URL mismatch. Updating remote..."
    git remote set-url origin "$REMOTE_URL"
fi

if git push -u origin "$BRANCH"; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Push failed. Please check your network connection or credentials."
    echo "   Tip: Ensure you are logged in via 'git credential-manager' or have SSH keys set up."
    exit 1
fi
