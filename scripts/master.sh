#!/bin/bash

# GitHub Loyihasi Master Avtomatlashtiruvchi Skripti
# Bu skript barcha avtomatlashtiruvchi tizimlarni boshqaradi

set -e

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Konfiguratsiya
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
LOG_DIR="$PROJECT_ROOT/logs"
CONFIG_FILE="$PROJECT_ROOT/.master-config"

# Versiya
VERSION="1.0.0"

# Funktsiyalar
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

cyan() {
    echo -e "${CYAN}$1${NC}"
}

# Banner ko'rsatish
show_banner() {
    cyan "╔══════════════════════════════════════════════════════════════╗"
    cyan "║                                                              ║"
    cyan "║           🚀 GitHub Project Automation Master              ║"
    cyan "║                                                              ║"
    cyan "║                 Version $VERSION                              ║"
    cyan "║                                                              ║"
    cyan "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

# Yordam funksiyasi
show_help() {
    show_banner
    cat << EOF
GitHub Loyihasi Master Avtomatlashtiruvchi Skripti

Foydalanish: $0 [komanda] [parametrlar]

Asosiy Komandalar:
    setup           - Loyihani boshlang'ich sozlash
    start           - Barcha avtomatlashtiruvchi tizimlarni ishga tushurish
    stop            - Barcha tizimlarni to'xtatish
    restart         - Tizimlarni qayta ishga tushurish
    status          - Tizim holatini ko'rsatish
    workflow        - GitHub Flow jarayonini boshlash
    cleanup         - Keraksiz fayllarni tozalash
    monitor         - Monitoring tizimini boshlash
    test            - Barcha testlarni ishga tushurish
    deploy          - Deployment jarayonini boshlash
    config          - Konfiguratsiyani sozlash
    logs            - Loglarni ko'rsatish
    update          - Skriptlarni yangilash
    help            - Bu yordamni ko'rsatish

Qo'llab-quvvatlanadigan Servislar:
    github-flow     - GitHub Flow avtomatizatsiyasi
    cleanup         - Fayl tozalash tizimi
    monitoring      - Monitoring va alerting
    testing         - Avtomatlashtirilgan testlar
    ci-cd           - CI/CD pipeline

Misol:
    $0 setup                    # Boshlang'ich sozlash
    $0 start                    # Barcha tizimlarni ishga tushurish
    $0 workflow feature auth    # Feature branch yaratish
    $0 cleanup --type node      - Node.js fayllarni tozalash
    $0 monitor --interval 30      - 30 soniya interval bilan monitoring
    $0 logs --lines 100         - Oxirgi 100 qator log

EOF
}

# Konfiguratsiya faylini yaratish
create_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        cat > "$CONFIG_FILE" << EOF
# GitHub Project Master Configuration

# Monitoring
MONITORING_INTERVAL=60
MONITORING_ENABLED=true
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
WEBHOOK_URL=

# GitHub Flow
GITHUB_FLOW_ENABLED=true
AUTO_COMMIT_SIGNING=false
DEFAULT_BRANCH_TYPE=feature

# Cleanup
CLEANUP_ENABLED=true
CLEANUP_SCHEDULE=weekly
BACKUP_BEFORE_CLEANUP=true

# Testing
TESTING_ENABLED=true
AUTO_TEST_ON_PUSH=true
COVERAGE_THRESHOLD=80

# CI/CD
CICD_ENABLED=true
AUTO_DEPLOY_STAGING=true
AUTO_DEPLOY_PRODUCTION=false

# Logging
LOG_LEVEL=info
LOG_RETENTION_DAYS=30
MAX_LOG_SIZE=10485760

# Security
SECURITY_SCAN_ENABLED=true
VULNERABILITY_THRESHOLD=5
AUTO_FIX_SECURITY_ISSUES=false
EOF
        info "Konfiguratsiya fayli yaratildi: $CONFIG_FILE"
    fi
}

# Konfiguratsiyani o'qish
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    else
        warning "Konfiguratsiya fayli topilmadi, standart sozlamalar ishlatiladi"
    fi
}

# Tizim holatini tekshirish
check_status() {
    info "Tizim holati tekshirilmoqda..."
    
    # Git repository
    if git rev-parse --git-dir > /dev/null 2>&1; then
        success "✅ Git repository: ACTIVE"
        info "  Current branch: $(git branch --show-current)"
        info "  Last commit: $(git log -1 --format=%ci)"
    else
        error "❌ Git repository: NOT FOUND"
    fi
    
    # Node.js
    if command -v node > /dev/null 2>&1; then
        success "✅ Node.js: ACTIVE ($(node --version))"
    else
        error "❌ Node.js: NOT FOUND"
    fi
    
    # pnpm
    if command -v pnpm > /dev/null 2>&1; then
        success "✅ pnpm: ACTIVE ($(pnpm --version))"
    else
        error "❌ pnpm: NOT FOUND"
    fi
    
    # Dependencies
    if [ -d "$PROJECT_ROOT/node_modules" ]; then
        success "✅ Dependencies: INSTALLED"
    else
        warning "⚠️ Dependencies: NOT INSTALLED"
    fi
    
    # GitHub CLI
    if command -v gh > /dev/null 2>&1; then
        success "✅ GitHub CLI: ACTIVE"
    else
        warning "⚠️ GitHub CLI: NOT FOUND"
    fi
    
    # Environment files
    if [ -f "$PROJECT_ROOT/.env" ]; then
        success "✅ Environment: CONFIGURED"
    else
        warning "⚠️ Environment: NOT CONFIGURED"
    fi
    
    # Log directory
    if [ -d "$LOG_DIR" ]; then
        success "✅ Logs: AVAILABLE"
        info "  Log files: $(ls -1 "$LOG_DIR"/*.log 2>/dev/null | wc -l)"
    else
        info "ℹ️ Logs: NOT INITIALIZED"
    fi
}

# Boshlang'ich sozlash
setup_project() {
    show_banner
    info "Loyiha boshlang'ich sozlanmoqda..."
    
    # Log papkasini yaratish
    mkdir -p "$LOG_DIR"
    
    # Konfiguratsiya faylini yaratish
    create_config
    load_config
    
    # Permissions sozlash
    chmod +x "$SCRIPTS_DIR"/*.sh
    
    # Git hooks o'rnatish (agar kerak bo'lsa)
    if [ -d ".husky" ]; then
        info "Git hooks sozlanmoqda..."
        "$SCRIPTS_DIR/setup-project.sh" --force
    fi
    
    success "✅ Boshlang'ich sozlash muvaffaqiyatli yakunlandi!"
    info "Keyingisi: $0 start"
}

# Barcha tizimlarni ishga tushurish
start_all() {
    show_banner
    info "Barcha tizimlarni ishga tushirish..."
    
    load_config
    
    # Dependencies tekshirish
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        warning "Dependencies topilmadi, o'rnatilmoqda..."
        "$SCRIPTS_DIR/setup-project.sh" --force
    fi
    
    # Monitoring tizimini ishga tushurish
    if [ "$MONITORING_ENABLED" = true ]; then
        info "Monitoring tizimi ishga tushirilmoqda..."
        nohup "$SCRIPTS_DIR/monitor.sh" start > "$LOG_DIR/monitor-start.log" 2>&1 &
        echo $! > "$LOG_DIR/monitor.pid"
        success "✅ Monitoring: STARTED"
    fi
    
    # GitHub Flow tizimini ishga tushurish
    if [ "$GITHUB_FLOW_ENABLED" = true ]; then
        info "GitHub Flow tizimi tayyor..."
        success "✅ GitHub Flow: READY"
        info "Foydalanish: $0 workflow feature 'yangi-feature'"
    fi
    
    # Cleanup scheduler
    if [ "$CLEANUP_ENABLED" = true ]; then
        info "Cleanup tizimi tayyor..."
        success "✅ Cleanup: READY"
        info "Foydalanish: $0 cleanup"
    fi
    
    success "✅ Barcha tizimlar ishga tushirildi!"
    info "Log fayllarini ko'rish: $0 logs"
}

# Barcha tizimlarni to'xtatish
stop_all() {
    info "Barcha tizimlarni to'xtatish..."
    
    # Monitoring tizimini to'xtatish
    if [ -f "$LOG_DIR/monitor.pid" ]; then
        local monitor_pid=$(cat "$LOG_DIR/monitor.pid")
        if kill -0 "$monitor_pid" 2>/dev/null; then
            kill "$monitor_pid"
            success "✅ Monitoring: STOPPED"
        fi
        rm -f "$LOG_DIR/monitor.pid"
    fi
    
    success "✅ Barcha tizimlar to'xtatildi!"
}

# GitHub Flow jarayonini boshlash
start_workflow() {
    local workflow_type=$1
    local description=$2
    
    if [ -z "$workflow_type" ] || [ -z "$description" ]; then
        error "Branch turi va tavsif kerak. Misol: $0 workflow feature 'login-system'"
    fi
    
    info "GitHub Flow jarayoni boshlanmoqda: $workflow_type - $description"
    
    "$SCRIPTS_DIR/github-workflow.sh" start "$workflow_type" "$description"
}

# Cleanup jarayonini boshlash
start_cleanup() {
    info "Cleanup jarayoni boshlanmoqda..."
    
    local cleanup_type="${1:-all}"
    local dry_run="${2:-false}"
    
    if [ "$dry_run" = true ]; then
        "$SCRIPTS_DIR/cleanup.sh" --type "$cleanup_type" --dry-run
    else
        "$SCRIPTS_DIR/cleanup.sh" --type "$cleanup_type"
    fi
}

# Testlarni ishga tushurish
run_tests() {
    local test_type="${1:-all}"
    
    info "Testlar ishga tushirilmoqda: $test_type"
    
    case $test_type in
        "unit")
            pnpm test:unit
            ;;
        "integration")
            pnpm test:integration
            ;;
        "e2e")
            pnpm test:e2e
            ;;
        "all")
            pnpm test
            ;;
        *)
            error "Noto'g'ri test turi: $test_type"
            ;;
    esac
}

# Loglarni ko'rsatish
show_logs() {
    local log_type="${1:-all}"
    local lines="${2:-50}"
    
    case $log_type in
        "monitor")
            tail -n "$lines" "$LOG_DIR/monitor.log" 2>/dev/null || warning "Monitor log topilmadi"
            ;;
        "error")
            tail -n "$lines" "$LOG_DIR/errors.log" 2>/dev/null || warning "Error log topilmadi"
            ;;
        "workflow")
            tail -n "$lines" "$LOG_DIR/github-workflow.log" 2>/dev/null || warning "Workflow log topilmadi"
            ;;
        "all")
            info "Barcha log fayllari:"
            ls -la "$LOG_DIR"/*.log 2>/dev/null || warning "Log fayllari topilmadi"
            ;;
        *)
            tail -n "$lines" "$LOG_DIR/$log_type.log" 2>/dev/null || warning "Log fayli topilmadi: $log_type"
            ;;
    esac
}

# Skriptlarni yangilash
update_scripts() {
    info "Skriptlar yangilanmoqda..."
    
    # Permissions yangilash
    chmod +x "$SCRIPTS_DIR"/*.sh
    
    # Git pull (agar repository bo'lsa)
    if git rev-parse --git-dir > /dev/null 2>&1; then
        git pull origin main || warning "Git pull muvaffaqiyatsiz tugadi"
    fi
    
    success "✅ Skriptlar yangilandi!"
}

# Asosiy funksiya
main() {
    local command="${1:-help}"
    
    # Log papkasini yaratish
    mkdir -p "$LOG_DIR"
    
    # Komandani bajarish
    case $command in
        "setup")
            setup_project
            ;;
        "start")
            start_all
            ;;
        "stop")
            stop_all
            ;;
        "restart")
            stop_all
            sleep 2
            start_all
            ;;
        "status")
            check_status
            ;;
        "workflow")
            shift
            start_workflow "$@"
            ;;
        "cleanup")
            shift
            start_cleanup "$@"
            ;;
        "test")
            shift
            run_tests "$@"
            ;;
        "deploy")
            info "Deployment uchun CI/CD workflow ishlatilinmoqda..."
            info "GitHub Actions workflowlarini tekshiring: .github/workflows/"
            ;;
        "monitor")
            shift
            "$SCRIPTS_DIR/monitor.sh" "$@"
            ;;
        "config")
            info "Konfiguratsiya fayli: $CONFIG_FILE"
            [ -f "$CONFIG_FILE" ] && cat "$CONFIG_FILE" || warning "Fayl topilmadi"
            ;;
        "logs")
            shift
            show_logs "$@"
            ;;
        "update")
            update_scripts
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Skriptni ishga tushurish
main "$@"