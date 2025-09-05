import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FoundersSection from '../components/FoundersSection';

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bahthali-50/10">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-bahthali-800 mb-4">نبذة عنا</h1>
            <div className="w-24 h-1 bg-bahthali-500 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              منصة بحثي هي منصة ذكية تهدف إلى مساعدة الطلاب الجامعيين في إعداد بحوثهم بكفاءة واحترافية،
              من خلال توفير أدوات متطورة تسهل عملية كتابة البحث في مختلف مراحله.
            </p>
          </div>
          
          <FoundersSection />
          
          <div className="mt-16 bg-white shadow-md rounded-xl p-8 border border-bahthali-100">
            <h2 className="text-2xl font-bold text-bahthali-800 mb-4">رؤيتنا</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              نسعى في بحثي إلى تقديم دعم حقيقي للطلبة الجزائريين خلال مسارهم الأكاديمي،
              وتمكينهم من إنتاج أبحاث ذات جودة عالية مع توفير الوقت والجهد.
              نؤمن بأن العمل الذاتي والجهد الأكاديمي هما أساس بناء المعرفة والتفوق،
              ولذلك فإننا نقدم أدوات مساعدة وليس أدوات بديلة عن جهد الطالب الشخصي.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AboutUs;
