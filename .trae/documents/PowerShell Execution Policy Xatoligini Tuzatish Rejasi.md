Ushbu xatolik PowerShell xavfsizlik siyosati (**Execution Policy**) tufayli yuz bermoqda. Tizim sukut bo'yicha skriptlarni (shu jumladan `pnpm`) ishga tushirishni bloklagan.

Quyida muammoni hal qilish rejasi keltirilgan:

### 1. Xatolik Tahlili
*   **Sabab:** PowerShell-da `ExecutionPolicy` sukut bo'yicha `Restricted` (Cheklangan) holatida. Bu tashqi skriptlarni (`.ps1` fayllarni) ishga tushirishga ruxsat bermaydi.
*   **Natija:** `pnpm` buyrug'i `pnpm.ps1` skriptini chaqirganligi sababli bloklanmoqda.

### 2. Yechim Rejasi
Biz joriy terminal sessiyasi uchun xavfsizlik siyosatini vaqtincha o'zgartiramiz. Bu eng xavfsiz va tezkor yechim.

1.  **Xavfsizlik siyosatini o'zgartirish:**
    *   `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force` buyrug'ini ishga tushiramiz.
    *   Bu faqat **joriy oyna** uchun skriptlarga ruxsat beradi.

2.  **Tekshirish:**
    *   `pnpm --version` buyrug'i orqali `pnpm` ishlayotganini tekshiramiz.

3.  **Dasturni ishga tushirish:**
    *   `pnpm dev` buyrug'ini qayta ishga tushiramiz.

Ushbu rejani tasdiqlasangiz, men amallarni bajaraman.