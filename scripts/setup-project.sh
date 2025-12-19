#!/bin/bash

# Project Setup va Dependencies Avtomat O'rnatish Skripti
# Bu skript loyiha boshlanganda barcha kerakli sozlamalarni avtomatik amalga oshiradi

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
LOG_FILE="$PROJECT_ROOT/setup.log"
BACKUP_DIR="$PROJECT_ROOT/backups/setup_$(date +%Y%m%d_%H%M%S)"
NODE_VERSION="18.0.0"
PNPM_VERSION="9.0.0"

# Progress tracking
CURRENT_STEP=0
TOTAL_STEPS=10

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

info() {
    echo -e "${PURPLE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Progress bar ko'rsatish
show_progress() {
    local step=$1
    local total=$2
    local message=$3
    
    local percentage=$((step * 100 / total))
    local filled=$(printf "%.0s=" $(seq 1 $((percentage / 2))))
    local empty=$(printf "%.0s " $(seq 1 $((50 - percentage / 2))))
    
    printf "\r${BLUE}[%s%s] %d%%${NC} %s" "$filled" "$empty" "$percentage" "$message"
    
    if [ "$step" -eq "$total" ]; then
        echo ""
    fi
}

# Step boshlash
start_step() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    show_progress $CURRENT_STEP $TOTAL_STEPS "$1"
    log "$1"
}

# Step yakunlash
end_step() {
    success "$1"
}

# System requirements tekshirish
check_system_requirements() {
    start_step "Tizim talablarini tekshirish..."
    
    # OS tekshirish
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="windows"
    else
        error "Qo'llab-quvvatlanmaydigan operatsion tizim: $OSTYPE"
    fi
    
    info "Operatsion tizim: $OS"
    
    # Git tekshirish
    if ! command -v git &> /dev/null; then
        error "Git o'rnatilmagan. Iltimos, Git o'rnatib keyin qayta urinib ko'ring."
    fi
    
    # Node.js tekshirish
    if command -v node &> /dev/null; then
        local current_version=$(node --version | sed 's/v//')
        info "Node.js versiyasi: $current_version"
        
        if [ "$(printf '%s\n' "$NODE_VERSION" "$current_version" | sort -V | head -n1)" != "$NODE_VERSION" ]; then
            warning "Node.js versiyasi eskirgan. Yangilash tavsiya etiladi."
        fi
    else
        warning "Node.js o'rnatilmagan. O'rnatish jarayoni boshlanadi."
    fi
    
    # pnpm tekshirish
    if ! command -v pnpm &> /dev/null; then
        info "pnpm o'rnatilmagan. O'rnatish jarayoni boshlanadi."
    fi
    
    end_step "Tizim talablari tekshirildi"
}

# Node.js o'rnatish (agar kerak bo'lsa)
install_nodejs() {
    start_step "Node.js o'rnatish..."
    
    if command -v node &> /dev/null; then
        info "Node.js allaqachon o'rnatilgan"
        return 0
    fi
    
    case $OS in
        "linux")
            # NodeSource repository qo'shish
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install node
            else
                error "Homebrew o'rnatilmagan. Iltimos, Homebrew o'rnatib keyin qayta urinib ko'ring."
            fi
            ;;
        "windows")
            warning "Windows uchun Node.js qo'lda o'rnatilishi kerak. https://nodejs.org/"
            return 1
            ;;
    esac
    
    if command -v node &> /dev/null; then
        success "Node.js muvaffaqiyatli o'rnatildi: $(node --version)"
    else
        error "Node.js o'rnatish muvaffaqiyatsiz tugadi"
    fi
}

# pnpm o'rnatish
install_pnpm() {
    start_step "pnpm o'rnatish..."
    
    if command -v pnpm &> /dev/null; then
        info "pnpm allaqachon o'rnatilgan: $(pnpm --version)"
        return 0
    fi
    
    # pnpm o'rnatish
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    
    # PATH ga qo'shish
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
    
    # Shell konfiguratsiyasiga qo'shish
    echo 'export PNPM_HOME="$HOME/.local/share/pnpm"' >> ~/.bashrc
    echo 'export PATH="$PNPM_HOME:$PATH"' >> ~/.bashrc
    
    if command -v pnpm &> /dev/null; then
        success "pnpm muvaffaqiyatli o'rnatildi: $(pnpm --version)"
    else
        error "pnpm o'rnatish muvaffaqiyatsiz tugadi"
    fi
}

# Backup yaratish
create_backup() {
    start_step "Backup yaratish..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Muhim fayllarni backup qilish
    local backup_files=(
        "package.json"
        "pnpm-lock.yaml"
        "turbo.json"
        ".env.example"
        "tsconfig.json"
    )
    
    for file in "${backup_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            cp "$PROJECT_ROOT/$file" "$BACKUP_DIR/"
            info "Backup yaratildi: $file"
        fi
    done
    
    success "Backup muvaffaqiyatli yaratildi: $BACKUP_DIR"
}

# Dependencies tekshirish va o'rnatish
install_dependencies() {
    start_step "Dependencies o'rnatish..."
    
    cd "$PROJECT_ROOT"
    
    # pnpm lock faylini tekshirish
    if [ ! -f "pnpm-lock.yaml" ]; then
        warning "pnpm-lock.yaml topilmadi. Yangi lock fayli yaratiladi."
    fi
    
    # Dependencies o'rnatish
    log "Dependencies o'rnatilmoqda..."
    pnpm install --frozen-lockfile || pnpm install
    
    # Husky git hooks o'rnatish
    if [ -f "package.json" ] && grep -q "husky" package.json; then
        log "Git hooks o'rnatilmoqda..."
        pnpm husky install || true
    fi
    
    success "Dependencies muvaffaqiyatli o'rnatildi"
}

# Environment fayllarini sozlash
setup_environment() {
    start_step "Environment fayllarini sozlash..."
    
    cd "$PROJECT_ROOT"
    
    # .env.example dan .env yaratish (agar kerak bo'lsa)
    if [ -f ".env.example" ] && [ ! -f ".env" ]; then
        cp .env.example .env
        info ".env fayli .env.example dan yaratildi"
        
        # Xavfsizlik uchun placeholder qiymatlarni tekshirish
        if grep -q "your_" .env; then
            warning ".env faylida placeholder qiymatlar mavjud. Iltimos, ularni to'g'rilang."
        fi
    fi
    
    # .env.local yaratish (agar kerak bo'lsa)
    if [ -f ".env.example" ] && [ ! -f ".env.local" ]; then
        cp .env.example .env.local
        info ".env.local fayli yaratildi"
    fi
    
    success "Environment fayllari sozlandi"
}

# Git sozlamalari
setup_git() {
    start_step "Git sozlamalari..."
    
    # Git hooks o'rnatish
    if [ -d ".husky" ]; then
        log "Git hooks sozlanmoqda..."
        
        # Pre-commit hook
        if [ ! -f ".husky/pre-commit" ]; then
            cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Pre-commit tekshiruvlari
pnpm lint-staged
EOF
            chmod +x .husky/pre-commit
            info "Pre-commit hook yaratildi"
        fi
        
        # Pre-push hook
        if [ ! -f ".husky/pre-push" ]; then
            cat > .husky/pre-push << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Pre-push tekshiruvlari
pnpm test
pnpm build
EOF
            chmod +x .husky/pre-push
            info "Pre-push hook yaratildi"
        fi
    fi
    
    success "Git sozlamalari yakunlandi"
}

# Database sozlamalari
setup_database() {
    start_step "Database sozlamalari..."
    
    # Prisma tekshirish
    if [ -f "prisma/schema.prisma" ]; then
        log "Prisma schema tekshirilmoqda..."
        
        # Prisma generate
        pnpm prisma generate || warning "Prisma generate muvaffaqiyatsiz tugadi"
        
        # Database push (development uchun)
        if [ "$NODE_ENV" != "production" ]; then
            log "Database push bajarilmoqda..."
            pnpm prisma db push || warning "Database push muvaffaqiyatsiz tugadi"
        fi
    fi
    
    success "Database sozlamalari yakunlandi"
}

# Development muhitini sozlash
setup_development() {
    start_step "Development muhitini sozlash..."
    
    # VS Code settings (agar kerak bo'lsa)
    if [ -d ".vscode" ] || [ ! -d ".vscode" ]; then
        mkdir -p .vscode
        
        # Extensions tavsiyalari
        cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "github.copilot"
  ]
}
EOF
        
        # Settings
        cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
EOF
        
        info "VS Code sozlamalari yaratildi"
    fi
    
    success "Development muhitini sozlash yakunlandi"
}

# Test muhitini sozlash
setup_testing() {
    start_step "Test muhitini sozlash..."
    
    # Test dependencies tekshirish
    if grep -q "test" package.json; then
        log "Test skriptlari tekshirilmoqda..."
        
        # Test command ishlatish
        if pnpm run test -- --passWithNoTests 2>/dev/null; then
            success "Testlar muvaffaqiyatli o'tkazildi"
        else
            warning "Testlar muvaffaqiyatsiz tugadi. Iltimos, testlarni tekshiring."
        fi
    fi
    
    success "Test muhitini sozlash yakunlandi"
}

# Build tekshirish
verify_build() {
    start_step "Build tekshiruvi..."
    
    # Build command tekshirish
    if grep -q "build" package.json; then
        log "Build jarayoni boshlanmoqda..."
        
        # Build
        if pnpm build; then
            success "Build muvaffaqiyatli yakunlandi"
        else
            error "Build muvaffaqiyatsiz tugadi"
        fi
    else
        warning "Build skripti topilmadi"
    fi
    
    success "Build tekshiruvi yakunlandi"
}

# Xavfsizlik tekshiruvi
security_check() {
    start_step "Xavfsizlik tekshiruvi..."
    
    # .env faylini tekshirish
    if [ -f ".env" ]; then
        log ".env faylini tekshirish..."
        
        # Maxfiy kalitlarni tekshirish
        if grep -E "(password|token|key|secret)" .env | grep -v "your_" | grep -v "#"; then
            warning ".env faylida haqiqiy maxfiy kalitlar mavjud. Iltimos, ularni xavfsizlashtiring."
        fi
    fi
    
    # Dependencies xavfsizligini tekshirish
    if command -v pnpm audit &> /dev/null; then
        log "Dependencies audit tekshirilmoqda..."
        pnpm audit --audit-level moderate || warning "Xavfsizlik muammolari aniqlandi"
    fi
    
    success "Xavfsizlik tekshiruvi yakunlandi"
}

# Yakuniy tekshiruv
final_verification() {
    start_step "Yakuniy tekshiruv..."
    
    # Barcha muhim fayllar mavjudligini tekshirish
    local required_files=(
        "package.json"
        "node_modules"
        ".env.example"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -e "$file" ]; then
            error "Muhim fayl topilmadi: $file"
        fi
    done
    
    # Git status tekshirish
    if [ -d ".git" ]; then
        log "Git status:"
        git status --porcelain | head -10
    fi
    
    success "Yakuniy tekshiruv muvaffaqiyatli yakunlandi"
}

# Yordam funksiyasi
show_help() {
    cat << EOF
Project Setup va Dependencies Avtomat O'rnatish Skripti

Foydalanish: $0 [OPTIONS]

OPTIONS:
    -h, --help          Yordamni ko'rsatish
    -f, --force         Force rejimi (tasdiqlamasdan davom etadi)
    -n, --no-backup     Backup yaratmasdan davom etadi
    -s, --skip-tests    Testlarni o'tkazmaydi
    -v, --verbose       Batafsil log chiqaradi
    --node-version VER  Node.js versiyasi (standart: $NODE_VERSION)
    --pnpm-version VER  pnpm versiyasi (standart: $PNPM_VERSION)

Setup bosqichlari:
    1. Tizim talablarini tekshirish
    2. Node.js o'rnatish (agar kerak bo'lsa)
    3. pnpm o'rnatish (agar kerak bo'lsa)
    4. Backup yaratish
    5. Dependencies o'rnatish
    6. Environment fayllarini sozlash
    7. Git sozlamalari
    8. Database sozlamalari (Prisma)
    9. Development muhitini sozlash
    10. Test muhitini sozlash
    11. Build tekshiruvi
    12. Xavfsizlik tekshiruvi
    13. Yakuniy tekshiruv

Misol:
    $0                  # Standart setup
    $0 --force          # Tasdiqlamasdan setup
    $0 --skip-tests     # Testlarsiz setup
    $0 --verbose        # Batafsil log bilan
EOF
}

# Asosiy setup funksiyasi
main() {
    local force_mode=false
    local skip_backup=false
    local skip_tests=false
    local verbose=false
    
    # Log faylini tozalash
    > "$LOG_FILE"
    
    # Banner
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                🚀 Project Setup Skripti                    ║${NC}"
    echo -e "${BLUE}║           GitHub Loyihasi Avtomatlashtiruvchi              ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log "Setup skripti boshlandi: $PROJECT_ROOT"
    
    # Parametrlarni parsirish
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -f|--force)
                force_mode=true
                shift
                ;;
            -n|--no-backup)
                skip_backup=true
                shift
                ;;
            -s|--skip-tests)
                skip_tests=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            --node-version)
                NODE_VERSION="$2"
                shift 2
                ;;
            --pnpm-version)
                PNPM_VERSION="$2"
                shift 2
                ;;
            *)
                error "Noma'lum parametri: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Tasdiqlash (agar force mode bo'lmasa)
    if [ "$force_mode" = false ]; then
        echo -n "Setup jarayonini boshlashni xohlaysizmi? (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log "Setup bekor qilindi"
            exit 0
        fi
    fi
    
    # Setup jarayoni
    check_system_requirements
    install_nodejs
    install_pnpm
    
    if [ "$skip_backup" = false ]; then
        create_backup
    fi
    
    install_dependencies
    setup_environment
    setup_git
    setup_database
    setup_development
    
    if [ "$skip_tests" = false ]; then
        setup_testing
    fi
    
    verify_build
    security_check
    final_verification
    
    # Yakuniy natija
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ✅ Setup Muvaffaqiyatli Yakunlandi!            ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    success "Project setup muvaffaqiyatli yakunlandi!"
    info "Log fayli: $LOG_FILE"
    info "Backup papkasi: $BACKUP_DIR"
    echo ""
    info "Keyingi qadamlar:"
    echo "  1. .env faylini to'g'rilang (agar kerak bo'lsa)"
    echo "  2. 'pnpm dev' buyrug'ini bajaring"
    echo "  3. Browserda http://localhost:3000 ga o'ting"
    echo ""
}

# Skriptni ishga tushurish
main "$@"