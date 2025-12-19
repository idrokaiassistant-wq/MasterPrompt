# Master Prompt

Professional prompt injenering vositasi - Next.js, TypeScript va AI modellar bilan qurilgan.

## 📚 Hujjatlar

Loyiha bo'yicha batafsil qo'llanmalar `docs/` papkasida joylashgan:

- **🚀 Boshlash**: [Automation Guide](docs/guides/AUTOMATION_GUIDE.md)
- **🚄 Railway**: [Railway Setup](docs/railway/RAILWAY_SETUP_GUIDE.md), [Monitoring](docs/railway/RAILWAY_MONITORING_GUIDE.md)
- **🤖 Telegram Bot**: [Bot Setup](docs/telegram/TELEGRAM_BOT_SETUP.md), [Chat ID Setup](docs/telegram/TELEGRAM_CHAT_ID_SETUP.md)
- **🔒 Xavfsizlik**: [Security Policy](docs/security/SECURITY.md)

## Xususiyatlar

- 🤖 Ko'p AI model qo'llab-quvvatlash (OpenRouter, Google Gemini)
- 🌍 Ko'p tilli qo'llab-quvvatlash (O'Z, EN, RU, TR)
- 🎨 Zamonaviy UI Tailwind CSS bilan
- 📝 Prompt shablonlari va tarix
- ⚙️ Kengaytirilgan sozlamalar (harorat, maksimal tokenlar)
- 🔒 Xavfsiz ma'lumotlar saqlash

## Texnologik Stack

- **Framework**: Next.js 16
- **Til**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Komponentlar**: Radix UI
- **Xalqarolashtirish**: next-intl

## Boshlash

### Talablar

- Node.js 18+ 
- pnpm (tavsiya etiladi) yoki npm

### O'rnatish

1. Repository'ni klonlang:
```bash
git clone https://github.com/idrokaiassistant-wq/master-prompt.git
cd master-prompt
```

2. Bog'liqliklarni o'rnating:
```bash
pnpm install
```

3. Environment o'zgaruvchilarini sozlang:
```bash
cp .env.example .env.local
```

`.env.local` faylini tahrirlang va API kalitlaringizni qo'shing:
- `OPENROUTER_API_KEY` - [OpenRouter](https://openrouter.ai/) dan oling
- `GOOGLE_GEMINI_API_KEY` - [Google AI Studio](https://makersuite.google.com/app/apikey) dan oling
- `PMPRO_CREDENTIALS_SECRET` - Quyidagi buyruq bilan yarating: `openssl rand -base64 32`

4. Development server'ni ishga tushiring:
```bash
pnpm dev
```

5. Brauzeringizda [http://localhost:3000](http://localhost:3000) ni oching.

## Skriptlar

- `pnpm dev` - Development server'ni ishga tushirish
- `pnpm build` - Production uchun build qilish
- `pnpm start` - Production server'ni ishga tushirish
- `pnpm lint` - ESLint ishga tushirish
- `pnpm typecheck` - TypeScript type tekshiruvi
- `pnpm test` - Testlarni ishga tushirish
- `pnpm test:coverage` - Coverage bilan testlarni ishga tushirish

## Environment O'zgaruvchilar

Barcha mavjud environment o'zgaruvchilar uchun `.env.example` faylini ko'ring.

## Deployment

### Railway

1. GitHub repository'ni Railway'ga ulang
2. Railway dashboard'da environment o'zgaruvchilarni qo'shing
3. Railway avtomatik ravishda push bo'lganda deploy qiladi

### Boshqa Platformalar

Dastur Next.js'ni qo'llab-quvvatlaydigan har qanday platformaga deploy qilinishi mumkin:
- Vercel
- Netlify
- AWS
- DigitalOcean

## Litsenziya

Xususiy - Barcha huquqlar himoya qilingan
