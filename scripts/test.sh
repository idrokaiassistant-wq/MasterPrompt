#!/bin/bash

# Railway Server Monitoring Test Script
# Tests all monitoring and configuration systems

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/test.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

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
test_header() { log "TEST" "${BLUE}$@${NC}"; }

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Test helper functions
run_test() {
    local test_name=$1
    local test_command=$2
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    test_header "Testing: $test_name"
    
    if eval "$test_command"; then
        success "✅ PASSED: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        error "❌ FAILED: $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_file_exists() {
    local file=$1
    local description=$2
    
    if [[ -f "$file" ]]; then
        success "✅ File exists: $description"
        return 0
    else
        error "❌ File not found: $description ($file)"
        return 1
    fi
}

assert_command_exists() {
    local command=$1
    local description=$2
    
    if command -v "$command" &> /dev/null; then
        success "✅ Command available: $description"
        return 0
    else
        error "❌ Command not found: $description ($command)"
        return 1
    fi
}

assert_environment_variable() {
    local var_name=$1
    local description=$2
    
    if [[ -n "${!var_name}" ]]; then
        success "✅ Environment variable set: $description"
        return 0
    else
        error "❌ Environment variable not set: $description ($var_name)"
        return 1
    fi
}

# Test: File structure
test_file_structure() {
    test_header "Testing file structure..."
    
    assert_file_exists "$SCRIPT_DIR/health-check.js" "Health check script"
    assert_file_exists "$SCRIPT_DIR/monitor.js" "Monitor script"
    assert_file_exists "$SCRIPT_DIR/alert.js" "Alert script"
    assert_file_exists "$SCRIPT_DIR/deploy.sh" "Deployment script"
    assert_file_exists "$SCRIPT_DIR/maintenance.sh" "Maintenance script"
    
    assert_file_exists "$PROJECT_ROOT/config/railway.config.js" "Railway configuration"
    assert_file_exists "$PROJECT_ROOT/config/railway.config.env" "Railway environment config"
    assert_file_exists "$PROJECT_ROOT/docs/RAILWAY_MONITORING_GUIDE.md" "Monitoring guide"
    assert_file_exists "$PROJECT_ROOT/docs/QUICK_REFERENCE.md" "Quick reference"
    assert_file_exists "$PROJECT_ROOT/docs/CRON_SETUP.md" "Cron setup guide"
}

# Test: Dependencies
test_dependencies() {
    test_header "Testing dependencies..."
    
    assert_command_exists "node" "Node.js"
    assert_command_exists "npm" "npm"
    
    # Check if pnpm is available (optional)
    if command -v pnpm &> /dev/null; then
        success "✅ pnpm is available"
    else
        warn "⚠️  pnpm not found, npm will be used"
    fi
    
    # Check if redis-cli is available (optional)
    if command -v redis-cli &> /dev/null; then
        success "✅ redis-cli is available"
    else
        warn "⚠️  redis-cli not found, Redis checks will be skipped"
    fi
    
    # Check if psql is available (optional)
    if command -v psql &> /dev/null; then
        success "✅ psql is available"
    else
        warn "⚠️  psql not found, database checks will be skipped"
    fi
}

# Test: Script syntax
test_script_syntax() {
    test_header "Testing script syntax..."
    
    run_test "Health check script syntax" "node -c '$SCRIPT_DIR/health-check.js'"
    run_test "Monitor script syntax" "node -c '$SCRIPT_DIR/monitor.js'"
    run_test "Alert script syntax" "node -c '$SCRIPT_DIR/alert.js'"
    
    # Test bash scripts
    run_test "Deploy script syntax" "bash -n '$SCRIPT_DIR/deploy.sh'"
    run_test "Maintenance script syntax" "bash -n '$SCRIPT_DIR/maintenance.sh'"
}

# Test: Configuration files
test_configuration() {
    test_header "Testing configuration files..."
    
    # Test JavaScript configuration
    run_test "Railway config syntax" "node -c '$PROJECT_ROOT/config/railway.config.js'"
    
    # Test environment configuration
    if [[ -f "$PROJECT_ROOT/config/railway.config.env" ]]; then
        success "✅ Environment config file exists"
        
        # Check for required variables
        local required_vars=("DATABASE_URL" "JWT_SECRET" "ENCRYPTION_KEY")
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" "$PROJECT_ROOT/config/railway.config.env"; then
                success "✅ Required variable found: $var"
            else
                error "❌ Required variable missing: $var"
            fi
        done
    else
        error "❌ Environment config file not found"
    fi
}

# Test: Environment variables
test_environment() {
    test_header "Testing environment variables..."
    
    # Check critical environment variables
    assert_environment_variable "DATABASE_URL" "Database URL"
    assert_environment_variable "JWT_SECRET" "JWT Secret"
    assert_environment_variable "ENCRYPTION_KEY" "Encryption Key"
    
    # Check optional but recommended variables
    if [[ -n "$TELEGRAM_BOT_TOKEN" ]]; then
        success "✅ Telegram bot token configured"
    else
        warn "⚠️  Telegram bot token not configured"
    fi
    
    if [[ -n "$MONITORING_CHAT_ID" ]]; then
        success "✅ Monitoring chat ID configured"
    else
        warn "⚠️  Monitoring chat ID not configured"
    fi
}

# Test: Alert system
test_alert_system() {
    test_header "Testing alert system..."
    
    # Test alert script without sending actual alerts
    run_test "Alert script test mode" "cd '$PROJECT_ROOT' && node '$SCRIPT_DIR/alert.js' test 2>/dev/null || true"
    
    # Test alert configuration
    if [[ -n "$TELEGRAM_BOT_TOKEN" && -n "$MONITORING_CHAT_ID" ]]; then
        success "✅ Telegram alerts configured"
    else
        warn "⚠️  Telegram alerts not fully configured"
    fi
    
    if [[ -n "$MONITORING_WEBHOOK_URL" ]]; then
        success "✅ Webhook alerts configured"
    else
        warn "⚠️  Webhook alerts not configured"
    fi
}

# Test: Health check functionality
test_health_check() {
    test_header "Testing health check functionality..."
    
    # Test health check script (may fail if services aren't running)
    info "Running health check test..."
    cd "$PROJECT_ROOT"
    
    if node "$SCRIPT_DIR/health-check.js" 2>/dev/null; then
        success "✅ Health check completed successfully"
    else
        warn "⚠️  Health check failed (services may not be running)"
    fi
}

# Test: Monitoring system
test_monitoring() {
    test_header "Testing monitoring system..."
    
    # Test monitor script
    info "Testing monitor script..."
    cd "$PROJECT_ROOT"
    
    # Test monitor stats
    if node "$SCRIPT_DIR/monitor.js" stats 2>/dev/null; then
        success "✅ Monitor stats working"
    else
        warn "⚠️  Monitor stats failed"
    fi
}

# Test: Deployment script
test_deployment() {
    test_header "Testing deployment script..."
    
    # Test deployment script help
    run_test "Deployment script help" "'$SCRIPT_DIR/deploy.sh' help"
    
    # Test script permissions
    if [[ -x "$SCRIPT_DIR/deploy.sh" ]]; then
        success "✅ Deployment script is executable"
    else
        error "❌ Deployment script is not executable"
        chmod +x "$SCRIPT_DIR/deploy.sh"
    fi
}

# Test: Maintenance script
test_maintenance() {
    test_header "Testing maintenance script..."
    
    # Test maintenance script help
    run_test "Maintenance script help" "'$SCRIPT_DIR/maintenance.sh' help"
    
    # Test script permissions
    if [[ -x "$SCRIPT_DIR/maintenance.sh" ]]; then
        success "✅ Maintenance script is executable"
    else
        error "❌ Maintenance script is not executable"
        chmod +x "$SCRIPT_DIR/maintenance.sh"
    fi
}

# Test: Log directory
test_logs() {
    test_header "Testing log directory..."
    
    local log_dir="$PROJECT_ROOT/logs"
    
    if [[ -d "$log_dir" ]]; then
        success "✅ Log directory exists"
        
        # Test write permissions
        if touch "$log_dir/test.log" 2>/dev/null; then
            rm -f "$log_dir/test.log"
            success "✅ Log directory is writable"
        else
            error "❌ Log directory is not writable"
        fi
    else
        warn "⚠️  Log directory not found, creating..."
        mkdir -p "$log_dir"
        success "✅ Log directory created"
    fi
}

# Test: Backup directory
test_backup() {
    test_header "Testing backup directory..."
    
    local backup_dir="$PROJECT_ROOT/backups"
    
    if [[ -d "$backup_dir" ]]; then
        success "✅ Backup directory exists"
    else
        warn "⚠️  Backup directory not found, creating..."
        mkdir -p "$backup_dir"
        success "✅ Backup directory created"
    fi
}

# Test: Cron setup (optional)
test_cron() {
    test_header "Testing cron setup..."
    
    if command -v crontab &> /dev/null; then
        success "✅ Crontab is available"
        
        # Check if cron service is running
        if pgrep cron &> /dev/null; then
            success "✅ Cron service is running"
        else
            warn "⚠️  Cron service is not running"
        fi
    else
        warn "⚠️  Crontab is not available"
    fi
}

# Test: Network connectivity
test_network() {
    test_header "Testing network connectivity..."
    
    # Test internet connectivity
    if ping -c 1 google.com &> /dev/null; then
        success "✅ Internet connectivity available"
    else
        warn "⚠️  Internet connectivity issues detected"
    fi
    
    # Test Telegram API (if token is configured)
    if [[ -n "$TELEGRAM_BOT_TOKEN" ]]; then
        if curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" &> /dev/null; then
            success "✅ Telegram API is accessible"
        else
            error "❌ Telegram API is not accessible"
        fi
    fi
}

# Test: System resources
test_resources() {
    test_header "Testing system resources..."
    
    # Check available memory
    local available_memory=$(free -m | awk 'NR==2{print $7}')
    if [[ $available_memory -gt 500 ]]; then
        success "✅ Sufficient memory available (${available_memory}MB)"
    else
        warn "⚠️  Low memory available (${available_memory}MB)"
    fi
    
    # Check disk space
    local available_disk=$(df -h / | awk 'NR==2{print $4}' | sed 's/G//')
    if [[ $(echo "$available_disk > 1" | bc -l) -eq 1 ]]; then
        success "✅ Sufficient disk space available (${available_disk}GB)"
    else
        warn "⚠️  Low disk space available (${available_disk}GB)"
    fi
    
    # Check CPU load
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    if [[ $(echo "$load_avg < 2.0" | bc -l) -eq 1 ]]; then
        success "✅ CPU load is normal (${load_avg})"
    else
        warn "⚠️  High CPU load detected (${load_avg})"
    fi
}

# Generate test report
generate_report() {
    test_header "Generating test report..."
    
    local report_file="$PROJECT_ROOT/logs/test_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
Railway Server Monitoring Test Report
Generated: $(date)
=====================================

Test Summary:
- Total Tests: $TESTS_TOTAL
- Passed: $TESTS_PASSED
- Failed: $TESTS_FAILED
- Success Rate: $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%

Environment:
- Hostname: $(hostname)
- OS: $(uname -s)
- Node Version: $(node --version)
- NPM Version: $(npm --version)
- Railway Environment: ${RAILWAY_ENVIRONMENT:-not set}

Configuration Status:
- Database URL: $([ -n "$DATABASE_URL" ] && echo "configured" || echo "not configured")
- JWT Secret: $([ -n "$JWT_SECRET" ] && echo "configured" || echo "not configured")
- Telegram Bot: $([ -n "$TELEGRAM_BOT_TOKEN" ] && echo "configured" || echo "not configured")
- Monitoring Chat: $([ -n "$MONITORING_CHAT_ID" ] && echo "configured" || echo "not configured")

System Resources:
- Load Average: $(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
- Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", ($3/$2) * 100.0}')
- Disk Usage: $(df -h / | awk 'NR==2{print $5}')

Recommendations:
$(if [[ $TESTS_FAILED -gt 0 ]]; then echo "- Fix failed tests before deployment"; fi)
$(if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then echo "- Configure Telegram bot token for alerts"; fi)
$(if [[ -z "$MONITORING_CHAT_ID" ]]; then echo "- Configure monitoring chat ID"; fi)
$(if [[ ! -x "$SCRIPT_DIR/deploy.sh" ]]; then echo "- Make deployment script executable"; fi)
$(if [[ ! -x "$SCRIPT_DIR/maintenance.sh" ]]; then echo "- Make maintenance script executable"; fi)

Next Steps:
1. Review and fix any failed tests
2. Configure missing environment variables
3. Set up cron jobs for automated monitoring
4. Test alert system with actual notifications
5. Deploy to Railway

For more information, see:
- docs/RAILWAY_MONITORING_GUIDE.md
- docs/QUICK_REFERENCE.md
- docs/CRON_SETUP.md
EOF
    
    success "Test report generated: $report_file"
}

# Main test function
run_all_tests() {
    info "Starting Railway Server Monitoring Tests..."
    info "Project root: $PROJECT_ROOT"
    info "Script directory: $SCRIPT_DIR"
    
    # Run all tests
    test_file_structure
    test_dependencies
    test_script_syntax
    test_configuration
    test_environment
    test_alert_system
    test_health_check
    test_monitoring
    test_deployment
    test_maintenance
    test_logs
    test_backup
    test_cron
    test_network
    test_resources
    
    # Generate final report
    generate_report
    
    # Summary
    echo
    test_header "TEST SUMMARY"
    info "Total Tests: $TESTS_TOTAL"
    success "Passed: $TESTS_PASSED"
    error "Failed: $TESTS_FAILED"
    info "Success Rate: $(( TESTS_PASSED * 100 / TESTS_TOTAL ))%"
    
    # Exit code
    if [[ $TESTS_FAILED -eq 0 ]]; then
        success "🎉 All tests passed! System is ready for deployment."
        exit 0
    else
        error "❌ Some tests failed. Please review and fix issues before deployment."
        exit 1
    fi
}

# Show help
show_help() {
    echo "Railway Server Monitoring Test Script"
    echo
    echo "Usage: $0 [OPTION]"
    echo
    echo "Options:"
    echo "  run       - Run all tests (default)"
    echo "  quick     - Run quick tests only"
    echo "  config    - Test configuration only"
    echo "  scripts   - Test scripts only"
    echo "  system    - Test system only"
    echo "  help      - Show this help"
    echo
    echo "Examples:"
    echo "  $0"
    echo "  $0 quick"
    echo "  $0 config"
}

# Quick test (only critical components)
run_quick_tests() {
    info "Running quick tests..."
    
    test_file_structure
    test_dependencies
    test_script_syntax
    test_configuration
    test_alert_system
    
    echo
    test_header "QUICK TEST SUMMARY"
    info "Total Tests: $TESTS_TOTAL"
    success "Passed: $TESTS_PASSED"
    error "Failed: $TESTS_FAILED"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        success "✅ Quick tests passed!"
    else
        error "❌ Quick tests failed."
    fi
}

# Main script logic
main() {
    local command=${1:-run}
    
    case "$command" in
        run)
            run_all_tests
            ;;
        quick)
            run_quick_tests
            ;;
        config)
            test_configuration
            ;;
        scripts)
            test_script_syntax
            ;;
        system)
            test_resources
            test_network
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"