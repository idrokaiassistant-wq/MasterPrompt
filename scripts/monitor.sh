#!/bin/bash

# Monitoring va Logging Tizimi
# Bu skript GitHub loyiha jarayonini monitoring qiladi va log yozadi

set -e

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Konfiguratsiya
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
MONITOR_LOG="$LOG_DIR/monitor.log"
ERROR_LOG="$LOG_DIR/errors.log"
METRICS_LOG="$LOG_DIR/metrics.log"
WEBHOOK_URL="${MONITORING_WEBHOOK_URL:-}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${MONITORING_CHAT_ID:-}"

# Monitoring sozlamalari
CHECK_INTERVAL=60  # 1 daqiqa
MAX_RETRIES=3
ALERT_THRESHOLD=5  # 5 marta xato keyin alert

# Log fayllarini yaratish
setup_logging() {
    mkdir -p "$LOG_DIR"
    touch "$MONITOR_LOG" "$ERROR_LOG" "$METRICS_LOG"
    
    # Log fayllarini cheklash (10MB dan katta bo'lmasligi uchun)
    for log_file in "$MONITOR_LOG" "$ERROR_LOG" "$METRICS_LOG"; do
        if [ -f "$log_file" ] && [ $(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0) -gt 10485760 ]; then
            mv "$log_file" "${log_file}.old"
            touch "$log_file"
        fi
    done
}

# Log funksiyalari
log_info() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp] [INFO]${NC} $message" | tee -a "$MONITOR_LOG"
}

log_error() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] [ERROR]${NC} $message" | tee -a "$ERROR_LOG"
    
    # Telegram ga xabar yuborish (agar sozlangan bo'lsa)
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        send_telegram_alert "$message"
    fi
}

log_warning() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp] [WARNING]${NC} $message" | tee -a "$MONITOR_LOG"
}

log_metric() {
    local metric="$1"
    local value="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $metric: $value" >> "$METRICS_LOG"
}

# Telegram alert yuborish
send_telegram_alert() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local full_message="🚨 *GitHub Project Alert*\n\nTime: $timestamp\nMessage: $message\n\nProject: $(basename "$PROJECT_ROOT")"
    
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d "chat_id=$TELEGRAM_CHAT_ID" \
        -d "text=$full_message" \
        -d "parse_mode=Markdown" || true
}

# Webhook orqali alert yuborish
send_webhook_alert() {
    local message="$1"
    local severity="$2"
    
    if [ -n "$WEBHOOK_URL" ]; then
        local payload=$(cat << EOF
{
    "text": "$message",
    "severity": "$severity",
    "project": "$(basename "$PROJECT_ROOT")",
    "timestamp": "$(date -Iseconds)"
}
EOF
        )
        
        curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$WEBHOOK_URL" || true
    fi
}

# Git repository monitoring
monitor_git_repo() {
    log_info "Git repository monitoring boshlandi..."
    
    cd "$PROJECT_ROOT"
    
    # Git status
    if git rev-parse --git-dir > /dev/null 2>&1; then
        local git_status=$(git status --porcelain | wc -l)
        log_metric "git_uncommitted_files" "$git_status"
        
        if [ "$git_status" -gt 0 ]; then
            log_warning "$git_status ta commit qilinmagan o'zgarishlar mavjud"
        fi
        
        # Current branch
        local current_branch=$(git branch --show-current)
        log_metric "git_current_branch" "$current_branch"
        
        # Behind/ahead commits
        local upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)
        if [ -n "$upstream" ]; then
            local behind_ahead=$(git rev-list --left-right --count HEAD...$upstream)
            local behind=$(echo $behind_ahead | cut -f1 -d' ')
            local ahead=$(echo $behind_ahead | cut -f2 -d' ')
            
            log_metric "git_commits_behind" "$behind"
            log_metric "git_commits_ahead" "$ahead"
            
            if [ "$behind" -gt 5 ]; then
                log_warning "$behind ta ortda qolgan commitlar mavjud"
            fi
        fi
        
        # Last commit age
        local last_commit_date=$(git log -1 --format=%ci)
        local last_commit_timestamp=$(date -d "$last_commit_date" +%s)
        local current_timestamp=$(date +%s)
        local commit_age_hours=$(( (current_timestamp - last_commit_timestamp) / 3600 ))
        
        log_metric "git_last_commit_age_hours" "$commit_age_hours"
        
        if [ "$commit_age_hours" -gt 24 ]; then
            log_warning "Oxirgi commit $commit_age_hours soat oldin qilingan"
        fi
    else
        log_error "Bu Git repository emas"
    fi
}

# Package.json monitoring
monitor_package_json() {
    log_info "Package.json monitoring boshlandi..."
    
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        # Dependencies soni
        local deps_count=$(jq '.dependencies | length' "$PROJECT_ROOT/package.json" 2>/dev/null || echo 0)
        local dev_deps_count=$(jq '.devDependencies | length' "$PROJECT_ROOT/package.json" 2>/dev/null || echo 0)
        
        log_metric "dependencies_count" "$deps_count"
        log_metric "dev_dependencies_count" "$dev_deps_count"
        
        # Outdated packages tekshiruvi
        if command -v pnpm > /dev/null 2>&1; then
            cd "$PROJECT_ROOT"
            local outdated_count=$(pnpm outdated 2>/dev/null | grep -c "^" || echo 0)
            log_metric "outdated_packages_count" "$outdated_count"
            
            if [ "$outdated_count" -gt 10 ]; then
                log_warning "$outdated_count ta eskirgan package mavjud"
            fi
        fi
        
        # Security vulnerabilities
        if command -v pnpm > /dev/null 2>&1; then
            cd "$PROJECT_ROOT"
            local vulnerabilities=$(pnpm audit --json 2>/dev/null | jq '.vulnerabilities | length' 2>/dev/null || echo 0)
            log_metric "security_vulnerabilities" "$vulnerabilities"
            
            if [ "$vulnerabilities" -gt 0 ]; then
                log_error "$vulnerabilities ta xavfsizlik zaifligi aniqlandi"
            fi
        fi
    fi
}

# Disk space monitoring
monitor_disk_space() {
    log_info "Disk space monitoring boshlandi..."
    
    local disk_usage=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $5}' | sed 's/%//')
    log_metric "disk_usage_percent" "$disk_usage"
    
    if [ "$disk_usage" -gt 85 ]; then
        log_error "Disk ishlatilishi $disk_usage% ga yetdi"
    elif [ "$disk_usage" -gt 70 ]; then
        log_warning "Disk ishlatilishi $disk_usage% ga yaqinlashmoqda"
    fi
    
    # Project size
    local project_size=$(du -s "$PROJECT_ROOT" | awk '{print $1}')
    log_metric "project_size_kb" "$project_size"
    
    # Log files size
    if [ -d "$LOG_DIR" ]; then
        local logs_size=$(du -s "$LOG_DIR" | awk '{print $1}')
        log_metric "logs_size_kb" "$logs_size"
        
        if [ "$logs_size" -gt 1048576 ]; then  # 1GB
            log_warning "Log fayllari hajmi 1GB dan katta"
        fi
    fi
}

# Process monitoring
monitor_processes() {
    log_info "Process monitoring boshlandi..."
    
    # Node.js processlari
    local node_processes=$(pgrep -c node 2>/dev/null || echo 0)
    log_metric "node_processes_count" "$node_processes"
    
    # Memory usage
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    log_metric "memory_usage_percent" "$memory_usage"
    
    if (( $(echo "$memory_usage > 80" | bc -l) )); then
        log_error "Xotira ishlatilishi $memory_usage% ga yetdi"
    elif (( $(echo "$memory_usage > 60" | bc -l) )); then
        log_warning "Xotira ishlatilishi $memory_usage% ga yaqinlashmoqda"
    fi
}

# Network monitoring
monitor_network() {
    log_info "Network monitoring boshlandi..."
    
    # Internet connectivity
    if ping -c 1 github.com > /dev/null 2>&1; then
        log_metric "github_connectivity" "1"
    else
        log_metric "github_connectivity" "0"
        log_error "GitHub ga ulanib bo'lmadi"
    fi
    
    # Git remote accessibility
    cd "$PROJECT_ROOT"
    if git ls-remote origin > /dev/null 2>&1; then
        log_metric "git_remote_accessible" "1"
    else
        log_metric "git_remote_accessible" "0"
        log_error "Git remote origin ga ulanib bo'lmadi"
    fi
}

# Error tracking
track_errors() {
    log_info "Error tracking boshlandi..."
    
    # Recent errors soni
    local recent_errors=$(grep -c "$(date '+%Y-%m-%d')" "$ERROR_LOG" 2>/dev/null || echo 0)
    log_metric "today_errors_count" "$recent_errors"
    
    if [ "$recent_errors" -gt "$ALERT_THRESHOLD" ]; then
        log_error "$recent_errors ta xato bugun aniqlandi (threshold: $ALERT_THRESHOLD)"
    fi
    
    # Most frequent errors
    local frequent_errors=$(grep "$(date '+%Y-%m-%d')" "$ERROR_LOG" 2>/dev/null | sort | uniq -c | sort -nr | head -5)
    if [ -n "$frequent_errors" ]; then
        log_info "Eng ko'p takrorlangan xatolar:"
        echo "$frequent_errors" | while read line; do
            log_info "$line"
        done
    fi
}

# Health check
health_check() {
    log_info "Umumiy health check boshlandi..."
    
    local health_score=100
    local issues=()
    
    # Git repository status
    cd "$PROJECT_ROOT"
    if git rev-parse --git-dir > /dev/null 2>&1; then
        local uncommitted=$(git status --porcelain | wc -l)
        if [ "$uncommitted" -gt 0 ]; then
            health_score=$((health_score - 10))
            issues+=("$uncommitted ta commit qilinmagan o'zgarishlar")
        fi
    fi
    
    # Dependencies status
    if [ -f "package.json" ]; then
        if command -v pnpm > /dev/null 2>&1; then
            local vulnerabilities=$(pnpm audit --json 2>/dev/null | jq '.vulnerabilities | length' 2>/dev/null || echo 0)
            if [ "$vulnerabilities" -gt 0 ]; then
                health_score=$((health_score - 20))
                issues+=("$vulnerabilities ta xavfsizlik zaifligi")
            fi
        fi
    fi
    
    # Disk space
    local disk_usage=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        health_score=$((health_score - 30))
        issues+=("Disk ishlatilishi $disk_usage% ga yetdi")
    elif [ "$disk_usage" -gt 80 ]; then
        health_score=$((health_score - 15))
        issues+=("Disk ishlatilishi $disk_usage% ga yaqinlashmoqda")
    fi
    
    log_metric "health_score" "$health_score"
    
    if [ "$health_score" -lt 70 ]; then
        log_error "Health score past: $health_score/100"
        for issue in "${issues[@]}"; do
            log_error "  - $issue"
        done
    elif [ "$health_score" -lt 85 ]; then
        log_warning "Health score o'rta: $health_score/100"
        for issue in "${issues[@]}"; do
            log_warning "  - $issue"
        done
    else
        log_info "Health score yaxshi: $health_score/100"
    fi
}

# Monitoring loop
start_monitoring() {
    log_info "Monitoring tizimi ishga tushirildi (interval: ${CHECK_INTERVAL}s)"
    
    while true; do
        log_info "=== Monitoring cycle boshlandi ==="
        
        # Barcha monitoring funksiyalarini chaqirish
        monitor_git_repo
        monitor_package_json
        monitor_disk_space
        monitor_processes
        monitor_network
        track_errors
        health_check
        
        log_info "=== Monitoring cycle yakunlandi ==="
        
        # Keyingi cycle gacha kutish
        sleep "$CHECK_INTERVAL"
    done
}

# Bir martalik monitoring (cron uchun)
single_monitoring() {
    log_info "Bir martalik monitoring boshlandi"
    
    monitor_git_repo
    monitor_package_json
    monitor_disk_space
    monitor_processes
    monitor_network
    track_errors
    health_check
    
    log_info "Bir martalik monitoring yakunlandi"
}

# Monitoring hisobotini yaratish
generate_report() {
    local report_file="$LOG_DIR/monitoring_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# GitHub Project Monitoring Report

**Generated:** $(date)
**Project:** $(basename "$PROJECT_ROOT")

## System Status

### Health Score
- Current Score: $(grep "health_score" "$METRICS_LOG" | tail -1 | awk '{print $3}' || echo "N/A")

### Git Repository
- Current Branch: $(grep "git_current_branch" "$METRICS_LOG" | tail -1 | awk '{print $3}' || echo "N/A")
- Uncommitted Files: $(grep "git_uncommitted_files" "$METRICS_LOG" | tail -1 | awk '{print $3}' || echo "N/A")
- Commits Behind: $(grep "git_commits_behind" "$METRICS_LOG" | tail -1 | awk '{print $3}' || echo "N/A")

### System Resources
- Disk Usage: $(grep "disk_usage_percent" "$METRICS_LOG" | tail -1 | awk '{print $3}' || echo "N/A")%
- Memory Usage: $(grep "memory_usage_percent" "$METRICS_LOG" | tail -1 | awk '{print $3}' || echo "N/A")%
- Project Size: $(grep "project_size_kb" "$METRICS_LOG" | tail -1 | awk '{print $3}' || echo "N/A") KB

### Dependencies
- Total Dependencies: $(grep "dependencies_count" "$METRICS_LOG" | tail -1 | awk '{print $3}' || echo "N/A")
- Outdated Packages: $(grep "outdated_packages_count" "$METRICS_LOG" | tail -1 | awk '{print $3}' || echo "N/A")
- Security Vulnerabilities: $(grep "security_vulnerabilities" "$METRICS_LOG" | tail -1 | awk '{print $3}' || echo "N/A")

## Recent Errors
$(grep "$(date +%Y-%m-%d)" "$ERROR_LOG" | tail -10 || echo "No recent errors")

## Recommendations
$(if [ "$(grep "health_score" "$METRICS_LOG" | tail -1 | awk '{print $3}' 2>/dev/null || echo 0)" -lt 70 ]; then
    echo "- Health score is low. Check system resources and dependencies."
fi)
$(if [ "$(grep "security_vulnerabilities" "$METRICS_LOG" | tail -1 | awk '{print $3}' 2>/dev/null || echo 0)" -gt 0 ]; then
    echo "- Security vulnerabilities detected. Run 'pnpm audit' to fix."
fi)
$(if [ "$(grep "disk_usage_percent" "$METRICS_LOG" | tail -1 | awk '{print $3}' 2>/dev/null || echo 0)" -gt 80 ]; then
    echo "- Disk usage is high. Consider cleanup operations."
fi)

## Next Steps
1. Review and address any warnings or errors
2. Update outdated dependencies
3. Monitor system resources
4. Review recent commits and branches

---
*This report was generated automatically by the monitoring system.*
EOF
    
    log_info "Monitoring hisobot yaratildi: $report_file"
}

# Yordam funksiyasi
show_help() {
    cat << EOF
GitHub Project Monitoring va Logging Tizimi

Foydalanish: $0 [komanda] [parametrlar]

Komandalar:
    start           - Monitoring tizimini ishga tushurish (doimiy)
    check           - Bir martalik monitoring
    report          - Monitoring hisobotini yaratish
    logs            - Oxirgi loglarni ko'rsatish
    errors          - Xato loglarini ko'rsatish
    metrics         - Metrikalarni ko'rsatish
    cleanup         - Eski log fayllarini tozalash
    help            - Bu yordamni ko'rsatish

Parametrlar:
    --interval SECONDS     - Monitoring intervali (standart: 60s)
    --webhook URL          - Webhook URL
    --telegram-token TOKEN - Telegram bot tokeni
    --telegram-chat ID     - Telegram chat ID
    --log-dir PATH         - Log papkasi yo'li

Misol:
    $0 start                                    # Doimiy monitoring
    $0 check                                    # Bir martalik tekshiruv
    $0 start --interval 30                      # 30 soniya interval bilan
    $0 report                                   # Hisobot yaratish
    $0 logs --lines 50                          # Oxirgi 50 qator log
    $0 errors --since "2023-01-01"              # Ma'lum sanadan beri xatolar
EOF
}

# Loglarni ko'rsatish
show_logs() {
    local lines="${1:-50}"
    local since="${2:-}"
    
    if [ -n "$since" ]; then
        grep "$since" "$MONITOR_LOG" | tail -n "$lines"
    else
        tail -n "$lines" "$MONITOR_LOG"
    fi
}

# Xato loglarni ko'rsatish
show_errors() {
    local lines="${1:-20}"
    local since="${2:-}"
    
    if [ -n "$since" ]; then
        grep "$since" "$ERROR_LOG" | tail -n "$lines"
    else
        tail -n "$lines" "$ERROR_LOG"
    fi
}

# Metrikalarni ko'rsatish
show_metrics() {
    local metric="${1:-}"
    
    if [ -n "$metric" ]; then
        grep "$metric" "$METRICS_LOG" | tail -20
    else
        tail -50 "$METRICS_LOG"
    fi
}

# Eski loglarni tozalash
cleanup_logs() {
    local days="${1:-30}"
    
    log_info "Eski log fayllarni tozalash (older than $days days)"
    
    find "$LOG_DIR" -name "*.log" -type f -mtime +$days -delete 2>/dev/null || true
    find "$LOG_DIR" -name "*.old" -type f -mtime +$days -delete 2>/dev/null || true
    
    log_info "Log tozalash yakunlandi"
}

# Asosiy funksiya
main() {
    # Parametrlarni parsirish
    while [[ $# -gt 0 ]]; do
        case $1 in
            --interval)
                CHECK_INTERVAL="$2"
                shift 2
                ;;
            --webhook)
                WEBHOOK_URL="$2"
                shift 2
                ;;
            --telegram-token)
                TELEGRAM_BOT_TOKEN="$2"
                shift 2
                ;;
            --telegram-chat)
                TELEGRAM_CHAT_ID="$2"
                shift 2
                ;;
            --log-dir)
                LOG_DIR="$2"
                shift 2
                ;;
            --lines)
                LINES="$2"
                shift 2
                ;;
            --since)
                SINCE="$2"
                shift 2
                ;;
            --days)
                DAYS="$2"
                shift 2
                ;;
            start|check|report|logs|errors|metrics|cleanup|help)
                COMMAND="$1"
                shift
                ;;
            *)
                echo "Noma'lum parametri: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Log sozlamalari
    setup_logging
    
    # Komandani bajarish
    case ${COMMAND:-help} in
        start)
            start_monitoring
            ;;
        check)
            single_monitoring
            ;;
        report)
            generate_report
            ;;
        logs)
            show_logs "${LINES:-50}" "${SINCE:-}"
            ;;
        errors)
            show_errors "${LINES:-20}" "${SINCE:-}"
            ;;
        metrics)
            show_metrics "${1:-}"
            ;;
        cleanup)
            cleanup_logs "${DAYS:-30}"
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Skriptni ishga tushurish
main "$@"