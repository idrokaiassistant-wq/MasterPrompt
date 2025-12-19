#!/bin/bash

# Keraksiz Fayllarni Avtomatlashtirilgan Tozalash Skripti
# Bu skript .gitignore asosida va standart qoidalarga asosan fayllarni tozalaydi

set -e

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Konfiguratsiya
BACKUP_DIR="cleanup_backup_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="cleanup.log"
DRY_RUN=false
FORCE_MODE=false

# Statistika
TOTAL_FILES=0
DELETED_FILES=0
BACKUP_FILES=0

# Log funksiyalari
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Yordam funksiyasi
show_help() {
    cat << EOF
Keraksiz Fayllarni Tozalash Skripti

Foydalanish: $0 [OPTIONS]

OPTIONS:
    -h, --help          Yordamni ko'rsatish
    -d, --dry-run       Dry run rejimi (fayllarni o'chirmaydi)
    -f, --force         Force rejimi (tasdiqlamasdan o'chiradi)
    -b, --no-backup     Backup yaratmasdan tozalash
    -p, --path PATH     Tozalash uchun maxsus papka
    -t, --type TYPE     Tozalash turi (all/git/node/temp/custom)

Tozalash turlari:
    all     - Barcha turdagi fayllarni tozalash (standart)
    git     - Git ignore fayllarini tozalash
    node    - Node.js fayllarini tozalash
    temp    - Vaqtinchalik fayllarni tozalash
    custom  - Maxsus .cleanupignore fayli asosida tozalash

Misol:
    $0                  # Standart tozalash
    $0 --dry-run        # Dry run rejimi
    $0 --force --type node # Node.js fayllarini force tozalash
    $0 --path ./src --type temp # Src papkadagi temp fayllar
EOF
}

# Backup yaratish
create_backup() {
    local file_path=$1
    local backup_path="$BACKUP_DIR/$file_path"
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY RUN] Backup yaratiladi: $file_path -> $backup_path"
        return 0
    fi
    
    # Backup papkasini yaratish
    mkdir -p "$(dirname "$backup_path")"
    
    # Faylni backup qilish
    if cp -r "$file_path" "$backup_path" 2>/dev/null; then
        BACKUP_FILES=$((BACKUP_FILES + 1))
        log "Backup yaratildi: $file_path"
        return 0
    else
        error "Backup yaratish muvaffaqiyatsiz: $file_path"
        return 1
    fi
}

# Git ignore fayllarini olish
get_gitignore_patterns() {
    local patterns=()
    
    if [ -f ".gitignore" ]; then
        log ".gitignore fayli asosida patternlar olinmoqda..."
        
        # Git ignore patternlarini o'qish va tozalash
        while IFS= read -r line; do
            # Bo'sh qatorlarni va kommentariyalarni o'tkazib yuborish
            if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
                patterns+=("$line")
            fi
        done < .gitignore
    fi
    
    # Standart Git ignore patternlarini qo'shish
    patterns+=(
        "*.log"
        "*.tmp"
        "*.temp"
        "*.swp"
        "*.swo"
        "*~"
        ".DS_Store"
        "Thumbs.db"
        "node_modules/"
        "dist/"
        "build/"
        ".next/"
        ".turbo/"
        "coverage/"
        ".nyc_output/"
        "*.tsbuildinfo"
        "next-env.d.ts"
    )
    
    printf '%s\n' "${patterns[@]}"
}

# Node.js fayllarini tozalash
cleanup_node_files() {
    log "Node.js fayllarini tozalash..."
    
    local node_patterns=(
        "node_modules/"
        "npm-debug.log*"
        "yarn-debug.log*"
        "yarn-error.log*"
        "pnpm-debug.log*"
        "lerna-debug.log*"
        ".npm/"
        ".yarn/"
        ".pnpm/"
        "package-lock.json"
        "yarn.lock"
        "pnpm-lock.yaml"
    )
    
    cleanup_with_patterns "${node_patterns[@]}"
}

# Vaqtinchalik fayllarni tozalash
cleanup_temp_files() {
    log "Vaqtinchalik fayllarni tozalash..."
    
    local temp_patterns=(
        "*.tmp"
        "*.temp"
        "*.swp"
        "*.swo"
        "*~"
        ".DS_Store"
        "Thumbs.db"
        "desktop.ini"
        ".~lock.*"
        "*.bak"
        "*.backup"
        "*.old"
        "*.orig"
        "*.rej"
    )
    
    cleanup_with_patterns "${temp_patterns[@]}"
}

# Git fayllarini tozalash
cleanup_git_files() {
    log "Git ignore asosida fayllarni tozalash..."
    
    local git_patterns=()
    while IFS= read -r pattern; do
        git_patterns+=("$pattern")
    done < <(get_gitignore_patterns)
    
    if [ ${#git_patterns[@]} -gt 0 ]; then
        cleanup_with_patterns "${git_patterns[@]}"
    else
        warning "Hech qanday Git ignore patternlari topilmadi"
    fi
}

# Pattern asosida tozalash
cleanup_with_patterns() {
    local patterns=("$@")
    local found_files=()
    
    log "Pattern asosida tozalash boshlandi..."
    
    for pattern in "${patterns[@]}"; do
        if [ -n "$pattern" ]; then
            # Glob pattern bilan fayllarni topish
            while IFS= read -r -d '' file; do
                if [ -e "$file" ]; then
                    found_files+=("$file")
                fi
            done < <(find . -name "$pattern" -type f -print0 2>/dev/null || true)
            
            # Katalog patternlari uchun
            while IFS= read -r -d '' dir; do
                if [ -d "$dir" ]; then
                    found_files+=("$dir")
                fi
            done < <(find . -name "$pattern" -type d -print0 2>/dev/null || true)
        fi
    done
    
    # Takroriy fayllarni olib tashlash
    local unique_files=($(printf '%s\n' "${found_files[@]}" | sort -u))
    
    if [ ${#unique_files[@]} -eq 0 ]; then
        log "Tozalash uchun hech qanday fayl topilmadi"
        return 0
    fi
    
    log "Topilgan fayllar: ${#unique_files[@]}"
    
    for file in "${unique_files[@]}"; do
        if [ -e "$file" ]; then
            TOTAL_FILES=$((TOTAL_FILES + 1))
            
            # Backup yaratish (agar backup kerak bo'lsa)
            if [ "$BACKUP_ENABLED" = true ]; then
                create_backup "$file"
            fi
            
            # Faylni o'chirish
            if delete_file "$file"; then
                DELETED_FILES=$((DELETED_FILES + 1))
            fi
        fi
    done
}

# Faylni o'chirish
delete_file() {
    local file_path=$1
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY RUN] O'chiriladi: $file_path"
        return 0
    fi
    
    # Tasdiqlash (agar force mode bo'lmasa)
    if [ "$FORCE_MODE" = false ]; then
        echo -n "O'chirishni xohlaysizmi: $file_path? (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log "O'chirish bekor qilindi: $file_path"
            return 0
        fi
    fi
    
    # Faylni o'chirish
    if rm -rf "$file_path" 2>/dev/null; then
        log "O'chirildi: $file_path"
        return 0
    else
        error "O'chirish muvaffaqiyatsiz: $file_path"
        return 1
    fi
}

# Bo'sh papkalarni topish va o'chirish
cleanup_empty_dirs() {
    log "Bo'sh papkalarni tozalash..."
    
    local empty_dirs=()
    
    # Bo'sh papkalarni topish
    while IFS= read -r -d '' dir; do
        if [ -d "$dir" ] && [ -z "$(ls -A "$dir" 2>/dev/null)" ]; then
            empty_dirs+=("$dir")
        fi
    done < <(find . -type d -print0 2>/dev/null)
    
    if [ ${#empty_dirs[@]} -eq 0 ]; then
        log "Bo'sh papkalar topilmadi"
        return 0
    fi
    
    log "Topilgan bo'sh papkalar: ${#empty_dirs[@]}"
    
    for dir in "${empty_dirs[@]}"; do
        # Asosiy papkalarni o'chirmaslik
        if [[ "$dir" == "." || "$dir" == ".." || "$dir" == "./.git" ]]; then
            continue
        fi
        
        delete_file "$dir"
    done
}

# Disk bo'sh joyini tekshirish
check_disk_space() {
    local available_space=$(df . | tail -1 | awk '{print $4}')
    local min_space=1048576  # 1GB in KB
    
    if [ "$available_space" -lt "$min_space" ]; then
        warning "Disk bo'sh joyi kam: ${available_space}KB. Tozalash tavsiya etiladi."
        return 1
    fi
    
    return 0
}

# Tozalash statistikasini ko'rsatish
show_stats() {
    log "Tozalash statistikasi:"
    log "  Jami fayllar topildi: $TOTAL_FILES"
    log "  O'chirilgan fayllar: $DELETED_FILES"
    log "  Backup yaratilgan: $BACKUP_FILES"
    log "  Backup papkasi: $BACKUP_DIR"
    
    if [ "$DRY_RUN" = true ]; then
        warning "DRY RUN rejimi - hech qanday fayl o'chirilmadi"
    fi
}

# Asosiy tozalash funksiyasi
main() {
    local cleanup_type="all"
    local custom_path="."
    BACKUP_ENABLED=true
    
    # Log faylini tozalash
    > "$LOG_FILE"
    
    log "Tozalash skripti boshlandi"
    
    # Parametrlarni parsirish
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE_MODE=true
                shift
                ;;
            -b|--no-backup)
                BACKUP_ENABLED=false
                shift
                ;;
            -p|--path)
                custom_path="$2"
                shift 2
                ;;
            -t|--type)
                cleanup_type="$2"
                shift 2
                ;;
            *)
                error "Noma'lum parametri: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Disk bo'sh joyini tekshirish
    check_disk_space
    
    # Backup papkasini yaratish (agar backup kerak bo'lsa)
    if [ "$BACKUP_ENABLED" = true ] && [ "$DRY_RUN" = false ]; then
        mkdir -p "$BACKUP_DIR"
        log "Backup papkasi yaratildi: $BACKUP_DIR"
    fi
    
    # Tozalash turini tanlash
    case $cleanup_type in
        "all")
            cleanup_git_files
            cleanup_temp_files
            cleanup_node_files
            ;;
        "git")
            cleanup_git_files
            ;;
        "node")
            cleanup_node_files
            ;;
        "temp")
            cleanup_temp_files
            ;;
        "custom")
            if [ -f ".cleanupignore" ]; then
                log "Maxsus .cleanupignore fayli asosida tozalash"
                # .cleanupignore faylini o'qish va tozalash
                local custom_patterns=()
                while IFS= read -r line; do
                    if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
                        custom_patterns+=("$line")
                    fi
                done < .cleanupignore
                
                if [ ${#custom_patterns[@]} -gt 0 ]; then
                    cleanup_with_patterns "${custom_patterns[@]}"
                fi
            else
                warning ".cleanupignore fayli topilmadi"
            fi
            ;;
        *)
            error "Noto'g'ri tozalash turi: $cleanup_type"
            show_help
            exit 1
            ;;
    esac
    
    # Bo'sh papkalarni tozalash
    cleanup_empty_dirs
    
    # Statistikani ko'rsatish
    show_stats
    
    success "Tozalash muvaffaqiyatli yakunlandi!"
}

# Skriptni ishga tushurish
main "$@"