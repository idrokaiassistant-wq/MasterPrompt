Men botning ishlamay qolish sababini tahlil qildim. Katta ehtimol bilan muammo **modullarni yuklash ketma-ketligida** bo'lgan.

**Muammo:** `ConfigService` moduli (`utils` paketida) ilova ishga tushishi bilanoq yuklanadi va o'sha paytdagi `process.env` holatini saqlab oladi. Ammo `.env` faylidagi o'zgaruvchilar `dotenv` orqali biroz keyinroq yuklanadi. Natijada `ConfigService` bo'sh konfiguratsiyani ko'radi va xatolik berib to'xtaydi.

**Yechim rejasi:**

1.  **`ConfigService` ni yangilash:** `packages/utils` ichidagi konfiguratsiya xizmatini shunday o'zgartiramanki, u `process.env` ni xotiraga saqlab olmasdan, har safar murojaat qilinganda to'g'ridan-to'g'ri o'qiydigan bo'ladi. Bu har doim eng so'nggi qiymatlarni olishni kafolatlaydi.
2.  **Qayta qurish (Build):** `utils` va `telegram-service` paketlarini qaytadan kompilyatsiya qilaman.
3.  **Tekshirish:** Botni qayta ishga tushirib, loglarni tekshiraman va uning to'g'ri ishlayotganligiga ishonch hosil qilaman.

Ushbu o'zgarishlar botning barqaror ishlashini ta'minlaydi. Tasdiqlasangiz, darhol tuzatishni boshlayman.
