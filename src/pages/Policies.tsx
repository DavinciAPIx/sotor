
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';

const Policies = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bahthali-50/10">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-bahthali-800 mb-4">سياسة المنصة</h1>
            <div className="w-24 h-1 bg-bahthali-500 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              قواعد وشروط استخدام منصة بحثي
            </p>
          </div>
          
          <Card className="max-w-4xl mx-auto shadow-lg">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-bold text-bahthali-800 mb-4">سياسة استخدام منصة بحثي</h2>
                <p className="text-gray-600 mb-6">مرحبًا بك في منصة "بحثي". باستخدامك للمنصة، فإنك توافق على الشروط التالية:</p>
                
                <h3 className="text-xl font-semibold text-bahthali-700 mt-6 mb-3">1. الهدف من المنصة</h3>
                <p className="text-gray-600 mb-4">
                  "بحثي" هي أداة رقمية تهدف إلى تسهيل عملية إعداد البحوث الجامعية من خلال توفير عناصر تنظيمية مثل:
                </p>
                <ul className="list-disc mr-6 mb-6 space-y-2 text-gray-600">
                  <li>توليد غلاف البحث</li>
                  <li>إعداد خطة بحث مبدئية</li>
                  <li>تقسيم المحتوى وفق المنهجيات الأكاديمية المعتمدة</li>
                  <li>تقديم دعم تقني باستخدام الذكاء الاصطناعي لتوليد مسودات أولية</li>
                </ul>
                
                <Separator className="my-6" />
                
                <h3 className="text-xl font-semibold text-bahthali-700 mt-6 mb-3">2. دور الذكاء الاصطناعي</h3>
                <p className="text-gray-600 mb-4">
                  الذكاء الاصطناعي في "بحثي" لا يُقصد به استبدال جهد الطالب أو القيام بالبحث بالنيابة عنه.
                  المنصة توفر نقطة انطلاق فقط، ويقع على عاتق الطالب مسؤولية:
                </p>
                <ul className="list-disc mr-6 mb-6 space-y-2 text-gray-600">
                  <li>مراجعة المحتوى</li>
                  <li>تعديله وتحسينه</li>
                  <li>التأكد من مطابقته للمعايير الأكاديمية</li>
                </ul>
                
                <Separator className="my-6" />
                
                <h3 className="text-xl font-semibold text-bahthali-700 mt-6 mb-3">3. المحتوى والمسؤولية</h3>
                <p className="text-gray-600 mb-4">
                  المستخدم هو المسؤول الوحيد عن استخدام المحتوى الناتج من المنصة. "بحثي" لا تتحمل أي مسؤولية قانونية 
                  أو أكاديمية تتعلق بطريقة استخدام الطالب للمحتوى.
                </p>
                
                <Separator className="my-6" />
                
                <h3 className="text-xl font-semibold text-bahthali-700 mt-6 mb-3">4. الخصوصية وحماية البيانات</h3>
                <p className="text-gray-600 mb-4">
                  نحن نحترم خصوصيتك. يتم تخزين البيانات التي تقدمها (مثل اسمك، الجامعة، عنوان البحث) فقط 
                  لتحسين تجربة الاستخدام، ولا يتم مشاركتها مع أي طرف ثالث.
                </p>
                
                <Separator className="my-6" />
                
                <h3 className="text-xl font-semibold text-bahthali-700 mt-6 mb-3">5. الاستخدام العادل والمسموح</h3>
                <p className="text-gray-600 mb-4">
                  يُمنع استخدام المنصة لأي غرض غير أكاديمي، بما في ذلك:
                </p>
                <ul className="list-disc mr-6 mb-6 space-y-2 text-gray-600">
                  <li>تقديم أبحاث غير أصلية أو مزوّرة</li>
                  <li>بيع الأبحاث المنتجة</li>
                  <li>الاستخدام في سياقات غير تعليمية</li>
                </ul>
                
                <Separator className="my-6" />
                
                <h3 className="text-xl font-semibold text-bahthali-700 mt-6 mb-3">6. التعديلات على السياسة</h3>
                <p className="text-gray-600">
                  يحق لمنصة "بحثي" تعديل هذه السياسة في أي وقت، وسيتم إعلام المستخدمين بأي تغييرات تطرأ عبر المنصة.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Policies;
