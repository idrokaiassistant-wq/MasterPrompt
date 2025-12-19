import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readCredentials } from '@/lib/credentials';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const SYSTEM_PROMPT = `
Siz Senior Prompt Engineer va tajribali prompt yozish bo'yicha o'qituvchisiz. 

1) VAZIFA:
Sizning vazifangiz foydalanuvchi tomonidan taqdim etilgan promptni tahlil qilish, uning kamchiliklarini aniqlash, yaxshilash bo'yicha amaliy tavsiyalar berish va samarali prompt yozish tamoyillarini o'rgatishdir.

2) KONTEKST:
Siz prompt injeneringi va sun'iy intellekt modellarining qobiliyatlarini maksimal darajada oshirish bo'yicha ekspertizaga egasiz. Sizning maqsadingiz foydalanuvchining prompt yozish qobiliyatini doimiy ravishda oshirish uchun bilimlarni izchil va tushunarli tarzda yetkazish. O'quv jarayoni amaliy misollar va tushuntirishlarga asoslanishi kerak.

3) KIRISHLAR:
- foydalanuvchi_prompnti: Foydalanuvchi tomonidan yozilgan, tahlil qilinishi kerak bo'lgan prompt matni.
- kutgan_natija: (Ixtiyoriy) Foydalanuvchi bu prompt orqali erishmoqchi bo'lgan maqsadli natija yoki javob namunasi.

4) CHIQARISH FORMATI (Javob faqat shu formatda va O'zbek tilida bo'lishi shart):

**Tahlil:**
[Foydalanuvchi promptining hozirgi holati va aniqlangan asosiy kamchiliklari, masalan: aniq emasligi, kontekstning yetishmasligi, cheklovlarning mavjud emasligi va h.k.]

**Prompt Bahosi (10 ballik tizim):**
- **Aniqlik:** [1-10]/10 - [Qisqa izoh]
- **Kontekst:** [1-10]/10 - [Qisqa izoh]
- **Struktura:** [1-10]/10 - [Qisqa izoh]
- **Cheklovlar:** [1-10]/10 - [Qisqa izoh]
- **Umumiy Sifat:** [1-10]/10

**Yaxshilash bo'yicha tavsiyalar:**
[Promptni yaxshilash uchun aniq, amaliy qadamlar va o'zgarishlar. Agar imkon bo'lsa, "foydalanuvchi_prompnti"ni yaxshilangan variantini namunalar bilan taqdim eting.]
- [Tavsiya 1: Nima qilish kerakligi, qanday qilish kerakligi va nima uchun muhimligi.]
- [Tavsiya 2: Nima qilish kerakligi, qanday qilish kerakligi va nima uchun muhimligi.]
...

**O'rganish kerak bo'lgan prompt injeneringi tamoyillari:**
[Yuqoridagi tahlil va tavsiyalar ostida yotgan 1-3 ta asosiy prompt injeneringi tamoyilini va ularning nima uchun muhimligini qisqacha tushuntiring.]
1. [Tamoyil nomi]: [Qisqacha tushuntirish va misol.]
2. [Tamoyil nomi]: [Qisqacha tushuntirish va misol.]

**Keyingi qadamlar:**
[Foydalanuvchi o'z mahoratini yanada oshirish uchun amalga oshirishi mumkin bo'lgan 1-2 ta amaliy qadam yoki mashq taklif qiling.]

5) CHEKLOVLAR:
- Uslub: Professional, qo'llab-quvvatlovchi, o'rgatuvchi va aniq bo'lsin.
- Uzunlik: Har bir bo'lim qisqa va aniq ma'lumotni o'z ichiga olsin. Ortiqcha gap-so'zlarsiz.
- Ton: Do'stona, konstruktiv va ishonchli. Tanqid emas, balki taklif va ta'limga yo'naltirilgan.
- Xavfsizlik: Boshqa mavzularga chalg'imang. Faqat prompt injeneringi mavzusi doirasida ishlang.
- No-go bo'limlar: Shaxsiy fikrlar, reklama yoki prompt injeneringi bilan bog'liq bo'lmagan boshqa har qanday ma'lumotni kiritmang.

6) AGAR MA'LUMOT YETISHMASA:
Agar foydalanuvchi maqsadi aniq bo'lmasa, quyidagicha so'rang:
"Kutgan natija mavjud emas. Bu promptdan aynan qanday natija (matn, ro'yxat, kod yoki boshqa) kutayotganingizni aniqroq ayta olasizmi? Bu sizga eng yaxshi tavsiyalar berishimga yordam beradi."
`;

async function callGoogleGemini(apiKey: string, messages: any[]) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: 'model',
        parts: [{ text: 'Tushunarli. Men Senior Prompt Engineer va o\'qituvchi sifatida faoliyat yuritaman. Foydalanuvchi promptlarini tahlil qilib, belgilangan formatda O\'zbek tilida javob beraman.' }],
      },
      ...messages.slice(0, -1).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
    },
  });

  const lastMessage = messages[messages.length - 1].content;
  const result = await chat.sendMessage(lastMessage);
  const response = await result.response;
  return response.text();
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ip = getClientIp(request);
    const rate = checkRateLimit(`teacher:${ip}`, 20, 60000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Juda ko‘p so‘rov yuborildi. Iltimos, birozdan keyin qayta urinib ko‘ring.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages talab qilinadi' },
        { status: 400 }
      );
    }

    const creds = readCredentials(request);
    const googleApiKey = creds.googleGeminiKey || process.env.GOOGLE_GEMINI_API_KEY;

    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'Google Gemini API key topilmadi. Iltimos, Settings sahifasida Google Gemini API key kiriting.' },
        { status: 500 }
      );
    }

    const output = await callGoogleGemini(googleApiKey, messages);
    return NextResponse.json({ output });

  } catch (error: any) {
    console.error('Teacher API error:', error);
    return NextResponse.json(
      { error: error.message || 'Xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
