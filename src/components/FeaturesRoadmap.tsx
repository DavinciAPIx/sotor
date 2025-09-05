import React from 'react';
import {
  FileText,
  Edit,
  Download,
  Pencil,
  BookOpen,
  Settings2,
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';

const icons = [FileText, Edit, Download, Pencil, BookOpen, Settings2];
const colors = Array(6).fill('bg-green-500 ring-green-200');

const FeatureStep = ({ title, index, isInView, isLast }) => {
  const Icon = icons[index % icons.length];
  const color = colors[index % colors.length];

  return (
    <div
      className={`relative flex items-start gap-6 mb-10 transition-all duration-700 ease-out transform ${
        isInView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="relative flex flex-col items-center z-10">
        <div
          className={`w-10 h-10 rounded-full shadow-md ring-4 ${color} flex items-center justify-center transition-transform duration-300 hover:scale-110`}
        >
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-bahthali-100 mt-1"></div>
        )}
      </div>
      <div className="pt-1 z-10">
        <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">
          {title}
        </h3>
      </div>
    </div>
  );
};

const FeaturesRoadmap = () => {
  const [ref, inView] = useInView({ triggerOnce: false, threshold: 0.1 });

  const features = [
    'قوالب بحوث أكاديمية معتمدة وجاهزة للتعديل',
    'تحرير مباشر عبر Google Docs لسهولة الوصول والمشاركة',
    'تصدير احترافي بصيغة PDF أو Word بجودة عالية',
    'إمكانية التعديل على البحث بشكل كامل',
    'يعمل وفق منهجية البحث العلمي للجامعات السعودية',
    'إمكانية تخصيص العنوان والمحتوى ليناسب تخصصك الجامعي',
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-bahthali-50 to-white relative overflow-hidden">
      {/* خلفية حداثية متحركة */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Blobs متحركة */}
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-bahthali-400 opacity-30 rounded-full filter blur-3xl animate-blob animation-delay-0"></div>
        <div className="absolute top-1/2 left-[60%] w-[300px] h-[300px] bg-bahthali-400 opacity-30 rounded-full filter blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-[50%] left-[10%] w-[300px] h-[300px] bg-bahthali-400 opacity-30 rounded-full filter blur-2xl animate-blob animation-delay-4000"></div>
      </div>

      {/* صورة السفينة وسط المؤثرات */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-20 pointer-events-none">
        <img
          src="https://whwhhehypiuryfssbrqo.supabase.co/storage/v1/object/sign/backgroundcap/DeWatermark.ai_1751316259412-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lODc1NDg2Ny03ZGQ4LTQxNDItOGEyMC01ZGVhNDM3ZWI2MzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kY2FwL0RlV2F0ZXJtYXJrLmFpXzE3NTEzMTYyNTk0MTItcmVtb3ZlYmctcHJldmlldy5wbmciLCJpYXQiOjE3NTEzMTY2MTUsImV4cCI6MzMyODczMTY2MTV9.1ZQavKj43Vg9O2UH47DFC7GwEBkF31u6JxVaB4WrQvk"
          alt="سفينة الفضاء"
          className="w-[450px] md:w-[550px] lg:w-[650px] animate-float"
        />
      </div>

      {/* محتوى النص */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-12">
              ابدأ البحث مع
            </h2>
          </div>
          <div ref={ref} className="relative pl-6">
            {features.map((feature, index) => (
              <FeatureStep
                key={index}
                title={feature}
                index={index}
                isInView={inView}
                isLast={index === features.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesRoadmap;
