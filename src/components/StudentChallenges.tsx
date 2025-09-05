import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
const ChallengeCard = ({
  title,
  isActive = false,
  delay = 0
}) => {
  return <div className={`p-6 rounded-lg border transition-all duration-500 transform ${isActive ? 'bg-gradient-to-br from-bahthali-50 to-white border-bahthali-200 shadow-md scale-100 opacity-100' : 'bg-white border-gray-100 opacity-60 scale-95'}`} style={{
    transitionDelay: `${delay}ms`
  }}>
      <h2 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">{title}</h2>
    </div>;
};
const StudentChallenges = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.2
  });
  const challenges = ["بين ضغط الدراسة وضيق الوقت… يبقى البحث الجامعي أكبر عائق أمام الطالب", "كم من مرة وجدت نفسك تائهًا بين المراجع، لا تدري من أين تبدأ؟", "لا تجعل البحث عبئًا إضافيًا، ودّع التوتر وساعات الكتابة العشوائية", "نقدّم لك حلاً ذكيًا ومتكاملًا… يُسهّل عليك إعداد بحوثك بسرعة، دقّة، واحتراف"];
  return <section id="challenges" className="py-16 bg-gradient-to-b from-white to-bahthali-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">اختصر المشوار</h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {challenges.map((challenge, index) => <ChallengeCard key={index} title={challenge} isActive={inView} delay={index * 150} />)}
        </div>
      </div>

      
    </section>;
};
export default StudentChallenges;
