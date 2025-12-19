# 🚀 GitHub Loyihasi Avtomatlashtiruvchi Ish Jarayoni

Ushbu repository GitHub loyihalari uchun to'liq avtomatlashtirilgan ish jarayonini taqdim etadi. Barcha skriptlar GitHub Flow qoidalariga muvofiq ishlaydi va CI/CD pipeline bilan integratsiya qilingan.

## 📋 Jadvalda Mazmun

- [Xususiyatlar](#xususiyatlar)
- [O'rnatish](#ornatish)
- [Foydalanish](#foydalanish)
- [GitHub Flow](#github-flow)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring](#monitoring)
- [Xavfsizlik](#xavfsizlik)
- [Qo'llab-quvvatlash](#qollab-quvvatlash)

## ✨ Xususiyatlar

### 🤖 Avtomatlashtirilgan Ish Jarayoni
- **Branch yaratish** - Feature/bugfix/hotfix branchlari avtomatik yaratiladi
- **Semantik commit** - Konventional commit standartlari asosida
- **Pull request** - Avtomatik PR yaratish va code review
- **CI/CD integration** - GitHub Actions bilan to'liq integratsiya

### 🧹 Avtomatlashtirilgan Tozalash
- **Git ignore asosida** - .gitignore faylidagi patternlar asosida
- **Node.js fayllari** - node_modules, build artifacts, log fayllar
- **Vaqtinchalik fayllar** - .tmp, .temp, .swp fayllar
- **Bo'sh papkalar** - Avtomatik bo'sh papka tozalash
- **Backup yaratish** - Tozalashdan oldin backup yaratadi

### 📦 Project Setup
- **Dependencies** - Avtomatik pnpm/npm/yarn o'rnatish
- **Environment** - .env fayllarini avtomatik sozlash
- **Git hooks** - Husky pre-commit/pre-push hooklari
- **Database** - Prisma migrate va seed
- **Testing** - Avtomatik test muhiti sozlamalari

### 📊 Monitoring va Logging
- **Real-time monitoring** - Git, disk, memory, network monitoring
- **Error tracking** - Xatoliklarni kuzatish va alerting
- **Health checks** - Umumiy tizim holati tekshiruvi
- **Telegram/Slack** - Alertlarni messaging platformalarga yuborish

### 🔐 Xavfsizlik
- **Security audit** - Avtomatik dependency audit
- **Vulnerability scanning** - CodeQL va Snyk integratsiyasi
- **Secret scanning** - Maxfiy kalitlarni tekshirish
- **Access control** - Repository access monitoring

## 🚀 O'rnatish

### 1. Repository ni clone qilish
```bash
git clone https://github.com/sizning-repo/github-automation.git
cd github-automation
```

### 2. Skriptlarni executable qilish
```bash
chmod +x scripts/*.sh
```

### 3. Master skriptni ishga tushurish
```bash
# Boshlang'ich sozlash
./scripts/master.sh setup

# Barcha tizimlarni ishga tushurish
./scripts/master.sh start
```

### 4. GitHub CLI o'rnatish (ixtiyoriy)
```bash
# macOS
brew install gh

# Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authentication
gh auth login
```

## 🎯 Foydalanish

### Master Skript

```bash
# Boshlang'ich sozlash
./scripts/master.sh setup

# Barcha tizimlarni boshlash
./scripts/master.sh start

# Holatni tekshirish
./scripts/master.sh status

# Yordam
./scripts/master.sh help
```

### GitHub Flow

```bash
# Yangi feature branch yaratish
./scripts/github-workflow.sh branch feature "yangi-authentication-sistema"

# O'zgarishlarni commit qilish
./scripts/github-workflow.sh commit feat auth "login forma qo'shildi" "Foydalanuvchi authentication jarayoni yaxshilandi" "Closes #123"

# Push qilish
./scripts/github-workflow.sh push

# Pull request yaratish
./scripts/github-workflow.sh pr "feat: yangi login sistema qo'shildi" "Bu PR yangi authentication sistema qo'shadi"

# Code review boshlash
./scripts/github-workflow.sh review 123
```

### Cleanup (Tozalash)

```bash
# Barcha turdagi fayllarni tozalash
./scripts/cleanup.sh

# Dry run rejimi (fayllarni o'chirmaydi)
./scripts/cleanup.sh --dry-run

# Faqat Node.js fayllarini tozalash
./scripts/cleanup.sh --type node

# Force rejimi (tasdiqlamasdan)
./scripts/cleanup.sh --force

# Backup yaratmasdan
./scripts/cleanup.sh --no-backup
```

### Project Setup

```bash
# Standart setup
./scripts/setup-project.sh

# Tasdiqlamasdan setup
./scripts/setup-project.sh --force

# Testlarsiz setup
./scripts/setup-project.sh --skip-tests

# Batafsil log bilan
./scripts/setup-project.sh --verbose
```

### Monitoring

```bash
# Monitoring tizimini boshlash
./scripts/monitor.sh start

# Bir martalik tekshiruv
./scripts/monitor.sh check

# Hisobot yaratish
./scripts/monitor.sh report

# Loglarni ko'rsatish
./scripts/monitor.sh logs --lines 100

# Xato loglarini ko'rsatish
./scripts/monitor.sh errors --since "2023-01-01"
```

## 🌿 GitHub Flow

### Branch Nomlash Konventsiyasi

- **feature/** - Yangi funksiyalar
- **bugfix/** - Xatolik tuzatishlar
- **hotfix/** - Shoshilinch tuzatishlar
- **release/** - Relizlar

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Turlar:**
- `feat`: Yangi funksiya
- `fix`: Xatolik tuzatish
- `docs`: Dokumentatsiya
- `style`: Kod uslubi (formatting)
- `refactor`: Kodni qayta ishlash
- `test`: Testlar
- `chore`: Boshqa o'zgarishlar

**Misol:**
```bash
./scripts/github-workflow.sh commit feat auth "add JWT authentication" "Implement JWT token-based authentication" "Closes #123"
```

## 🔄 CI/CD Pipeline

### Avtomatik Workflowlar

1. **Code Quality** - Lint, format, type checking
2. **Testing** - Unit, integration, E2E testlar
3. **Security** - Vulnerability scanning, audit
4. **Build** - Build artifacts yaratish
5. **Deploy** - Staging va production ga deploy

### GitHub Actions Workflowlari

- **ci-cd.yml** - Asosiy CI/CD pipeline
- **code-quality.yml** - Kod sifati tekshiruvi
- **testing.yml** - Barcha testlar
- **cleanup.yml** - Avtomatik tozalash

### Environmentlar

- **Development** - Local development
- **Staging** - Test muhiti
- **Production** - Haqiqiy muhit

## 📊 Monitoring

### Real-time Monitoring

- **Git Repository** - Branch, commit, uncommitted changes
- **System Resources** - Disk, memory, CPU usage
- **Dependencies** - Outdated packages, vulnerabilities
- **Network** - Connectivity, remote access

### Alerting

- **Telegram** - Bot orqali xabarlar
- **Slack** - Webhook orqali xabarlar
- **Email** - SMTP orqali xabarlar
- **GitHub** - Issues yaratish

### Log Management

- **Structured Logging** - JSON formatda loglar
- **Log Rotation** - Eski loglarni avtomatik tozalash
- **Log Analysis** - Xatoliklarni tahlil qilish

## 🔐 Xavfsizlik

### Security Features

- **Dependency Audit** - Avtomatik security audit
- **Secret Scanning** - Maxfiy kalitlarni tekshirish
- **CodeQL Analysis** - Static code analysis
- **Vulnerability Alerts** - Xavfsizlik zaifliklari

### Best Practices

- **Never commit secrets** - Hech qachon maxfiy kalitlarni commit qilmang
- **Use environment variables** - Environment o'zgaruvchilar ishlating
- **Regular updates** - Dependencies ni yangilab turish
- **Access control** - Repository access ni monitoring qilish

## 🛠️ Qo'llab-quvvatlash

### Debugging

```bash
# Loglarni ko'rish
./scripts/master.sh logs

# Xato loglarini ko'rish
./scripts/master.sh errors

# Statusni tekshirish
./scripts/master.sh status
```

### Xatoliklarni Hal Qilish

1. **GitHub CLI xatolar** - `gh auth login` qayta bajaring
2. **Permission xatolar** - Skriptlarga execute permission bering
3. **Dependency xatolar** - `pnpm install` qayta bajaring
4. **Network xatolar** - Internet ulanishini tekshiring

### Yordam Olish

```bash
# Umumiy yordam
./scripts/master.sh help

# Maxsus skript yordami
./scripts/github-workflow.sh help
./scripts/cleanup.sh help
./scripts/monitor.sh help
```

## 📞 Kontaktlar

Agar muammo yoki takliflaringiz bo'lsa:

1. **GitHub Issues** - Repository da issue yaratish
2. **Telegram** - @your_username
3. **Email** - your.email@example.com

## 📄 Litsenziya

Ushbu loyiha MIT litsenziyasi ostida tarqatiladi. Batafsil: [LICENSE](LICENSE)

---

**🎉 Endi sizning GitHub loyihangiz to'liq avtomatlashtirildi!**

Xavfsiz, samarali va zamonaviy ish jarayoni uchun yaxshi ko'nikmalar!