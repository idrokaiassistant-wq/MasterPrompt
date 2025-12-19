# Telegram Botni Qayta Yozish va Integratsiya Rejasi

Foydalanuvchi talablariga asosan, Telegram botni qayta yozish va prompt yaratish jarayonini Mini App ichiga ko'chirish kerak. Hozirda botning ko'p qismlari (profil, tarix, shablonlar) ishlamayapti, chunki ular API Gateway bilan to'g'ri bog'lanmagan yoki API Gateway javob bermayapti.

## Asosiy O'zgarishlar

1.  **Prompt Yaratishni Mini Appga O'tkazish:**
    *   `/new` buyrug'i endi foydalanuvchidan matn kiritishni so'ramaydi.
    *   Uning o'rniga "Prompt Yaratish" tugmasi chiqadi va u Mini Appni (`/new` sahifasini) ochadi.
    *   Mini Appda prompt yaratish formasi bo'ladi.

2.  **API Gateway Integratsiyasini Tuzatish:**
    *   Bot `fetch` orqali `API_GATEWAY_URL` ga murojaat qilmoqda, lekin xatoliklar (`Failed to fetch`) qaytmoqda.
    *   `API_GATEWAY_URL` ning to'g'ri ekanligini va API Gateway ishlayotganini tekshirish kerak.
    *   Hozirgi `API_GATEWAY_URL` (`https://api-gateway-production-c59d.up.railway.app`) to'g'ri ishlashini ta'minlash.

3.  **Bot Kodini Optimallashtirish va Qayta Yozish:**
    *   Bot kodini modullarga ajratish (handlers, middlewares, services).
    *   Xatoliklarni to'g'ri ushlash va foydalanuvchiga tushunarli xabar berish.

## Bosqichma-bosqich Reja

### 1-bosqich: Bot Strukturasini Yangilash
*   Bot kodini toza va modulli strukturaga o'tkazish.
*   `src/handlers` papkasini yaratish va buyruqlarni alohida fayllarga ajratish.

### 2-bosqich: `/new` Buyrug'ini O'zgartirish
*   `/new` buyrug'i bosilganda Mini Appni ochadigan tugma chiqarish.
*   Tugma `web_app` parametri bilan ishlaydi va URL `https://masterprompt-production.up.railway.app/uz/new` (yoki mos sahifa) bo'ladi.

### 3-bosqich: API Gateway Bilan Aloqani Tekshirish va Tuzatish
*   `api-gateway` servisi Railwayda ishlayotganini tekshirish.
*   Botdagi `API_GATEWAY_URL` konfiguratsiyasini tekshirish.
*   Botdan yuborilayotgan so'rovlar to'g'ri formatda ekanligini (headers, tokenlar) tekshirish.

### 4-bosqich: Profil, Tarix va Shablonlar Bo'limlarini Tuzatish
*   `/profile`, `/history`, `/templates` buyruqlari uchun API integratsiyasini qayta ko'rib chiqish.
*   Agar API ishlamasa, vaqtincha "Tez orada ishga tushadi" degan xabar yoki keshdagi ma'lumotlarni ko'rsatish (agar mavjud bo'lsa).

### 5-bosqich: Deploy va Tekshirish
*   O'zgarishlarni Railwayga deploy qilish.
*   Botni jonli test qilish.

## Texnik Tafsilotlar
*   **Til:** TypeScript
*   **Kutubxona:** Telegraf.js
*   **Framework:** Express (Webhook server uchun)
*   **Platforma:** Railway
