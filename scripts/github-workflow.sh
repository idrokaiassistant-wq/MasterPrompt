#!/bin/bash

# GitHub Flow Avtomatlashtiruvchi Ish Jarayoni Skripti
# Bu skript GitHub qoidalariga mos keladigan to'liq ish jarayonini boshqaradi

set -e

# Ranglar uchun o'zgaruvchilar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log fayli
LOG_FILE="github-workflow.log"

# Funktsiyalar
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# GitHub Flow jarayonini boshlash
init_github_flow() {
    log "GitHub Flow ish jarayonini boshlash..."
    
    # Git repository tekshirish
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Bu Git repository emas. Iltimos, Git repository yaratib, keyin qayta urinib ko'ring."
    fi
    
    # GitHub remote tekshirish
    if ! git remote get-url origin > /dev/null 2>&1; then
        warning "GitHub remote topilmadi. GitHub repository ga ulanganligingizga ishonch hosil qiling."
    fi
    
    success "GitHub Flow jarayoni muvaffaqiyatli boshlandi"
}

# Yangi branch yaratish
create_branch() {
    local branch_type=$1
    local description=$2
    local branch_name=""
    
    log "Yangi branch yaratish: $branch_type/$description"
    
    # Branch nomini generatsiya qilish
    case $branch_type in
        "feature")
            branch_name="feature/$(echo $description | tr ' ' '-' | tr '[:upper:]' '[:lower:]')"
            ;;
        "bugfix")
            branch_name="bugfix/$(echo $description | tr ' ' '-' | tr '[:upper:]' '[:lower:]')"
            ;;
        "hotfix")
            branch_name="hotfix/$(echo $description | tr ' ' '-' | tr '[:upper:]' '[:lower:]')"
            ;;
        "release")
            branch_name="release/$(echo $description | tr ' ' '-' | tr '[:upper:]' '[:lower:]')"
            ;;
        *)
            error "Noto'g'ri branch turi. feature/bugfix/hotfix/release tanlang."
            ;;
    esac
    
    # Branch yaratish
    git checkout -b "$branch_name" || error "Branch yaratish muvaffaqiyatsiz tugadi: $branch_name"
    
    success "Branch muvaffaqiyatli yaratildi: $branch_name"
    echo "$branch_name"
}

# Semantik commit message yaratish
create_commit_message() {
    local type=$1
    local scope=$2
    local subject=$3
    local body=$4
    local footer=$5
    
    local commit_message=""
    
    # Commit turini tekshirish
    case $type in
        "feat"|"fix"|"docs"|"style"|"refactor"|"test"|"chore")
            commit_message="$type"
            ;;
        *)
            error "Noto'g'ri commit turi. feat/fix/docs/style/refactor/test/chore tanlang."
            ;;
    esac
    
    # Scope qo'shish
    if [ -n "$scope" ]; then
        commit_message="$commit_message($scope)"
    fi
    
    # Subject qo'shish
    commit_message="$commit_message: $subject"
    
    # Body qo'shish
    if [ -n "$body" ]; then
        commit_message="$commit_message

$body"
    fi
    
    # Footer qo'shish
    if [ -n "$footer" ]; then
        commit_message="$commit_message

$footer"
    fi
    
    echo "$commit_message"
}

# O'zgarishlarni commit qilish
commit_changes() {
    local type=$1
    local scope=$2
    local subject=$3
    local body=$4
    local footer=$5
    
    log "O'zgarishlarni commit qilish..."
    
    # Status tekshirish
    if [ -z "$(git status --porcelain)" ]; then
        warning "Commit qilish uchun o'zgarishlar topilmadi"
        return 0
    fi
    
    # Commit message yaratish
    local commit_message=$(create_commit_message "$type" "$scope" "$subject" "$body" "$footer")
    
    # Add va commit
    git add .
    git commit -m "$commit_message" || error "Commit muvaffaqiyatsiz tugadi"
    
    success "O'zgarishlar muvaffaqiyatli commit qilindi"
}

# Push qilish
push_changes() {
    local branch_name=$(git branch --show-current)
    local remote=${1:-origin}
    
    log "O'zgarishlarni push qilish: $branch_name -> $remote"
    
    git push -u "$remote" "$branch_name" || error "Push muvaffaqiyatsiz tugadi"
    
    success "O'zgarishlar muvaffaqiyatli push qilindi"
}

# Pull request yaratish
create_pull_request() {
    local title=$1
    local body=$2
    local base_branch=${3:-main}
    
    log "Pull request yaratish..."
    
    # GitHub CLI tekshirish
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) o'rnatilmagan. Iltimos, o'rnatib keyin qayta urinib ko'ring."
    fi
    
    # GitHub authentication tekshirish
    if ! gh auth status > /dev/null 2>&1; then
        error "GitHub CLI bilan authentication o'tkazilmagan. Iltimos, 'gh auth login' buyrug'ini bajaring."
    fi
    
    # Current branch
    local current_branch=$(git branch --show-current)
    
    # Pull request yaratish
    if [ -n "$body" ]; then
        gh pr create --title "$title" --body "$body" --base "$base_branch" || error "Pull request yaratish muvaffaqiyatsiz tugadi"
    else
        gh pr create --title "$title" --base "$base_branch" || error "Pull request yaratish muvaffaqiyatsiz tugadi"
    fi
    
    success "Pull request muvaffaqiyatli yaratildi"
}

# Code review jarayonini boshlash
start_code_review() {
    local pr_number=$1
    
    log "Code review jarayonini boshlash: PR #$pr_number"
    
    # PR ma'lumotlarini olish
    local pr_info=$(gh pr view "$pr_number" --json number,title,state,url)
    
    if [ -z "$pr_info" ]; then
        error "PR #$pr_number topilmadi"
    fi
    
    echo "PR Ma'lumotlari:"
    echo "$pr_info" | jq -r '. | "Number: \(.number)\nTitle: \(.title)\nState: \(.state)\nURL: \(.url)"'
    
    # Reviewers qo'shish (ixtiyoriy)
    log "Reviewers qo'shish mumkin: gh pr edit $pr_number --add-reviewer @username"
    
    success "Code review jarayoni boshlandi"
}

# CI/CD pipeline ni tekshirish
check_ci_status() {
    local branch_name=$(git branch --show-current)
    
    log "CI/CD pipeline statusini tekshirish: $branch_name"
    
    # GitHub Actions statusini olish
    local ci_status=$(gh api repos/:owner/:repo/commits/$(git rev-parse HEAD)/check-runs --jq '.check_runs[0].status' 2>/dev/null || echo "unknown")
    
    case $ci_status in
        "completed")
            success "CI/CD pipeline muvaffaqiyatli yakunlandi"
            ;;
        "in_progress")
            warning "CI/CD pipeline hali ishlamoqda"
            ;;
        "queued")
            warning "CI/CD pipeline navbatda"
            ;;
        *)
            warning "CI/CD pipeline statusi aniqlanmadi: $ci_status"
            ;;
    esac
}

# To'liq ish jarayonini boshlash
start_workflow() {
    local workflow_type=$1
    local description=$2
    
    log "To'liq ish jarayonini boshlash: $workflow_type - $description"
    
    # 1. Branch yaratish
    local branch_name=$(create_branch "$workflow_type" "$description")
    
    # 2. O'zgarishlarni amalga oshirish (foydalanuvchi tomonidan)
    log "O'zgarishlarni amalga oshiring va keyin commit qilish uchun tayyor bo'ling..."
    echo "Commit qilish uchun: $0 commit <type> <scope> <subject> [body] [footer]"
    
    # 3. O'zgarishlarni commit qilish
    # Bu qadam foydalanuvchi tomonidan alohida bajariladi
    
    # 4. Push qilish
    push_changes
    
    # 5. Pull request yaratish
    local pr_title="$workflow_type: $description"
    local pr_body="Bu $workflow_type branch uchun pull request.\n\nO'zgarishlar:\n- [ ] Yangi funksiyalar qo'shildi\n- [ ] Xatoliklar tuzatildi\n- [ ] Testlar o'tkazildi"
    
    create_pull_request "$pr_title" "$pr_body"
    
    success "Ish jarayoni muvaffaqiyatli boshlandi!"
}

# Yordam funksiyasi
show_help() {
    echo "GitHub Flow Avtomatlashtiruvchi Ish Jarayoni Skripti"
    echo "Foydalanish: $0 [komanda] [parametrlar]"
    echo ""
    echo "Komandalar:"
    echo "  init              - GitHub Flow jarayonini boshlash"
    echo "  branch <type> <desc> - Yangi branch yaratish (feature/bugfix/hotfix/release)"
    echo "  commit <type> <scope> <subject> [body] [footer] - Semantik commit yaratish"
    echo "  push [remote]     - O'zgarishlarni push qilish"
    echo "  pr <title> [body] [base] - Pull request yaratish"
    echo "  review <pr_number> - Code review jarayonini boshlash"
    echo "  ci                - CI/CD pipeline statusini tekshirish"
    echo "  start <type> <desc> - To'liq ish jarayonini boshlash"
    echo "  help              - Bu yordamni ko'rsatish"
    echo ""
    echo "Commit turlari: feat, fix, docs, style, refactor, test, chore"
    echo "Branch turlari: feature, bugfix, hotfix, release"
    echo ""
    echo "Misol:"
    echo "  $0 branch feature 'yangi-login-sistema'"
    echo "  $0 commit feat auth 'login forma qo'shildi' 'Foydalanuvchi authentication jarayoni yaxshilandi' 'Closes #123'"
    echo "  $0 push"
    echo "  $0 pr 'feat: yangi login sistema qo'shildi' 'Bu PR yangi authentication sistema qo'shadi'"
}

# Asosiy skript logikasi
main() {
    # Log faylini tozalash
    > "$LOG_FILE"
    
    log "GitHub Flow ish jarayoni skripti boshlandi"
    
    case ${1:-help} in
        "init")
            init_github_flow
            ;;
        "branch")
            if [ $# -lt 3 ]; then
                error "Branch yaratish uchun kamida 2 paramet kerak: branch <type> <description>"
            fi
            create_branch "$2" "$3"
            ;;
        "commit")
            if [ $# -lt 4 ]; then
                error "Commit uchun kamida 3 paramet kerak: commit <type> <scope> <subject>"
            fi
            commit_changes "$2" "$3" "$4" "${5:-}" "${6:-}"
            ;;
        "push")
            push_changes "${2:-origin}"
            ;;
        "pr")
            if [ $# -lt 2 ]; then
                error "PR yaratish uchun kamida 1 paramet kerak: pr <title> [body] [base]"
            fi
            create_pull_request "$2" "${3:-}" "${4:-main}"
            ;;
        "review")
            if [ $# -lt 2 ]; then
                error "Review uchun PR number kerak: review <pr_number>"
            fi
            start_code_review "$2"
            ;;
        "ci")
            check_ci_status
            ;;
        "start")
            if [ $# -lt 3 ]; then
                error "To'liq ish jarayoni uchun kamida 2 paramet kerak: start <type> <description>"
            fi
            start_workflow "$2" "$3"
            ;;
        "help"|*)
            show_help
            ;;
    esac
    
    log "Skript muvaffaqiyatli yakunlandi"
}

# Skriptni ishga tushurish
main "$@"