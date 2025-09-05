// ملف لتعريف الكلمات المسيئة والتحقق منها

export const BAD_WORDS = {
  english: [
    "fuck", "shit", "bitch", "cunt", "dick", "pussy", "asshole", "slut", "whore",
    "wanker", "twat", "cock", "cum", "clit", "jerk", "jizz", "jugs", "prick", "suck", "turd",
    "nigger", "kike", "spic", "chink", "gook", "faggot", "dyke", "queer", "retard", "coon",
    "cracker", "wetback", "beaner", "abo", "paki", "heeb", "homo", "honkey", "gringo",
    "sex", "porn", "xxx", "nude", "naked", "prostitute", "escort", "horny", "orgasm"
  ],
  arabic: [
    "كس أمك", "قحبة", "شرموطة", "معرص", "خول", "زبر", "طيز", "عيرة", "زق", "كسمك",
    "حمار", "كلب", "بهيمة", "غبي", "أهبل", "سافل", "وسخ", "حقير", "لعين", "ملعون",
    "تبًا لك", "اذهب إلى الجحيم", "يلعن", "يا ابن", "يا ولاد", "يا كلب", "يا حمار", "يا خول", "يا معرص",
    "جنس", "سكس", "عاهرة", "دعارة", "فاحش", "إباحي", "عاري", "عورة", "شهوة"
  ],
  algerian_dialect: [
    "نيك", "نيكك", "زبي", "زوبري", "طيزي", "كسا", "كساختي", "عيري", "زبر", "كس", "قحب", "شرموط", "معرص",
    "خول", "عاهرة", "دعارة", "زامل", "مفحشة", "مشحم", "مكوى", "جنس", "سكس", "شهوة", "حلمة", "نكح",
    "حمار", "كلب", "بهيم", "بغل", "عرباجي", "غبي", "أهبل", "جاهل", "حقير", "وسخ", "سافل", "خنزير", "كلبة",
    "ينعل", "ملعون", "لعين", "يا ابن", "يا ولد", "يا خول", "يا معرص", "يا زامل", "يا حمار", "يا كلب",
    "نيك أمك", "نيك ختك", "نيك باباك", "كس أمك", "كس ختك", "كس باباك",
    "قحبة", "قحاب", "نيكة", "نيكات", "بزولة", "طيز", "عرة", "بزول", "لحس","مفعول", "لوطي",
    "8===", "=))", "69", "س.ج", "م.ن", "في الفراش", "بالسرير", "الفرج", "أوضاع جنسية"
  ]
};

export const IRRELEVANT_WORDS = [
  "fortnite", "pubg", "fifa", "minecraft", "roblox", "among us", "valorant",
  "tiktok", "instagram", "snapchat", "facebook", "youtube", "netflix",
  "buy", "sell", "price", "discount", "shopping", "store", "market",
  "فيلم", "مسلسل", "تحميل", "كراك", "تورنت", "اغنية", "موسيقى", "يوتيوب", "انستقرام"
];

const ALL_BAD_WORDS = [
  ...BAD_WORDS.english,
  ...BAD_WORDS.arabic,
  ...BAD_WORDS.algerian_dialect
].map(word => word.toLowerCase());

export const ALL_IRRELEVANT_WORDS = IRRELEVANT_WORDS.map(word => word.toLowerCase());

// ✅ التحقق من وجود كلمة مسيئة بأي لغة
export const containsAnyBadWord = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return ALL_BAD_WORDS.some(word => lowerText.includes(word));
};

// ✅ التحقق من محتوى غير أكاديمي
export const containsIrrelevantContent = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return ALL_IRRELEVANT_WORDS.some(word => lowerText.includes(word));
};

// ✅ كشف الكتابة العشوائية
export const isGibberish = (text: string): boolean => {
  const words = text.trim().split(/\s+/);
  let suspiciousCount = 0;

  for (const word of words) {
    const isLatin = /^[a-zA-Z]+$/.test(word);
    const isArabic = /^[\u0600-\u06FF]+$/.test(word);
    const isNumeric = /^[0-9]+$/.test(word);

    if (
      (isLatin && word.length > 6 && !/[aeiou]/i.test(word)) ||
      (isArabic && word.length > 6 && !/[اأإآوىيء]/.test(word)) ||
      (!isLatin && !isArabic && !isNumeric)
    ) {
      suspiciousCount++;
    }
  }

  const ratio = suspiciousCount / words.length;
  return ratio > 0.5;
};

// ✅ التحقق من عنوان البحث
export const validateResearchTitle = (title: string): { 
  isValid: boolean; 
  strength: 'weak' | 'medium' | 'strong'; 
  message: string;
  wordCount: number;
} => {
  if (!title.trim()) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'يرجى إدخال عنوان البحث',
      wordCount: 0
    };
  }

  const words = title.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const lowerTitle = title.toLowerCase();

  if (containsAnyBadWord(lowerTitle)) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'العنوان يحتوي على كلمات غير لائقة',
      wordCount
    };
  }

  if (containsIrrelevantContent(lowerTitle)) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'العنوان يحتوي على محتوى غير أكاديمي',
      wordCount
    };
  }

  if (isGibberish(title)) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'العنوان يبدو عشوائيًا أو غير مفهوم',
      wordCount
    };
  }

  if (title.trim().length <= 1 || /^[0-9]+$/.test(title.trim())) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'العنوان غير صالح - قصير جدًا أو رقم فقط',
      wordCount
    };
  }

  if (/^(.)\1{4,}$/.test(lowerTitle.replace(/\s+/g, ''))) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'العنوان يحتوي على تكرار غير منطقي',
      wordCount
    };
  }

  const validWords = words.filter(word => /[\u0600-\u06FFa-zA-Z]/.test(word) && word.length > 1);
  if (validWords.length === 0) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'العنوان غير مفهوم أو غير صالح',
      wordCount
    };
  }

  if (wordCount === 1) {
    return {
      isValid: true,
      strength: 'weak',
      message: 'عنوان ضعيف - يُفضل استخدام أكثر من كلمة واحدة',
      wordCount
    };
  }

  if (wordCount >= 2 && wordCount <= 4) {
    return {
      isValid: true,
      strength: 'medium',
      message: 'عنوان جيد',
      wordCount
    };
  }

  return {
    isValid: true,
    strength: 'strong',
    message: 'عنوان ممتاز - واضح ومفصل',
    wordCount
  };
};

// ✅ التحقق من الحقول الأخرى (مثل اسم الطالب، الملاحظات...)
export const validateFieldContent = (content: string, fieldName: string): {
  isValid: boolean;
  message: string;
} => {
  if (!content.trim()) {
    return {
      isValid: false,
      message: `يرجى إدخال ${fieldName}`
    };
  }

  if (containsAnyBadWord(content)) {
    return {
      isValid: false,
      message: 'يحتوي على كلمات غير لائقة'
    };
  }

  if (containsIrrelevantContent(content)) {
    return {
      isValid: false,
      message: 'يحتوي على محتوى غير أكاديمي'
    };
  }

  return {
    isValid: true,
    message: 'تم'
  };
};
