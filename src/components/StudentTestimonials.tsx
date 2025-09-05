
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { User, MessageSquare, Star, Quote } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  university: string;
  specialty: string;
  avatar: string;
  comment: string;
  rating: number;
}

const StudentTestimonials = () => {
  const studentImages = [
    "https://whwhhehypiuryfssbrqo.supabase.co/storage/v1/object/sign/backgroundcap/1747642589623.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lODc1NDg2Ny03ZGQ4LTQxNDItOGEyMC01ZGVhNDM3ZWI2MzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kY2FwLzE3NDc2NDI1ODk2MjMuanBnIiwiaWF0IjoxNzUxNTQ3NjY5LCJleHAiOjQ5MDUxNDc2Njl9.ulmIl00IJw2mUVrm6KRiQC7_SmvlJA6cOyNQ0h54V1Q",
    "https://izbnugizraqvrvlndzye.supabase.co/storage/v1/object/sign/baht/nawal.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YTZkYTdmMi0xNGFhLTQ4M2ItYjdkOS1iNWVkNWY2Mjc0NDYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWh0L25hd2FsLmpwZyIsImlhdCI6MTc1MDI3OTYzMCwiZXhwIjoxNzgxODE1NjMwfQ.oy3kcegS0gU84eJPPYd8wtmJtRgUCC6BEKgf2sRG6fI",
    "https://whwhhehypiuryfssbrqo.supabase.co/storage/v1/object/sign/backgroundcap/2222.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lODc1NDg2Ny03ZGQ4LTQxNDItOGEyMC01ZGVhNDM3ZWI2MzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kY2FwLzIyMjIuanBnIiwiaWF0IjoxNzUxNTQ4MjUxLCJleHAiOjQ5MDUxNDgyNTF9.nIsNo1PSW8W_UaO_2RuxzlLbABw28B-5xTW1iPQOt64",
    "https://izbnugizraqvrvlndzye.supabase.co/storage/v1/object/sign/baht/selsa.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YTZkYTdmMi0xNGFhLTQ4M2ItYjdkOS1iNWVkNWY2Mjc0NDYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWh0L3NlbHNhLmpwZyIsImlhdCI6MTc1MDI4MTE1MCwiZXhwIjoxNzgxODE3MTUwfQ.n-Y4gAXcqjqDQ6QRIyAICQLsq3faQEoJtbMal7aBwvE",
    "https://whwhhehypiuryfssbrqo.supabase.co/storage/v1/object/sign/backgroundcap/Screenshot_9.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lODc1NDg2Ny03ZGQ4LTQxNDItOGEyMC01ZGVhNDM3ZWI2MzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kY2FwL1NjcmVlbnNob3RfOS5wbmciLCJpYXQiOjE3NTE1NDg4OTgsImV4cCI6NDkwNTE0ODg5OH0.3jyJTJtLHE7O69ajvXZvx7y5GTyjK1szkroXOlDz58I",
    "https://whwhhehypiuryfssbrqo.supabase.co/storage/v1/object/sign/backgroundcap/Screenshot_8.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lODc1NDg2Ny03ZGQ4LTQxNDItOGEyMC01ZGVhNDM3ZWI2MzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kY2FwL1NjcmVlbnNob3RfOC5wbmciLCJpYXQiOjE3NTE1NDg3OTAsImV4cCI6NDkwNTE0ODc5MH0.ihA9Y4SW5rQVPvrE06MHT2sU5POGS8mCd8JtGCxHBFY",
    "https://whwhhehypiuryfssbrqo.supabase.co/storage/v1/object/sign/backgroundcap/Screenshot_7.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lODc1NDg2Ny03ZGQ4LTQxNDItOGEyMC01ZGVhNDM3ZWI2MzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kY2FwL1NjcmVlbnNob3RfNy5wbmciLCJpYXQiOjE3NTE1NDg2NjgsImV4cCI6NDkwNTE0ODY2OH0.uDINk_9UF_f8HG5_QWJwo16aFi04XnTWPw09d0DNFA0",
    "https://whwhhehypiuryfssbrqo.supabase.co/storage/v1/object/sign/backgroundcap/33333.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lODc1NDg2Ny03ZGQ4LTQxNDItOGEyMC01ZGVhNDM3ZWI2MzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kY2FwLzMzMzMzLnBuZyIsImlhdCI6MTc1MTU0ODM3MSwiZXhwIjo0OTA1MTQ4MzcxfQ.AXaQbTWtWVdVirqmNoYvkEA6Fgn_ShzNuvOCW6umR6w",

  ];

const testimonials: Testimonial[] = [
{
    id: 1,
    name: "أحسن شريف",
    university: "جامعة نجران",
    specialty: "ادارة أعمال",
    avatar: studentImages[0],
    comment: "المنصة حيل مفيدة، خاصة للطلاب اللي لسه بادين في مشاريع التخرج. سهّلت عليّ ترتيب البحث وتنسيقه من البداية للآخر.",
    rating: 5
  },
  {
    id: 2,
    name: "نورة العتيبي",
    university: "جامعة الأميرة نورة",
    specialty: "اللغة العربية",
    avatar: studentImages[1],
    comment: "الواجهة بسيطة وسهلة مرة. كتبت العنوان وطلعت لي خطة بحث رهيبة. بس ياليت أقدر أحدد عدد الصفحات قبل ما أبدأ.",
    rating: 4
  },
  {
    id: 3,
    name: "علي سالم",
    university: "جامعة الإمام محمد بن سعود",
    specialty: "العلوم الشرعية",
    avatar: studentImages[2],
    comment: "استخدمت المنصة أكثر من مرة وساعدتني في كتابة المباحث بسرعة. بس التنسيق يبيله شوية تحسين خاصة في ترتيب الفقرات.",
    rating: 4
  },
  {
    id: 4,
    name: "رغد الزهراني",
    university: "جامعة جدة",
    specialty: "علوم الحاسب",
    avatar: studentImages[3],
    comment: "عجبني مرة كيف المنصة تبني محتوى متكامل من مجرد عنوان. فكرة حلوة وتناسب الطلاب اللي يحتاجون مساعدة أولية.",
    rating: 5
  },
  {
    id: 5,
    name: "سلمان الشمري",
    university: "جامعة الملك عبدالعزيز",
    specialty: "إدارة الأعمال",
    avatar: studentImages[4],
    comment: "جربت أكثر من أداة بحث، بس هذي أحسنهم. تنسق الغلاف تلقائيًا وتكتب المقدمات بشكل احترافي. بس محتاج تحكم أكبر في عدد الصفحات.",
    rating: 4
  },
  {
    id: 6,
    name: "محمد الغامدي",
    university: "جامعة طيبة",
    specialty: "الحقوق",
    avatar: studentImages[5],
    comment: "الفكرة حلوة، بس أخاف الطلاب يعتمدون عليها وايد ويتركون الجهد الشخصي. مفيدة كأداة مساعدة، بس لازم توازن.",
    rating: 3
  },
  {
    id: 7,
    name: "جواهر المطيري",
    university: "جامعة الملك فيصل",
    specialty: "التصميم الجرافيكي",
    avatar: studentImages[6],
    comment: "حلوة حيل! تنسق الغلاف وتعطيك ترتيب منطقي للبحث. ياليت يضيفون قوالب متعددة تناسب تخصصي أكثر.",
    rating: 5
  },
  {
    id: 8,
    name: "السيد أشرف",
    university: "جامعة القصيم",
    specialty: "العلوم السياسية",
    avatar: studentImages[7],
    comment: "الذكاء الاصطناعي المستخدم في المنصة ذكي وايد. يعطيني محتوى مرتب ومتكامل. بس ينقصه شوية خيارات تخصيص.",
    rating: 4
  }
];


  // مكون لعرض التقييم بالنجوم
  const RatingStars = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center gap-1 text-bahthali-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'fill-bahthali-500' : ''}`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 bg-gradient-to-b from-bahthali-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">تجارب الطلبة</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="group h-full"
            >
              <Card className="relative h-full overflow-hidden bg-white border border-bahthali-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="absolute top-0 right-0 w-28 h-28 bg-bahthali-100 rounded-full -translate-y-14 -translate-x-14 z-0"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-bahthali-50 rounded-full translate-y-10 translate-x-10 z-0"></div>
                
                <Quote className="absolute top-4 right-4 h-6 w-6 text-bahthali-300 z-10" />
                
                <CardHeader className="relative z-10 flex flex-row gap-4 items-center">
                  <Avatar className="h-16 w-16 border-2 border-bahthali-200 ring-2 ring-white shadow-md">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="bg-bahthali-200 text-bahthali-700 flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold text-bahthali-800">{testimonial.name}</h3>
                    <p className="text-sm text-bahthali-600">{testimonial.university}</p>
                    <p className="text-xs text-bahthali-500">{testimonial.specialty}</p>
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-10 flex-1">
                  <p className="text-gray-700 leading-relaxed text-sm">{testimonial.comment}</p>
                </CardContent>
                
                <CardFooter className="relative z-10 pt-4 border-t border-bahthali-50">
                  <RatingStars rating={testimonial.rating} />
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudentTestimonials;
