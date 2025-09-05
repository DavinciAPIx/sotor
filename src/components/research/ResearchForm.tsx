import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button } from '../ui/button';
import { EnhancedInput } from '../ui/enhanced-input';
import { Label } from '../ui/label';
import { Coins, AlertTriangle, FileBadge, Languages } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { UniversityCombobox } from '../UniversityCombobox';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/App';
import ResearchAuth from './ResearchAuth';
import ResearchComplete from './ResearchComplete';
import ResearchProgress from './ResearchProgress';
import { STEP_DURATION, TOTAL_STEPS, PROGRESS_PER_STEP } from './ResearchSteps';
import { validateResearchTitle, validateFieldContent } from '@/lib/badWords';
import { useResearchCost } from '@/hooks/useResearchCost';
import { cn } from '@/lib/utils';

export default function ResearchForm() {
  const { toast } = useToast();
  const { user } = useContext(AuthContext);
  const { researchCost } = useResearchCost();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentLink, setDocumentLink] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [pageLength, setPageLength] = useState<'short' | 'long'>('short');
  const [currentStep, setCurrentStep] = useState(0);
  const [progressValue, setProgressValue] = useState(0);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnglish, setIsEnglish] = useState(false);
  const [formData, setFormData] = useState({
    university: '',
    college: '',
    student: '',
    professor: '',
    bizo: '',
    title: ''
  });

  // Validation states
  const [fieldValidations, setFieldValidations] = useState({
    university: { isValid: true, message: '' },
    college: { isValid: true, message: '' },
    student: { isValid: true, message: '' },
    professor: { isValid: true, message: '' },
    bizo: { isValid: true, message: '' },
    title: { isValid: true, message: '', strength: 'weak' as 'weak' | 'medium' | 'strong', wordCount: 0 }
  });

  const [showValidation, setShowValidation] = useState({
    university: false,
    college: false,
    student: false,
    professor: false,
    bizo: false,
    title: false
  });

  // Load form data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('bahthali-form-data');
    const savedLanguage = localStorage.getItem('bahthali-language');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(prevData => ({
          ...prevData,
          university: parsedData.university || '',
          college: parsedData.college || '',
          student: parsedData.student || '',
          professor: parsedData.professor || '',
          bizo: parsedData.bizo || ''
        }));
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
    
    // Load saved language preference
    if (savedLanguage) {
      setIsEnglish(savedLanguage === 'english');
    }
  }, []);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('bahthali-language', isEnglish ? 'english' : 'arabic');
  }, [isEnglish]);

  // Language-specific text
  const getText = (arabicText: string, englishText: string) => {
    return isEnglish ? englishText : arabicText;
  };

  // Create a custom event to notify the header about credit changes
  const notifyCreditsChanged = () => {
    const event = new CustomEvent('creditsUpdated');
    document.dispatchEvent(event);
  };

  // Helper function to create default credits record
  const createDefaultCreditsRecord = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .insert({ 
          user_id: userId, 
          balance: 0 
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default credits record:', error);
      } else {
        console.log('Default credits record created:', data);
        setUserCredits(0);
      }
    } catch (error) {
      console.error('Unexpected error creating credits record:', error);
    }
  };

  // Fetch user credits when user is loaded
  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) {
        console.log('No user found, skipping credit fetch');
        setLoading(false);
        return;
      }

      console.log('Fetching credits for user:', user.id);
      setLoading(true);

      try {
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );

        // Use the RPC function for safer access
        const fetchPromise = supabase.rpc('get_user_credits', {
          user_id_param: user.id
        });

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (error) {
          console.error('Supabase error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          
          if (error.code === 'PGRST116') {
            await createDefaultCreditsRecord(user.id);
          } else if (error.code === '42P01') {
            toast({
              title: getText("خطأ في النظام", "System Error"),
              description: getText("جدول الرصيد غير موجود. يرجى التواصل مع الدعم الفني", "Credits table doesn't exist. Please contact technical support"),
              variant: "destructive"
            });
          } else if (error.code === '42501') {
            toast({
              title: getText("خطأ في الصلاحيات", "Permission Error"),
              description: getText("لا يمكن الوصول إلى بيانات الرصيد. يرجى تسجيل الدخول مرة أخرى", "Cannot access credit data. Please login again"),
              variant: "destructive"
            });
          }
          
          setUserCredits(0);
        } else if (data === null || data === undefined) {
          console.log('No credits record found for user, setting default to 0');
          setUserCredits(0);
          await createDefaultCreditsRecord(user.id);
        } else {
          const balance = typeof data === 'number' ? data : 0;
          console.log('Credits fetched successfully:', balance);
          setUserCredits(balance);
        }
      } catch (error: any) {
        console.error('Unexpected error when fetching credits:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        if (error.message === 'Request timeout') {
          toast({
            title: getText("انتهت مهلة الاتصال", "Connection Timeout"),
            description: getText("فشل في تحميل الرصيد. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى", "Failed to load balance. Please check your internet connection and try again"),
            variant: "destructive"
          });
        } else if (error.name === 'NetworkError' || error.message.includes('fetch')) {
          toast({
            title: getText("خطأ في الشبكة", "Network Error"),
            description: getText("لا يمكن الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت", "Cannot connect to server. Please check your internet connection"),
            variant: "destructive"
          });
        } else {
          toast({
            title: getText("خطأ غير متوقع", "Unexpected Error"),
            description: getText("حدث خطأ في تحميل الرصيد. يرجى المحاولة مرة أخرى", "An error occurred while loading balance. Please try again"),
            variant: "destructive"
          });
        }
        
        setUserCredits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user, toast, isEnglish]);

  // Save form data to localStorage whenever it changes (excluding title)
  useEffect(() => {
    const dataToSave = {
      university: formData.university,
      college: formData.college,
      student: formData.student,
      professor: formData.professor,
      bizo: formData.bizo
    };
    localStorage.setItem('bahthali-form-data', JSON.stringify(dataToSave));
  }, [formData.university, formData.college, formData.student, formData.professor, formData.bizo]);
  
  // Validate field content
  const validateField = (fieldName: string, value: string) => {
    if (fieldName === 'title') {
      const titleValidation = validateResearchTitle(value);
      setFieldValidations(prev => ({
        ...prev,
        title: titleValidation
      }));
      return titleValidation;
    } else {
      const fieldValidation = validateFieldContent(value, getFieldDisplayName(fieldName));
      setFieldValidations(prev => ({
        ...prev,
        [fieldName]: fieldValidation
      }));
      return fieldValidation;
    }
  };

  const getFieldDisplayName = (fieldName: string): string => {
    if (isEnglish) {
      const displayNames: { [key: string]: string } = {
        university: 'University\'s name',
        college: 'College\'s name',
        student: 'Student\'s name',
        professor: 'Professor\'s name',
        bizo: 'Course\'s name'
      };
      return displayNames[fieldName] || fieldName;
    } else {
      const displayNames: { [key: string]: string } = {
        university: 'اسم الجامعة',
        college: 'اسم الكلية',
        student: 'اسم الطالب',
        professor: 'اسم الأستاذ',
        bizo: 'اسم المقياس'
      };
      return displayNames[fieldName] || fieldName;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    
    validateField(id, value);
    
    if (value.length > 0) {
      setShowValidation(prev => ({
        ...prev,
        [id]: true
      }));
    }
  };

  const handleBlur = (fieldName: string, value: string) => {
    setShowValidation(prev => ({
      ...prev,
      [fieldName]: true
    }));
    validateField(fieldName, value);
  };
  
  const handleUniversityChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      university: value
    }));
    
    validateField('university', value);
    
    setShowValidation(prev => ({
      ...prev,
      university: true
    }));
  };
  
  const saveResearchHistory = async (title: string, documentUrl: string) => {
    if (!user) return;
    try {
      console.log("Saving research to history:", { title, documentUrl, user_id: user.id });
      
      const { data, error } = await supabase
        .from('research_history')
        .insert({
          title,
          content: documentUrl,
          user_id: user.id
        })
        .select();
        
      if (error) {
        console.error('Error saving research history:', error);
        toast({
          title: getText("تنبيه", "Warning"),
          description: getText("تم إنشاء البحث بنجاح ولكن لم نتمكن من حفظه في سجلك الشخصي", "Research created successfully but couldn't save to your personal record"),
          variant: "destructive"
        });
      } else {
        console.log("Research history saved successfully:", data);
      }
    } catch (error) {
      console.error('Error in saving research history:', error);
    }
  };
  
  const deductResearchCost = async () => {
    if (!user) return false;
    
    try {
      if (researchCost === 0) {
        console.log("Research is free, skipping credit deduction");
        
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            amount: 0,
            user_id: user.id,
            status: 'paid',
            research_topic: formData.title,
            payment_method: 'free'
          });
          
        if (transactionError) {
          console.error('Error recording free transaction:', transactionError);
        }
        
        return true;
      }
      
      const { data: currentData, error: fetchError } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Error fetching balance:', fetchError);
        return false;
      }
      
      if (currentData && currentData.balance >= researchCost) {
        const newBalance = currentData.balance - researchCost;
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({ balance: newBalance })
          .eq('user_id', user.id);
          
        if (updateError) {
          console.error('Error updating user credits:', updateError);
          return false;
        }
        
        setUserCredits(newBalance);
        notifyCreditsChanged();
        
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            amount: researchCost,
            user_id: user.id,
            status: 'paid',
            research_topic: formData.title,
            payment_method: 'credit'
          });
          
        if (transactionError) {
          console.error('Error recording transaction:', transactionError);
        }
        
        return true;
      } else {
        console.error('Insufficient balance:', currentData?.balance, 'needed:', researchCost);
        return false;
      }
    } catch (error) {
      console.error('Unexpected error during payment:', error);
      return false;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validations = {
      university: validateField('university', formData.university),
      college: validateField('college', formData.college),
      student: validateField('student', formData.student),
      professor: validateField('professor', formData.professor),
      bizo: validateField('bizo', formData.bizo),
      title: validateField('title', formData.title)
    };

    setShowValidation({
      university: true,
      college: true,
      student: true,
      professor: true,
      bizo: true,
      title: true
    });

    const hasInvalidFields = Object.values(validations).some(validation => !validation.isValid);
    
    if (hasInvalidFields) {
      toast({
        title: getText("خطأ في البيانات", "Data Error"),
        description: getText("يرجى تصحيح الأخطاء في النموذج قبل المتابعة", "Please correct errors in the form before proceeding"),
        variant: "destructive"
      });
      return;
    }

    if (!formData.university || !formData.college || !formData.student || !formData.professor || !formData.title) {
      toast({
        title: getText("خطأ", "Error"),
        description: getText("يرجى ملء جميع الحقول المطلوبة", "Please fill all required fields"),
        variant: "destructive"
      });
      return;
    }
    
    if (researchCost > 0 && userCredits !== null && userCredits < researchCost) {
      toast({
        title: getText("رصيد غير كاف", "Insufficient Balance"),
        description: getText(
          `إنشاء البحث يتطلب ${researchCost} ريال. رصيدك الحالي ${userCredits} ريال فقط.`,
          `Research creation requires ${researchCost} SAR. Your current balance is only ${userCredits} SAR.`
        ),
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    setShowProgress(true);
    setCurrentStep(0);
    setProgressValue(0);
    
    console.log("Sending data to webhook:", formData);
    
    try {
      const webhookUrl = 'https://n8n-cbngxghv.ap-southeast-1.clawcloudrun.com/webhook/935c794e-bf30-4861-977c-48625cce156d';
      const queryParams = new URLSearchParams({
        university: formData.university,
        college: formData.college,
        student: formData.student,
        professor: formData.professor,
        bizo: formData.bizo,
        title: formData.title,
        length: pageLength,
        timestamp: new Date().toISOString()
      });
      const fullUrl = `${webhookUrl}?${queryParams.toString()}`;
      console.log("Sending GET request to:", fullUrl);

      const fetchPromise = fetch(fullUrl).then(async response => {
        try {
          return await response.json();
        } catch (error) {
          console.error("Error parsing JSON response:", error);
          return null;
        }
      });

      let step = 0;
      const animateSteps = async () => {
        const startTime = Date.now();

        while (step < TOTAL_STEPS) {
          setCurrentStep(step);

          const stepStartProgress = step * PROGRESS_PER_STEP;

          const stepAnimationStart = Date.now();
          const stepAnimationInterval = setInterval(() => {
            const elapsed = Date.now() - stepAnimationStart;
            const stepProgress = Math.min(elapsed / STEP_DURATION, 1);
            const overallProgress = stepStartProgress + stepProgress * PROGRESS_PER_STEP;
            setProgressValue(Math.min(overallProgress, 99.9));

            if (stepProgress >= 1) {
              clearInterval(stepAnimationInterval);
            }
          }, 50);

          await new Promise(resolve => setTimeout(resolve, STEP_DURATION));
          clearInterval(stepAnimationInterval);
          step++;
        }
        return true;
      };

      const [animationComplete, responseData] = await Promise.all([animateSteps(), fetchPromise]);

      setProgressValue(100);

      if (responseData && Array.isArray(responseData) && responseData.length > 0 && responseData[0].documentId) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const docLink = `https://docs.google.com/document/d/${responseData[0].documentId}/edit`;
        
        const paymentSuccess = await deductResearchCost();
        if (!paymentSuccess && researchCost > 0) {
          toast({
            title: getText("فشل الدفع", "Payment Failed"),
            description: getText("لم نتمكن من خصم تكلفة البحث من رصيدك. يرجى المحاولة مرة أخرى.", "Couldn't deduct research cost from your balance. Please try again."),
            variant: "destructive"
          });
          setIsSubmitting(false);
          setShowProgress(false);
          return;
        }
        
        setDocumentLink(docLink);
        setShowProgress(false);

        if (user) {
          await saveResearchHistory(formData.title, docLink);
        }
        
        notifyCreditsChanged();
        
        toast({
          title: getText("تم بنجاح", "Success"),
          description: getText("تم إنشاء البحث بنجاح، يمكنك الآن فتح المستند", "Research created successfully, you can now open the document")
        });
      } else {
        toast({
          title: getText("خطأ", "Error"),
          description: getText("لم نتمكن من استلام رابط المستند من الخادم، يرجى المحاولة مرة أخرى", "Couldn't receive document link from server, please try again"),
          variant: "destructive"
        });
        setShowProgress(false);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: getText("خطأ", "Error"),
        description: getText("حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى", "An unexpected error occurred, please try again"),
        variant: "destructive"
      });
      setShowProgress(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = () => {
    setDocumentLink(null);
    setFormData(prev => ({
      ...prev,
      title: ''
    }));
    setFieldValidations(prev => ({
      ...prev,
      title: { isValid: true, message: '', strength: 'weak', wordCount: 0 }
    }));
    setShowValidation(prev => ({
      ...prev,
      title: false
    }));
    notifyCreditsChanged();
  };

  if (!user) {
    return <ResearchAuth />;
  }

  if (documentLink) {
    return <ResearchComplete documentLink={documentLink} onCreateNew={handleCreateNew} />;
  }

  return (
    <>
      <Card
        className="w-full max-w-lg mx-auto bg-white/30 backdrop-blur-sm border border-green-200 rounded-xl transition-all duration-200"
        style={{ boxShadow: "0px 0px 28px rgba(42, 174, 115, 0.22)" }}
        dir={isEnglish ? "ltr" : "rtl"}
      >
        <CardHeader className="text-center pb-3 px-4 pt-4 bg-white/20 rounded-t-xl">
          <div className="flex items-center justify-between mb-1">
            <div className="flex-1" />
            <CardTitle className="text-lg font-bold text-green-900">
              {getText("معلومات البحث", "Research Information")}
            </CardTitle>
            <div className="flex-1" />
          </div>
          <div className="w-12 h-0.5 bg-green-500 rounded-full mx-auto"></div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {/* تكلفة البحث */}
          <div className={cn(
            "rounded-lg p-3 border backdrop-blur-sm bg-white/30 transition-all duration-200",
            researchCost > 0 && userCredits !== null && userCredits < researchCost 
              ? "border-red-200" 
              : "border-green-200"
          )}>
            <div className="flex items-center gap-3">
              <Coins className={cn(
                "h-5 w-5",
                researchCost > 0 && userCredits !== null && userCredits < researchCost
                  ? "text-red-600" 
                  : "text-green-600"
              )} />
              <div className="text-sm text-gray-800">
                <span className="font-semibold">
                  {getText("تكلفة البحث: ", "Research Cost: ")}
                </span>
                {researchCost > 0 
                  ? (
                    <>
                      <span className="font-bold">{researchCost} {getText("ريال", "SAR")}</span>
                      {getText(" | رصيدك: ", " | Your Balance: ")}
                      {loading ? (
                        <span className="inline-block w-8 h-3 bg-gray-300 animate-pulse rounded"></span>
                      ) : (
                        <span className={cn(
                          "font-bold",
                          userCredits !== null && userCredits < researchCost 
                            ? "text-red-600" 
                            : "text-green-600"
                        )}>
                          {userCredits} {getText("ريال", "SAR")}
                        </span>
                      )}
                    </>
                  )
                  : (
                    <span className="font-bold text-green-600">
                      {getText("مجاني", "Free")}
                    </span>
                  )
                }
              </div>
            </div>
          </div>

          {/* Language Toggle - Modern Switch Style */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-3 p-1 bg-white/50 border border-green-200 rounded-full">
              <button
                type="button"
                onClick={() => setIsEnglish(false)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  !isEnglish 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setIsEnglish(true)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isEnglish 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university" className="text-xs font-medium text-gray-700">
                {getText("اسم الجامعة", "University Name")}
              </Label>
              <UniversityCombobox 
                value={formData.university} 
                onChange={handleUniversityChange} 
                placeholder={getText("اختر الجامعة...", "Select University...")}
                language={isEnglish ? 'en' : 'ar'}
                onLanguageChange={(lang) => {
                  setIsEnglish(lang === 'en');
                  setFormData(prev => ({
                    ...prev,
                    university: ''
                  }));
                }}
              />
            </div>

            {[
              { 
                id: 'college', 
                label: getText('اسم الكلية', 'College Name'), 
                placeholder: getText('كلية ادارة الاعمال', 'College of Business Administration') 
              },
              { 
                id: 'student', 
                label: getText('اسم الطالب', 'Student Name'), 
                placeholder: getText('اسم الطالب الكامل', 'Full Student Name') 
              },
              { 
                id: 'professor', 
                label: getText('اسم الدكتور', 'Professor Name'), 
                placeholder: getText('د. اسم الدكتور', 'Dr. Professor Name') 
              },
              { 
                id: 'bizo', 
                label: getText('المقرر', 'Course'), 
                placeholder: getText('مبادئ المحاسبة', 'Principles of Accounting') 
              },
            ].map(({ id, label, placeholder }) => (
              <div key={id} className="space-y-2">
                <Label htmlFor={id} className="text-xs font-bold font-medium text-gray-700">{label}</Label>
                <EnhancedInput 
                  id={id}
                  placeholder={placeholder}
                  className="text-sm bg-white/40 border border-green-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-300 transition-all duration-150"
                  value={formData[id as keyof typeof formData]} 
                  onChange={handleChange}
                  onBlur={() => handleBlur(id, formData[id as keyof typeof formData])}
                  validation={fieldValidations[id as keyof typeof fieldValidations]}
                  showValidation={true}
                  dir={isEnglish ? 'ltr' : 'rtl'}
                />
              </div>
            ))}

            <div className="space-y-2 pt-2 border-t border-green-100">
              <Label htmlFor="title" className="text-xs font-bold font-medium text-gray-700">
                {getText("عنوان البحث", "Research Title")}
              </Label>
              <EnhancedInput 
                id="title" 
                placeholder={getText("أدخل عنوان البحث", "Enter research title")} 
                className="text-sm font-medium bg-white/40 border border-green-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-300 transition-all duration-150"
                value={formData.title} 
                onChange={handleChange}
                onBlur={() => handleBlur('title', formData.title)}
                validation={fieldValidations.title}
                showValidation={true}
                dir={isEnglish ? 'ltr' : 'rtl'}
              />
            </div>

            <div className="flex justify-center mt-6">
              <div className="flex flex-col md:flex-row items-center gap-3 p-2 border border-green-300 rounded-xl shadow-sm bg-white/50 backdrop-blur-sm transition-all duration-300">
                <Button 
                  type="submit"
                  className="px-4 py-1.5 bg-green-700 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 
                    getText("جاري الإنشاء...", "Creating...") : 
                    researchCost > 0 ? 
                      getText(
                        `إنشاء البحث (${researchCost} ريال)`, 
                        `Create Research (${researchCost} SAR)`
                      ) : 
                      getText("إنشاء البحث (مجاناً)", "Create Research (Free)")
                  }
                </Button>
              </div>
            </div>

          </form>
        </CardContent>
      </Card>
      {/* Research Progress Dialog */}
      <ResearchProgress 
        showProgress={showProgress}
        setShowProgress={setShowProgress}
        currentStep={currentStep}
      />
    </>
  );
}
