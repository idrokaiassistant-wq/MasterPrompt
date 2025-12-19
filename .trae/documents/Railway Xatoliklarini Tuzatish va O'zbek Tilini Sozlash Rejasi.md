Men sizning so'rovingizni tahlil qildim. Muammo shundaki, siz ko'rgan xabar (`alert.js`) shunchaki **test xabari** bo'lib, u bir marta ishga tushirilgan va to'xtagan. Doimiy monitoring ishlashi uchun `monitor.js` skripti fonda ishlashi kerak. Shuningdek, barcha xabarlarni o'zbek tiliga o'tkazish kerak.

Quyidagi reja asosida xatoliklarni tuzataman va tizimni sozlayman:

1. **Skriptlarni O'zbek tiliga tarjima qilish**:

   * `scripts/alert.js`: Barcha xabarnomalar, ogohlantirishlar va maydon nomlarini (Service, Message, Time va h.k.) o'zbek tiliga o'giraman.

   * `scripts/health-check.js`: Server holatini tekshirish xabarlarini va xatoliklar haqidagi ma'lumotlarni o'zbek tiliga o'tkazaman.

2. **Telegram Botni sozlash (`apps/telegram-service`)**:

   * Botning asosiy tilini (default language) **O'zbek tili** (`uz`) qilib belgilayman.

   * Bot menyulari va javoblarini tekshirib, o'zbek tili qo'llab-quvvatlanishini ta'minlayman.

3. **Monitoringni doimiy ishlashini ta'minlash**:

   * `package.json` faylida monitoringni ishga tushirish uchun maxsus buyruq qo'shaman.

   * Loyiha ishga tushganda (`start` komandasi) monitoring tizimi ham avtomatik ishlashi uchun sozlamalarni yangilayman (yoki alohida `worker` sifatida ishlash bo'yicha ko'rsatma beraman).

Ushbu o'zgarishlar natijasida:

* Telegram bot va barcha tizim xabarlari to'liq o'zbek tilida bo'ladi.

* Monitoring tizimi doimiy ishlab turadi va xatolik bo'lganda darhol xabar beradi.

