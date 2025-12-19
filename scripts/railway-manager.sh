#!/bin/bash

# Railway Manager - Railway loyihasini boshqarish uchun universal skript
# Muallif: Trae AI

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Railway CLI tekshirish
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}[ERROR] Railway CLI o'rnatilmagan.${NC}"
        echo "O'rnatish uchun: npm i -g @railway/cli"
        exit 1
    fi
}

# Menyuni ko'rsatish
show_menu() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║               🚂 Railway Server Manager                    ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "1. 🚀 Deploy (Git Push & Deploy)"
    echo "2. 📊 Status (Servislar holati)"
    echo "3. 📝 Logs (Loglarni ko'rish)"
    echo "4. 🔄 Restart (Servisni qayta yuklash/Redeploy)"
    echo "5. ℹ️ Info (Loyiha ma'lumotlari)"
    echo "6. 🚪 Chiqish"
    echo ""
    echo -n "Tanlang [1-6]: "
}

# 1. Deploy funksiyasi
deploy_project() {
    echo -e "${YELLOW}Deploy jarayoni boshlanmoqda...${NC}"
    echo -n "Commit xabarini kiriting: "
    read commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="chore: update project via railway manager"
    fi

    echo -e "${BLUE}[INFO] Git add...${NC}"
    git add .
    
    echo -e "${BLUE}[INFO] Git commit...${NC}"
    git commit -m "$commit_msg"
    
    echo -e "${BLUE}[INFO] Git push...${NC}"
    git push origin main
    
    echo -e "${GREEN}[SUCCESS] O'zgarishlar yuklandi! Railway avtomatik deploy qiladi.${NC}"
    echo "Deploy holatini tekshirish uchun 2-ni bosing."
}

# 2. Status funksiyasi
check_status() {
    echo -e "${YELLOW}Servislar holati tekshirilmoqda...${NC}"
    railway status
    
    echo -e "\n${BLUE}Oxirgi deploylar:${NC}"
    railway deployment list
}

# 3. Logs funksiyasi
view_logs() {
    echo -e "${YELLOW}Qaysi servis loglarini ko'rmoqchisiz?${NC}"
    echo "1. Telegram Service"
    echo "2. API Gateway"
    echo "3. Web App"
    echo "4. Barchasi (Hozirgi tanlangan)"
    echo -n "Tanlang [1-4]: "
    read log_choice

    case $log_choice in
        1)
            echo -e "${BLUE}Telegram Service loglari yuklanmoqda...${NC}"
            # Servis nomi aniq bo'lishi kerak, hozircha taxminiy
            railway logs --service telegram-service
            ;;
        2)
            echo -e "${BLUE}API Gateway loglari yuklanmoqda...${NC}"
            railway logs --service api-gateway
            ;;
        3)
            echo -e "${BLUE}Web App loglari yuklanmoqda...${NC}"
            railway logs --service web
            ;;
        4)
            railway logs
            ;;
        *)
            echo -e "${RED}Noto'g'ri tanlov${NC}"
            ;;
    esac
}

# 4. Restart funksiyasi
restart_service() {
    echo -e "${YELLOW}Diqqat! Bu servisni qayta ishga tushiradi (Redeploy).${NC}"
    echo "Siz 'railway redeploy' buyrug'ini ishlatmoqdasiz."
    
    echo -n "Davom etishni xohlaysizmi? (y/n): "
    read confirm
    if [ "$confirm" == "y" ]; then
        railway redeploy
    fi
}

# 5. Info funksiyasi
show_info() {
    echo -e "${BLUE}Loyiha haqida:${NC}"
    # railway list komandasi barcha loyihalarni chiqaradi, bizga joriy loyiha kerak
    railway status
    echo ""
    echo -e "${BLUE}Foydalanuvchi:${NC}"
    railway whoami
}

# Asosiy logika
main() {
    check_railway_cli
    
    while true; do
        show_menu
        read choice
        
        case $choice in
            1) deploy_project ;;
            2) check_status ;;
            3) view_logs ;;
            4) restart_service ;;
            5) show_info ;;
            6) 
                echo -e "${GREEN}Xayr!${NC}"
                exit 0 
                ;;
            *) echo -e "${RED}Noto'g'ri tanlov!${NC}" ;;
        esac
        
        echo ""
        echo -n "Davom etish uchun Enter bosing..."
        read
        # clear buyrug'i windows git bash da ishlamasligi mumkin, shuning uchun shunchaki yangi qator
        echo -e "\n\n"
    done
}

main
