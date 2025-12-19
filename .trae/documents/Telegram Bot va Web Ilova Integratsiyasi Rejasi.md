Sizning talablaringiz bo'yicha Telegram botni kengaytirish va Web ilova bilan to'liq integratsiya qilish rejasini ishlab chiqdim.

### 1. Profil Boshqaruvi
*   **Ma'lumotlar bazasi:** `users` jadvalini kengaytirib, foydalanuvchi ma'lumotlarini (ism, telefon, balans, obuna holati) saqlaymiz.
*   **Bot buyruqlari:** `/profile` buyrug'i orqali shaxsiy kabinetni ko'rsatish va tahrirlash (inline tugmalar orqali).

### 2. Obuna va To'lov Tizimi
*   **Integratsiya:** O'zbekiston uchun Click yoki Payme, xalqaro uchun Stripe integratsiyasi (hozircha Click/Payme simulyatsiyasi).
*   **Paketlar:** `subscriptions` jadvali yaratib, Free, Pro, Premium rejalarni belgilaymiz.
*   **Mantiq:** Har bir so'rov oldidan foydalanuvchining obuna holatini tekshiruvchi `middleware` qo'shamiz.

### 3. Web Ilova Integratsiyasi (Telegram Mini App)
*   **Login:** Telegram orqali Web App ga avtomatik kirish (SSO).
*   **Sinxronizatsiya:** Botda qilingan o'zgarishlar (masalan, obuna sotib olish) darhol Web App da ko'rinadi va aksincha. Ikkisi ham yagona PostgreSQL bazasidan foydalanadi.

### 4. Cheklovlar va Bildirishnomalar
*   **Limitlar:** Free foydalanuvchilar uchun kunlik limit (masalan, 5 ta prompt).
*   **Cron Job:** Har kuni obuna muddati tugayotgan foydalanuvchilarni tekshirib, bot orqali ogohlantirish yuborish.

**Amalga oshirish bosqichlari:**
1.  **DB Schema Yangilash:** `User` va `Subscription` modellarini Prisma da yangilash.
2.  **API Gateway:** Obuna va profil uchun yangi endpointlar qo'shish.
3.  **Bot Logikasi:** Yangi buyruqlar (`/profile`, `/subscribe`) va middleware larni qo'shish.
4.  **Web App:** Telegram Mini App sifatida ochilganda foydalanuvchini tanib olish.

Ushbu rejani tasdiqlasangiz, darhol ma'lumotlar bazasini yangilashdan ishni boshlayman.
