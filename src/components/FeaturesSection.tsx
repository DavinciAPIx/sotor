import React from 'react';
import { useInView } from 'react-intersection-observer';

const FeaturesSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.2,
  });

  const features = [
    {
      title: 'بحث سريع',
      description:
        'سرعة استثنائية في إعداد الصفحات الأساسية للبحث من الغلاف إلى كتابة المحتوى',
      img: 'https://whwhhehypiuryfssbrqo.supabase.co/storage/v1/object/sign/backgroundcap/CLOCK.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lODc1NDg2Ny03ZGQ4LTQxNDItOGEyMC01ZGVhNDM3ZWI2MzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kY2FwL0NMT0NLLnBuZyIsImlhdCI6MTc1MTU2ODk2OSwiZXhwIjo0OTA1MTY4OTY5fQ.uO4EFYD1jndH470JDc3X0ZWgT-wVES5SSe6430IH-oU',
	  delay: '100ms',
    },
    {
      title: 'دعم جميع الجامعات الحكومية السعودية',
      description: 'قائمة ضخمة تشمل 29 جامعة حكومية مدعومة بمنهجبة البحث العلمي المعتمد في المملكة',
      img: 'https://whwhhehypiuryfssbrqo.supabase.co/storage/v1/object/sign/backgroundcap/HAT.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lODc1NDg2Ny03ZGQ4LTQxNDItOGEyMC01ZGVhNDM3ZWI2MzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kY2FwL0hBVC5wbmciLCJpYXQiOjE3NTE1NjkwMzAsImV4cCI6NDkwNTE2OTAzMH0.K_rIGDI1foQXm0VPIWCs7VwTqkyE9rwKpRftl8EWHUc',
	  delay: '300ms',
    },
    {
      title: 'متكامل مع Google Docs',
      description:
        'يمكنك من تعديل البحث بالكامل وتنسيقه بالطريقة الصحيحة وتغيير القوالب وتنزيله بشكل صحيح',
      img: 'https://whwhhehypiuryfssbrqo.supabase.co/storage/v1/object/sign/backgroundcap/DOC.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lODc1NDg2Ny03ZGQ4LTQxNDItOGEyMC01ZGVhNDM3ZWI2MzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kY2FwL0RPQy5wbmciLCJpYXQiOjE3NTE1NjkwNzEsImV4cCI6NDkwNTE2OTA3MX0.0Hr3f_zgpHaJljvdtwj9hU1JMwW5y7tX4DqaJsL7U4U',
	  delay: '500ms',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-bahthali-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          مميزات المنصة
        </h2>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden bg-white min-h-[300px] border border-bahthali-200 shadow-lg hover:shadow-xl transition-all duration-500 transform flex flex-col text-center p-8 rounded-lg ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: feature.delay }}
            >
              {/* فقاعات الخلفية */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute w-32 h-32 bg-green-300 opacity-30 rounded-full top-[-40px] left-[-40px] blur-2xl"></div>
                <div className="absolute w-24 h-24 bg-green-400 opacity-20 rounded-full bottom-[-30px] right-[-30px] blur-xl"></div>
                <div className="absolute w-20 h-20 bg-green-200 opacity-25 rounded-full top-[50%] left-[60%] transform -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
              </div>

              {/* المحتوى */}
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center h-20 w-20 mb-4 mx-auto">
                  <img
                    src={feature.img}
                    alt={feature.title}
                    className="h-20 w-20 object-contain"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
