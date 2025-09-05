import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { User, GraduationCap, Quote } from 'lucide-react';

const founders = [
  {
    id: 1,
    name: 'بحثي',
    title: 'نحو بحث جامعي أفضل',
    imageUrl:   'https://izbnugizraqvrvlndzye.supabase.co/storage/v1/object/sign/baht/file_00000000a52861f5952a58d615581974.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YTZkYTdmMi0xNGFhLTQ4M2ItYjdkOS1iNWVkNWY2Mjc0NDYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWh0L2ZpbGVfMDAwMDAwMDBhNTI4NjFmNTk1MmE1OGQ2MTU1ODE5NzQucG5nIiwiaWF0IjoxNzQ5NzI2OTQxLCJleHAiOjE3ODEyNjI5NDF9.TJvfxpsFzgSb9IMnd0h94C8o8dfgY-LSfYTUxGTWkLg',
    story: 
      'انبثقت فكرة المنصة من حاجة الطلبة لإعداد بحث جامعي بكفاءة واحترافية، مع توفير الوقت والجهد، خصوصاً في إنجاز الصفحات الأساسية مثل الغلاف وخطة البحث. في بداياتها، كانت المنصة موجّهة خصيصاً لطلبة جامعة واحدة، لكن سرعان ما تطورت الفكرة لتشمل مختلف الجامعات والتخصصات، بهدف تعميم الفائدة على أكبر عدد ممكن من الطلبة. تتمثل رؤية المنصة في دعم الطالب/ـة ومرافقته خلال مراحل إعداد بحثه الجامعي، دون أن تقوم بالعمل نيابةً عنه، إيمانًا منا بأن الجهد الأكاديمي والعمل الذاتي عنصران أساسيان في بناء المعرفة والتفوّق.'
  },
];

const FounderCard = ({ founder }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="relative max-w-md w-full bg-white border border-bahthali-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden rounded-2xl">
      {/* زخارف ناعمة */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-bahthali-50 rounded-full -translate-y-10 -translate-x-10 z-0" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-bahthali-100 rounded-full translate-y-12 translate-x-6 z-0" />
      <Quote className="absolute top-5 right-5 h-6 w-6 text-bahthali-300 z-10" />

      {/* العنوان والصورة */}
      <CardHeader className="relative z-10 flex flex-col items-center pt-8 pb-4">
        <div className="relative mb-3">
          <Avatar className="h-24 w-24 border-4 border-white ring-1 ring-bahthali-200 shadow-md">
            <AvatarImage src={founder.imageUrl} alt={founder.name} />
            <AvatarFallback className="bg-bahthali-300 text-white text-xl flex items-center justify-center">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-bahthali-800">{founder.name}</h3>
          <div className="flex items-center justify-center text-bahthali-600 mt-1 text-sm">
            <GraduationCap className="h-4 w-4 ml-1" />
            <span>{founder.title}</span>
          </div>
        </div>
      </CardHeader>

      {/* القصة */}
      <CardContent className="relative z-10 px-6 pb-4">
        <div className="bg-bahthali-50 border border-bahthali-100 rounded-md p-4 text-bahthali-800 text-sm leading-relaxed">
          <p className={expanded ? '' : 'line-clamp-4'}>{founder.story}</p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-bahthali-600 hover:text-bahthali-800 text-xs underline focus:outline-none"
          >
            {expanded ? 'إظهار أقل' : 'قراءة المزيد'}
          </button>
        </div>
      </CardContent>

      {/* الرؤية */}
      <CardFooter className="relative z-10 flex justify-center pb-6 pt-2">
        <div className="inline-flex items-center px-3 py-1.5 bg-bahthali-100 text-bahthali-800 rounded-full text-xs font-medium hover:bg-bahthali-200 transition-colors">
          رؤيتنا: تسهيل إعداد البحث للطلاب الجزائريين
        </div>
      </CardFooter>
    </Card>
  );
};

const FoundersSection = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-bahthali-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">فكرة المنصة</h2>
        <div className="flex justify-center">
          {founders.map((founder) => (
            <FounderCard key={founder.id} founder={founder} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FoundersSection;
