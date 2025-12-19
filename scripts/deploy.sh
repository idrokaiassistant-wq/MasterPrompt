#!/bin/bash

# Railway Server Deployment Script
# Automated deployment with rollback capability

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/deployment.log"
BACKUP_DIR="$PROJECT_ROOT/backups"
MAX_BACKUPS=5

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
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        error "pnpm is not installed"
        exit 1
    fi
    
    # Check environment variables
    if [[ -z "$DATABASE_URL" ]]; then
        error "DATABASE_URL environment variable is not set"
        exit 1
    fi
    
    if [[ -z "$JWT_SECRET" ]]; then
        error "JWT_SECRET environment variable is not set"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    info "Creating backup..."
    
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Backup database (if pg_dump is available)
    if command -v pg_dump &> /dev/null; then
        info "Backing up database..."
        pg_dump "$DATABASE_URL" > "$backup_path/database.sql" 2>/dev/null || warn "Database backup failed"
    fi
    
    # Backup current deployment
    cp -r "$PROJECT_ROOT/apps" "$backup_path/" 2>/dev/null || true
    cp -r "$PROJECT_ROOT/packages" "$backup_path/" 2>/dev/null || true
    cp "$PROJECT_ROOT/package.json" "$backup_path/" 2>/dev/null || true
    cp "$PROJECT_ROOT/pnpm-lock.yaml" "$backup_path/" 2>/dev/null || true
    
    # Create backup manifest
    cat > "$backup_path/manifest.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "environment": "${NODE_ENV:-development}",
  "railway_service": "${RAILWAY_SERVICE_NAME:-unknown}",
  "backup_type": "pre-deployment"
}
EOF
    
    # Cleanup old backups
    cleanup_old_backups
    
    success "Backup created: $backup_name"
    echo "$backup_name" > "$BACKUP_DIR/latest_backup.txt"
}

# Cleanup old backups
cleanup_old_backups() {
    info "Cleaning up old backups..."
    
    local backup_count=$(ls -1 "$BACKUP_DIR" | grep -c '^backup_' || true)
    
    if [[ $backup_count -gt $MAX_BACKUPS ]]; then
        ls -1t "$BACKUP_DIR" | grep '^backup_' | tail -n +$((MAX_BACKUPS + 1)) | while read -r backup; do
            rm -rf "$BACKUP_DIR/$backup"
            info "Removed old backup: $backup"
        done
    fi
}

# Install dependencies
install_dependencies() {
    info "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install pnpm dependencies
    pnpm install --frozen-lockfile
    
    # Generate Prisma client
    pnpm db:generate
    
    success "Dependencies installed"
}

# Build application
build_application() {
    info "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Build all services
    pnpm build
    
    # Check if build was successful
    if [[ $? -ne 0 ]]; then
        error "Build failed"
        exit 1
    fi
    
    success "Application built successfully"
}

# Run database migrations
run_migrations() {
    info "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Check if migrations are needed
    if [[ -d "prisma/migrations" ]]; then
        pnpm db:migrate
        
        if [[ $? -ne 0 ]]; then
            error "Database migration failed"
            exit 1
        fi
        
        success "Database migrations completed"
    else
        info "No migrations found, skipping..."
    fi
}

# Run health checks
run_health_checks() {
    info "Running health checks..."
    
    # Check if health check script exists
    if [[ -f "$SCRIPT_DIR/health-check.js" ]]; then
        node "$SCRIPT_DIR/health-check.js"
        
        if [[ $? -ne 0 ]]; then
            error "Health checks failed"
            exit 1
        fi
        
        success "Health checks passed"
    else
        warn "Health check script not found, skipping..."
    fi
}

# Start services
start_services() {
    info "Starting services..."
    
    cd "$PROJECT_ROOT"
    
    # Use PM2 if available, otherwise use node
    if command -v pm2 &> /dev/null; then
        info "Using PM2 to manage services..."
        
        # Start all services
        pm2 start ecosystem.config.js 2>/dev/null || {
            warn "PM2 ecosystem config not found, starting manually..."
            start_services_manually
        }
        
        # Save PM2 configuration
        pm2 save
        
    else
        start_services_manually
    fi
    
    success "Services started"
}

# Start services manually
start_services_manually() {
    warn "Starting services manually (consider installing PM2 for better process management)..."
    
    # Start API Gateway
    cd "$PROJECT_ROOT/apps/api-gateway"
    nohup node dist/index.js > "$PROJECT_ROOT/logs/api-gateway.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/temp/api-gateway.pid"
    
    # Start Telegram Service
    cd "$PROJECT_ROOT/apps/telegram-service"
    nohup node dist/bot.js > "$PROJECT_ROOT/logs/telegram-service.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/temp/telegram-service.pid"
    
    # Start Web Service
    cd "$PROJECT_ROOT/apps/web"
    nohup npm start > "$PROJECT_ROOT/logs/web.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/temp/web.pid"
    
    info "Services started in background. Check logs in $PROJECT_ROOT/logs/"
}

# Stop services
stop_services() {
    info "Stopping services..."
    
    # Stop PM2 services
    if command -v pm2 &> /dev/null; then
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
    fi
    
    # Stop manually started services
    if [[ -d "$PROJECT_ROOT/temp" ]]; then
        for pid_file in "$PROJECT_ROOT/temp"/*.pid; do
            if [[ -f "$pid_file" ]]; then
                local pid=$(cat "$pid_file")
                if kill -0 "$pid" 2>/dev/null; then
                    kill "$pid"
                    info "Stopped service: $(basename "$pid_file" .pid)"
                fi
                rm "$pid_file"
            fi
        done
    fi
    
    success "Services stopped"
}

# Rollback deployment
rollback() {
    error "Deployment failed. Initiating rollback..."
    
    local latest_backup=$(cat "$BACKUP_DIR/latest_backup.txt" 2>/dev/null)
    
    if [[ -z "$latest_backup" ]]; then
        error "No backup found for rollback"
        exit 1
    fi
    
    local backup_path="$BACKUP_DIR/$latest_backup"
    
    if [[ ! -d "$backup_path" ]]; then
        error "Backup directory not found: $backup_path"
        exit 1
    fi
    
    info "Rolling back to: $latest_backup"
    
    # Stop current services
    stop_services
    
    # Restore from backup
    if [[ -d "$backup_path/apps" ]]; then
        rm -rf "$PROJECT_ROOT/apps"
        cp -r "$backup_path/apps" "$PROJECT_ROOT/"
    fi
    
    if [[ -d "$backup_path/packages" ]]; then
        rm -rf "$PROJECT_ROOT/packages"
        cp -r "$backup_path/packages" "$PROJECT_ROOT/"
    fi
    
    # Restore database if backup exists
    if [[ -f "$backup_path/database.sql" ]]; then
        info "Restoring database..."
        psql "$DATABASE_URL" < "$backup_path/database.sql" 2>/dev/null || warn "Database restore failed"
    fi
    
    # Restart services
    start_services
    
    success "Rollback completed"
}

# Main deployment function
deploy() {
    info "Starting Railway deployment..."
    
    setup_directories
    check_prerequisites
    create_backup
    
    # Stop current services
    stop_services
    
    # Install dependencies and build
    install_dependencies
    build_application
    run_migrations
    
    # Run health checks before starting services
    run_health_checks
    
    # Start services
    start_services
    
    # Final health check
    sleep 10
    run_health_checks
    
    success "Deployment completed successfully!"
    info "Check logs at: $LOG_FILE"
}

# Show deployment status
status() {
    info "Deployment Status:"
    
    # Check if services are running
    if command -v pm2 &> /dev/null; then
        pm2 status
    else
        echo "Service PIDs:"
        for pid_file in "$PROJECT_ROOT/temp"/*.pid; do
            if [[ -f "$pid_file" ]]; then
                local service=$(basename "$pid_file" .pid)
                local pid=$(cat "$pid_file")
                if kill -0 "$pid" 2>/dev/null; then
                    echo "  $service: Running (PID: $pid)"
                else
                    echo "  $service: Stopped"
                fi
            fi
        done
    fi
    
    # Show recent logs
    if [[ -f "$LOG_FILE" ]]; then
        echo
        info "Recent deployment logs:"
        tail -n 20 "$LOG_FILE"
    fi
    
    # Show latest backup
    if [[ -f "$BACKUP_DIR/latest_backup.txt" ]]; then
        echo
        info "Latest backup: $(cat "$BACKUP_DIR/latest_backup.txt")"
    fi
}

# Show help
help() {
    echo "Railway Server Deployment Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  deploy    - Deploy the application (default)"
    echo "  start     - Start services"
    echo "  stop      - Stop services"
    echo "  restart   - Restart services"
    echo "  rollback  - Rollback to previous deployment"
    echo "  status    - Show deployment status"
    echo "  health    - Run health checks"
    echo "  backup    - Create backup"
    echo "  help      - Show this help"
    echo
    echo "Environment Variables:"
    echo "  DATABASE_URL        - PostgreSQL connection string"
    echo "  JWT_SECRET          - JWT secret key (min 32 chars)"
    echo "  ENCRYPTION_KEY      - Encryption key (32 chars)"
    echo "  NODE_ENV            - Environment (development/production)"
    echo "  RAILWAY_SERVICE_NAME - Railway service name"
    echo
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 status"
    echo "  $0 rollback"
}

# Main script logic
main() {
    local command=${1:-deploy}
    
    case "$command" in
        deploy)
            deploy
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            sleep 2
            start_services
            ;;
        rollback)
            rollback
            ;;
        status)
            status
            ;;
        health)
            run_health_checks
            ;;
        backup)
            create_backup
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