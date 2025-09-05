import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ArrowDown, FileText } from 'lucide-react';
import { useResearchCost } from '@/hooks/useResearchCost';

const HeroSection = () => {
  const { researchCost } = useResearchCost();
  const [imageVisible, setImageVisible] = useState(false);

  useEffect(() => {
    setImageVisible(true); // بدء الحركة
  }, []);

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToResearch = () => {
    const researchForm = document.querySelector('.research-title-input');
    if (researchForm) {
      researchForm.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-bahthali-100 to-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* العنوان */}         
<h1 className="text-4xl md:text-5xl font-bold text-bahthali-900 mb-6 text-center animate-fade-in">
  <span className="text-bahthali-500 inline-block whitespace-nowrap tracking-tight">سطـــــــــــو</span>
  <span className="text-bahthali-700 inline-block whitespace-nowrap tracking-tight animate-bounce">ر</span>
  <span className="block mt-3 text-gray-700 text-lg md:text-xl font-medium">
    أول منصة لإنجاز
    <span className="relative inline-block mx-1">
      <span className="relative z-10 font-bold">البحوث الجامعية</span>
      <span className="absolute left-0 -bottom-0.5 w-full h-1 bg-bahthali-500 rounded-full"></span>
    </span>
    في العـــــــــــــالم
  </span>
</h1>

  
          
 <p
  style={{ animationDelay: '0.3s' }}
  className="text-gray-700 mb-8 animate-fade-in text-xl font-medium leading-relaxed max-w-3xl mx-auto bg-bahthali-50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-bahthali-200"
>
  {researchCost === 0 
        ? "سطـــور، منصة ذكية موجّهة للطلاب الجامعيين، تسهّل عليك كل مراحل كتابة البحث، من إعداد صفحة الغلاف، مرورًا بخطة البحث، وصولًا إلى كتابة المحتوى — بطرق بسيطة و مبتكرة"
    : "سطـــور، منصة ذكية موجّهة للطلاب الجامعيين، تسهّل عليك كل مراحل كتابة البحث، من إعداد صفحة الغلاف، مرورًا بخطة البحث، وصولًا إلى كتابة المحتوى — بطرق بسيطة و مبتكرة"
  }
</p>

          {/* ✅ الصورة هنا - بين النص والزر */}
<img
  src="https://whwhhehypiuryfssbrqo.supabase.co/storage/v1/object/sign/backgroundcap/GREENSLIDE.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lODc1NDg2Ny03ZGQ4LTQxNDItOGEyMC01ZGVhNDM3ZWI2MzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kY2FwL0dSRUVOU0xJREUucG5nIiwiaWF0IjoxNzUxNTY2ODY1LCJleHAiOjQ5MDUxNjY4NjV9.dMzlrMZ2rx3u3krF1iyelXA2YXt2FG-q1sLNZJG1wXs"
  alt="Slider"
  style={{
    width: "100%",
    maxWidth: "680px", // كبرنا الحجم قليلاً
    height: "auto",
    borderRadius: "12px",
    margin: "0 auto 2rem",
    opacity: imageVisible ? 1 : 0,
    transform: imageVisible ? "translateY(0)" : "translateY(40px)",
    transition: "all 0.9s ease-out",
    imageRendering: "auto"
  }}
/>


          {/* الزر */}
          <div
            className="flex flex-wrap justify-center gap-3 animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            {researchCost === 0 ? (
              <Button 
                className="bg-bahthali-500 hover:bg-bahthali-600" 
                size="lg" 
                onClick={scrollToResearch}
              >
                <FileText className="mr-2 h-5 w-5" />
                ابدأ بإنشاء أبحاثك مجاناً
              </Button>
            ) : (
              <Button 
                className="bg-bahthali-500 hover:bg-bahthali-600" 
                size="lg" 
                onClick={scrollToPricing}
              >
                <ArrowDown className="mr-2 h-5 w-5" />
                عروضنا وأسعارنا
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Scroll indicator */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 animate-bounce z-50">
        <div className="w-6 h-10 border-2 border-bahthali-500 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-bahthali-500 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
};

export default HeroSection;