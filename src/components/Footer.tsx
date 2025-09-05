
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Globe, Phone } from 'lucide-react';

const Footer = () => {
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-bahthali-900 via-bahthali-800 to-bahthali-700 text-white">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-bahthali-500 rounded-full blur-3xl -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-bahthali-400 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
      </div>
      
      <div className="relative py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="md:col-span-1">
              <h2 className="text-3xl font-bold mb-6">
                <span className="text-white">سطـــــو</span>
                <span className="text-bahthali-200">ر</span>
              </h2>
              <p className="text-bahthali-100 mb-6 leading-relaxed text-lg">
                منصة ذكية تسهّل عليك كل مراحل كتابة البحث، من إعداد صفحة الغلاف، مرورًا بخطة البحث، وصولًا إلى كتابة المحتوى الكامل
              </p>
              
              {/* Social Media Icons */}
              <div className="flex space-x-4 space-x-reverse">
                <a 
                  href="https://www.facebook.com/profile.php?id=61576856107565&mibextid=ZbWKwL" 
                  target="_blank" 
                  rel="noreferrer"
                  className="group relative h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-bahthali-800 transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                >
                  <Facebook className="h-5 w-5 transition-transform group-hover:scale-110" />
                </a>
                <a 
                  href="https://www.instagram.com/bahthy_com?igsh=MWFuaXdpb2JhaGExdQ==" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="group relative h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-bahthali-800 transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                >
                  <Instagram className="h-5 w-5 transition-transform group-hover:scale-110" />
                </a>
                <a 
                  href="https://www.tiktok.com/@bahthy.com?_t=ZM-8x90vYxsp53&_r=1" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="group relative h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-bahthali-800 transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                >
                  <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5.76 20.5a6.34 6.34 0 0 0 10.86-4.43V7.83a8.2 8.2 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.8-.26z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="md:col-span-1">
              <h3 className="text-xl font-bold mb-6 text-bahthali-200">روابط سريعة</h3>
              <ul className="space-y-4">
                <li>
                  <Link 
                    to="/" 
                    onClick={handleLinkClick} 
                    className="group text-bahthali-100 hover:text-white transition-all duration-300 flex items-center"
                  >
                    <span className="w-2 h-2 bg-bahthali-400 rounded-full ml-3 group-hover:bg-white transition-colors duration-300"></span>
                    الصفحة الرئيسية
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/about-us" 
                    onClick={handleLinkClick} 
                    className="group text-bahthali-100 hover:text-white transition-all duration-300 flex items-center"
                  >
                    <span className="w-2 h-2 bg-bahthali-400 rounded-full ml-3 group-hover:bg-white transition-colors duration-300"></span>
                    فكرة المنصة
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/policies" 
                    onClick={handleLinkClick} 
                    className="group text-bahthali-100 hover:text-white transition-all duration-300 flex items-center"
                  >
                    <span className="w-2 h-2 bg-bahthali-400 rounded-full ml-3 group-hover:bg-white transition-colors duration-300"></span>
                    سياسة المنصة
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Contact Info */}
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-6 text-bahthali-200">تواصل معنا</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="group p-4 rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center text-bahthali-100 group-hover:text-white">
                    <div className="h-10 w-10 bg-bahthali-600 rounded-lg flex items-center justify-center ml-4 group-hover:bg-bahthali-500 transition-colors duration-300">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm opacity-75">البريد الإلكتروني</p>
                      <p className="font-medium">info@sotor.tech</p>
                    </div>
                  </div>
                </div>
                
                <div className="group p-4 rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center text-bahthali-100 group-hover:text-white">
                    <div className="h-10 w-10 bg-bahthali-600 rounded-lg flex items-center justify-center ml-4 group-hover:bg-bahthali-500 transition-colors duration-300">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm opacity-75">رقم الهاتف</p>
                      <p className="font-medium">966567039532+</p>
                    </div>
                  </div>
                </div>
                
                <div className="group p-4 rounded-xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 sm:col-span-2">
                  <div className="flex items-center text-bahthali-100 group-hover:text-white">
                    <div className="h-10 w-10 bg-bahthali-600 rounded-lg flex items-center justify-center ml-4 group-hover:bg-bahthali-500 transition-colors duration-300">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm opacity-75">الموقع الإلكتروني</p>
                      <p className="font-medium">sotor.tech</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-white/20 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-bahthali-200 text-sm mb-4 md:mb-0">
                جميع الحقوق محفوظة &copy; {new Date().getFullYear()} سطـــــور
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
