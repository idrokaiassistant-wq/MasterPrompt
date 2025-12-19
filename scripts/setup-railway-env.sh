# Railway Environment Setup Script
# Automated setup for Railway deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

info() { log "${BLUE}[INFO]${NC} $*"; }
success() { log "${GREEN}[SUCCESS]${NC} $*"; }
warn() { log "${YELLOW}[WARN]${NC} $*"; }
error() { log "${RED}[ERROR]${NC} $*"; }

# Check if Railway CLI is installed
check_railway_cli() {
    info "Checking Railway CLI installation..."
    
    if ! command -v railway &> /dev/null; then
        warn "Railway CLI not found. Installing..."
        
        # Install Railway CLI
        if command -v npm &> /dev/null; then
            npm install -g @railway/cli
        elif command -v yarn &> /dev/null; then
            yarn global add @railway/cli
        else
            error "Neither npm nor yarn found. Please install Node.js first."
            exit 1
        fi
        
        # Verify installation
        if command -v railway &> /dev/null; then
            success "Railway CLI installed successfully"
        else
            error "Failed to install Railway CLI"
            exit 1
        fi
    else
        success "Railway CLI is already installed"
    fi
    
    # Check version
    RAILWAY_VERSION=$(railway --version)
    info "Railway CLI version: $RAILWAY_VERSION"
}

# Login to Railway
railway_login() {
    info "Logging in to Railway..."
    
    if ! railway whoami &> /dev/null; then
        railway login
        
        if ! railway whoami &> /dev/null; then
            error "Failed to login to Railway"
            exit 1
        fi
    fi
    
    success "Logged in to Railway successfully"
}

# Initialize Railway project
init_railway_project() {
    info "Initializing Railway project..."
    
    if [ ! -f "railway.json" ] && [ ! -f "railway.toml" ]; then
        info "Creating new Railway project..."
        railway init
    else
        info "Railway project already initialized"
    fi
}

# Get project information
get_project_info() {
    info "Getting project information..."
    
    PROJECT_ID=$(railway status --json 2>/dev/null | jq -r '.project.id' 2>/dev/null || echo "")
    PROJECT_NAME=$(railway status --json 2>/dev/null | jq -r '.project.name' 2>/dev/null || echo "")
    
    if [ -n "$PROJECT_ID" ]; then
        success "Project: $PROJECT_NAME (ID: $PROJECT_ID)"
    else
        warn "Could not get project information"
    fi
}

# Prompt for required variables
prompt_for_required_variables() {
    info "Setting up required environment variables..."
    
    echo
    warn "Please provide the following required information:"
    echo
    
    # Database URL
    if [ -z "$DATABASE_URL" ]; then
        echo -n "Enter DATABASE_URL (postgresql://user:password@host:port/database): "
        read -r DATABASE_URL
    fi
    
    # JWT Secret
    if [ -z "$JWT_SECRET" ]; then
        echo -n "Enter JWT_SECRET (minimum 32 characters): "
        read -rs JWT_SECRET
        echo
    fi
    
    # Encryption Key
    if [ -z "$ENCRYPTION_KEY" ]; then
        echo -n "Enter ENCRYPTION_KEY (exactly 32 characters): "
        read -rs ENCRYPTION_KEY
        echo
    fi
    
    # Telegram Bot Token
    echo
    info "Telegram Bot Setup:"
    info "1. Message @BotFather on Telegram"
    info "2. Create new bot with /newbot command"
    info "3. Copy the token and paste below"
    echo
    
    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        echo -n "Enter TELEGRAM_BOT_TOKEN: "
        read -r TELEGRAM_BOT_TOKEN
    fi
    
    # Monitoring Chat ID
    echo
    info "Chat ID Setup:"
    info "1. Message @userinfobot on Telegram"
    info "2. Copy your chat ID and paste below"
    echo
    
    if [ -z "$MONITORING_CHAT_ID" ]; then
        echo -n "Enter MONITORING_CHAT_ID: "
        read -r MONITORING_CHAT_ID
    fi
}

# Set environment variables
set_environment_variables() {
    info "Setting environment variables..."
    
    # Required variables
    if [ -n "$DATABASE_URL" ]; then
        railway variables set DATABASE_URL="$DATABASE_URL"
        success "DATABASE_URL set"
    fi
    
    if [ -n "$JWT_SECRET" ]; then
        railway variables set JWT_SECRET="$JWT_SECRET"
        success "JWT_SECRET set"
    fi
    
    if [ -n "$ENCRYPTION_KEY" ]; then
        railway variables set ENCRYPTION_KEY="$ENCRYPTION_KEY"
        success "ENCRYPTION_KEY set"
    fi
    
    # Monitoring variables
    if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
        railway variables set TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN"
        success "TELEGRAM_BOT_TOKEN set"
    fi
    
    if [ -n "$MONITORING_CHAT_ID" ]; then
        railway variables set MONITORING_CHAT_ID="$MONITORING_CHAT_ID"
        success "MONITORING_CHAT_ID set"
    fi
    
    # Railway environment
    railway variables set RAILWAY_ENVIRONMENT="production"
    railway variables set MONITORING_ENABLED="true"
    
    success "Environment variables configured"
}

# Test Telegram bot
test_telegram_bot() {
    if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
        info "Testing Telegram bot..."
        
        response=$(curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe")
        
        if echo "$response" | grep -q '"ok":true'; then
            bot_name=$(echo "$response" | jq -r '.result.username' 2>/dev/null || echo "Unknown")
            success "Telegram bot is working: @$bot_name"
        else
            error "Telegram bot test failed"
            warn "Response: $response"
        fi
    fi
}

# Test monitoring system
test_monitoring_system() {
    info "Testing monitoring system..."
    
    # Test health check
    if [ -f "scripts/health-check.js" ]; then
        info "Testing health check script..."
        if node scripts/health-check.js 2>/dev/null; then
            success "Health check script is working"
        else
            warn "Health check script test failed (services may not be running)"
        fi
    fi
    
    # Test alert system
    if [ -f "scripts/alert.js" ] && [ -n "$TELEGRAM_BOT_TOKEN" ]; then
        info "Testing alert system..."
        if node scripts/alert.js test 2>/dev/null; then
            success "Alert system is working"
        else
            warn "Alert system test failed"
        fi
    fi
}

# Create deployment configuration
create_deployment_config() {
    info "Creating deployment configuration..."
    
    # Create railway.json if it doesn't exist
    if [ ! -f "railway.json" ]; then
        cat > railway.json << EOF
{
  "project": "$PROJECT_NAME",
  "services": {
    "web": {
      "build": "npm run build",
      "start": "npm start",
      "healthcheckPath": "/health",
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 3
    },
    "api-gateway": {
      "build": "npm run build",
      "start": "npm run start:api-gateway",
      "healthcheckPath": "/health",
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 3
    },
    "telegram-service": {
      "build": "npm run build",
      "start": "npm run start:telegram",
      "healthcheckPath": "/health",
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 3
    }
  }
}
EOF
        success "Created railway.json configuration"
    fi
}

# Display final information
show_final_info() {
    echo
    success "🎉 Railway environment setup completed!"
    echo
    info "Next steps:"
    echo "1. Review your environment variables:"
    echo "   railway variables"
    echo
    echo "2. Deploy your application:"
    echo "   railway up"
    echo
    echo "3. Monitor your deployment:"
    echo "   railway logs"
    echo "   railway status"
    echo
    echo "4. Test monitoring system:"
    echo "   railway run node scripts/health-check.js"
    echo "   railway run node scripts/alert.js test"
    echo
    echo "5. Set up cron jobs for continuous monitoring:"
    echo "   See docs/CRON_SETUP.md for instructions"
    echo
    info "Useful commands:"
    echo "• railway variables - View all variables"
    echo "• railway logs -s web - View web service logs"
    echo "• railway status - Check deployment status"
    echo "• railway run npm test - Run tests in Railway environment"
    echo
    success "Your Railway monitoring system is ready! 🚀"
}

# Main function
main() {
    echo
    success "🚂 Railway Server Monitoring Setup"
    echo "====================================="
    echo
    
    # Check prerequisites
    check_railway_cli
    railway_login
    init_railway_project
    get_project_info
    
    # Setup environment
    prompt_for_required_variables
    set_environment_variables
    
    # Testing
    test_telegram_bot
    test_monitoring_system
    create_deployment_config
    
    # Final information
    show_final_info
}

# Run main function
main "$@"