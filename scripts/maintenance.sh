#!/bin/bash

# Railway Server Maintenance Script
# System maintenance, cleanup, and optimization

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/maintenance.log"
TEMP_DIR="$PROJECT_ROOT/temp"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_entry="[$timestamp] [$level] $message"
    
    echo -e "$log_entry" | tee -a "$LOG_FILE"
}

info() { log "INFO" "$@"; }
warn() { log "WARN" "${YELLOW}$@${NC}"; }
error() { log "ERROR" "${RED}$@${NC}"; }
success() { log "SUCCESS" "${GREEN}$@${NC}"; }

# Create necessary directories
setup_directories() {
    info "Setting up directories..."
    mkdir -p "$PROJECT_ROOT/logs"
    mkdir -p "$PROJECT_ROOT/backups"
    mkdir -p "$PROJECT_ROOT/temp"
    mkdir -p "$PROJECT_ROOT/cleanup"
}

# System cleanup
cleanup_system() {
    info "Starting system cleanup..."
    
    # Clean temporary files
    info "Cleaning temporary files..."
    find "$TEMP_DIR" -type f -mtime +1 -delete 2>/dev/null || true
    find /tmp -name "*.tmp" -mtime +1 -delete 2>/dev/null || true
    
    # Clean log files (keep last 30 days)
    info "Cleaning old log files..."
    find "$PROJECT_ROOT/logs" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Clean backup files (keep last 10 backups)
    info "Cleaning old backups..."
    ls -1t "$BACKUP_DIR" 2>/dev/null | tail -n +11 | while read -r backup; do
        rm -rf "$BACKUP_DIR/$backup"
        info "Removed old backup: $backup"
    done
    
    # Clean npm/pnpm cache
    info "Cleaning package manager cache..."
    pnpm store prune 2>/dev/null || npm cache clean --force 2>/dev/null || true
    
    # Clean Docker (if available)
    if command -v docker &> /dev/null; then
        info "Cleaning Docker resources..."
        docker system prune -f 2>/dev/null || true
        docker volume prune -f 2>/dev/null || true
    fi
    
    success "System cleanup completed"
}

# Database maintenance
database_maintenance() {
    info "Starting database maintenance..."
    
    if [[ -z "$DATABASE_URL" ]]; then
        warn "DATABASE_URL not set, skipping database maintenance"
        return
    fi
    
    # Vacuum and analyze (PostgreSQL)
    if command -v psql &> /dev/null; then
        info "Running PostgreSQL maintenance..."
        
        # Vacuum and analyze all tables
        psql "$DATABASE_URL" -c "VACUUM ANALYZE;" 2>/dev/null || warn "VACUUM ANALYZE failed"
        
        # Update statistics
        psql "$DATABASE_URL" -c "SELECT pg_stat_reset();" 2>/dev/null || warn "Statistics reset failed"
        
        # Check database size
        local db_size=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null || echo "unknown")
        info "Database size: $db_size"
        
        # Check table sizes
        psql "$DATABASE_URL" -c "
            SELECT schemaname, tablename, 
                   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
            FROM pg_tables 
            WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
            LIMIT 10;
        " 2>/dev/null || true
        
        success "PostgreSQL maintenance completed"
    fi
    
    # Redis maintenance
    if command -v redis-cli &> /dev/null && [[ -n "$REDIS_URL" ]]; then
        info "Running Redis maintenance..."
        
        # Get Redis info
        redis-cli -u "$REDIS_URL" INFO 2>/dev/null | grep -E "(used_memory|connected_clients|keyspace_hits|keyspace_misses)" || true
        
        # Save current state
        redis-cli -u "$REDIS_URL" BGSAVE 2>/dev/null || true
        
        success "Redis maintenance completed"
    fi
}

# System optimization
optimize_system() {
    info "Starting system optimization..."
    
    # Update system packages (if running as root)
    if [[ $EUID -eq 0 ]]; then
        info "Updating system packages..."
        apt-get update && apt-get upgrade -y 2>/dev/null || yum update -y 2>/dev/null || true
    fi
    
    # Optimize Node.js memory usage
    info "Optimizing Node.js settings..."
    export NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"
    
    # Set system limits
    if [[ -f /etc/security/limits.conf ]]; then
        info "Setting system limits..."
        ulimit -n 65536 2>/dev/null || true
        ulimit -u 32768 2>/dev/null || true
    fi
    
    # Optimize network settings
    info "Optimizing network settings..."
    echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf 2>/dev/null || true
    echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf 2>/dev/null || true
    sysctl -p 2>/dev/null || true
    
    success "System optimization completed"
}

# Security checks
security_checks() {
    info "Running security checks..."
    
    # Check file permissions
    info "Checking file permissions..."
    find "$PROJECT_ROOT" -type f -name "*.js" -o -name "*.json" -o -name "*.env" | while read -r file; do
        if [[ $(stat -c "%a" "$file") -gt 644 ]]; then
            warn "File has excessive permissions: $file"
            chmod 644 "$file"
        fi
    done
    
    # Check for sensitive files
    info "Checking for sensitive files..."
    find "$PROJECT_ROOT" -name "*.pem" -o -name "*.key" -o -name "*.p12" | while read -r file; do
        if [[ $(stat -c "%a" "$file") -gt 600 ]]; then
            warn "Sensitive file has excessive permissions: $file"
            chmod 600 "$file"
        fi
    done
    
    # Check environment variables
    info "Checking environment variables..."
    if [[ -z "$JWT_SECRET" ]]; then
        error "JWT_SECRET is not set"
    fi
    
    if [[ -z "$ENCRYPTION_KEY" ]]; then
        error "ENCRYPTION_KEY is not set"
    fi
    
    if [[ -n "$JWT_SECRET" ]] && [[ ${#JWT_SECRET} -lt 32 ]]; then
        error "JWT_SECRET is too short (minimum 32 characters)"
    fi
    
    if [[ -n "$ENCRYPTION_KEY" ]] && [[ ${#ENCRYPTION_KEY} -ne 32 ]]; then
        error "ENCRYPTION_KEY must be exactly 32 characters"
    fi
    
    # Check for default passwords
    if [[ "$DB_PASSWORD" == "postgres123" ]] || [[ "$DB_PASSWORD" == "password" ]]; then
        warn "Database is using default password"
    fi
    
    success "Security checks completed"
}

# Performance monitoring
performance_monitoring() {
    info "Running performance monitoring..."
    
    # System load
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    info "System load average: $load_avg"
    
    # Memory usage
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
    info "Memory usage: ${mem_usage}%"
    
    # Disk usage
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    info "Disk usage: ${disk_usage}%"
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\\1/" | awk '{print 100 - $1}')
    info "CPU usage: ${cpu_usage}%"
    
    # Check for high resource usage
    if (( $(echo "$mem_usage > 85" | bc -l) )); then
        warn "High memory usage detected: ${mem_usage}%"
    fi
    
    if (( $(echo "$disk_usage > 90" | bc -l) )); then
        warn "High disk usage detected: ${disk_usage}%"
    fi
    
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        warn "High CPU usage detected: ${cpu_usage}%"
    fi
    
    success "Performance monitoring completed"
}

# Log rotation
rotate_logs() {
    info "Rotating logs..."
    
    local log_files=(
        "$PROJECT_ROOT/logs/api-gateway.log"
        "$PROJECT_ROOT/logs/telegram-service.log"
        "$PROJECT_ROOT/logs/web.log"
        "$PROJECT_ROOT/logs/deployment.log"
        "$PROJECT_ROOT/logs/monitoring.log"
    )
    
    for log_file in "${log_files[@]}"; do
        if [[ -f "$log_file" ]]; then
            local file_size=$(stat -c%s "$log_file" 2>/dev/null || echo 0)
            local max_size=$((10 * 1024 * 1024)) # 10MB
            
            if [[ $file_size -gt $max_size ]]; then
                local timestamp=$(date +%Y%m%d_%H%M%S)
                local rotated_file="${log_file}.${timestamp}"
                
                mv "$log_file" "$rotated_file"
                gzip "$rotated_file"
                
                info "Rotated log file: $(basename "$log_file")"
            fi
        fi
    done
    
    success "Log rotation completed"
}

# Service health check
health_check() {
    info "Running service health checks..."
    
    # Check if health check script exists
    if [[ -f "$SCRIPT_DIR/health-check.js" ]]; then
        node "$SCRIPT_DIR/health-check.js"
        
        if [[ $? -eq 0 ]]; then
            success "Health checks passed"
        else
            error "Health checks failed"
        fi
    else
        warn "Health check script not found"
    fi
}

# Generate maintenance report
generate_report() {
    info "Generating maintenance report..."
    
    local report_file="$PROJECT_ROOT/logs/maintenance_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
Railway Server Maintenance Report
Generated: $(date)
=====================================

System Information:
- Hostname: $(hostname)
- OS: $(uname -s)
- Kernel: $(uname -r)
- Architecture: $(uname -m)
- Uptime: $(uptime -p)

Resource Usage:
- Load Average: $(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
- Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", ($3/$2) * 100.0}')
- Disk Usage: $(df -h / | awk 'NR==2{print $5}')
- CPU Usage: $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\\1/" | awk '{print 100 - $1}')%

Service Status:
EOF
    
    # Add service status
    if [[ -f "$SCRIPT_DIR/health-check.js" ]]; then
        node "$SCRIPT_DIR/health-check.js" 2>/dev/null | grep -E "(healthy|unhealthy)" >> "$report_file" || true
    fi
    
    cat >> "$report_file" << EOF

Environment Variables:
- NODE_ENV: ${NODE_ENV:-not set}
- RAILWAY_SERVICE_NAME: ${RAILWAY_SERVICE_NAME:-not set}
- RAILWAY_REGION: ${RAILWAY_REGION:-not set}

Recent Logs:
$(tail -n 20 "$LOG_FILE" 2>/dev/null || echo "No logs available")

Maintenance Completed: $(date)
EOF
    
    success "Maintenance report generated: $report_file"
}

# Main maintenance function
run_maintenance() {
    info "Starting Railway server maintenance..."
    
    cleanup_system
    database_maintenance
    optimize_system
    security_checks
    performance_monitoring
    rotate_logs
    health_check
    generate_report
    
    success "Maintenance completed successfully!"
    info "Check logs at: $LOG_FILE"
}

# Show maintenance status
status() {
    info "Maintenance Status:"
    
    # Check log file
    if [[ -f "$LOG_FILE" ]]; then
        echo "Last maintenance: $(stat -c %y "$LOG_FILE" 2>/dev/null || echo "Unknown")"
        echo "Log file size: $(du -h "$LOG_FILE" 2>/dev/null | cut -f1)"
    fi
    
    # Check disk space
    echo "Disk space:"
    df -h / | tail -n 1
    
    # Check memory
    echo "Memory usage:"
    free -h | grep Mem
    
    # Check recent logs
    if [[ -f "$LOG_FILE" ]]; then
        echo
        info "Recent maintenance logs:"
        tail -n 10 "$LOG_FILE"
    fi
}

# Show help
help() {
    echo "Railway Server Maintenance Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  run       - Run full maintenance (default)"
    echo "  cleanup   - Clean up temporary files and logs"
    echo "  database  - Run database maintenance"
    echo "  optimize  - Optimize system performance"
    echo "  security  - Run security checks"
    echo "  health    - Run health checks"
    echo "  status    - Show maintenance status"
    echo "  report    - Generate maintenance report"
    echo "  help      - Show this help"
    echo
    echo "Examples:"
    echo "  $0 run"
    echo "  $0 cleanup"
    echo "  $0 status"
}

# Main script logic
main() {
    local command=${1:-run}
    
    setup_directories
    
    case "$command" in
        run)
            run_maintenance
            ;;
        cleanup)
            cleanup_system
            ;;
        database)
            database_maintenance
            ;;
        optimize)
            optimize_system
            ;;
        security)
            security_checks
            ;;
        health)
            health_check
            ;;
        status)
            status
            ;;
        report)
            generate_report
            ;;
        help|--help|-h)
            help
            ;;
        *)
            error "Unknown command: $command"
            help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"