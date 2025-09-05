
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { FileText, ExternalLink, AlertTriangle, History, Download, FileDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResearchCompleteProps {
  documentLink: string;
  onCreateNew: () => void;
}

const ResearchComplete: React.FC<ResearchCompleteProps> = ({ documentLink, onCreateNew }) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingWord, setDownloadingWord] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Extract document ID from Google Docs link
  const getDocumentId = (link: string) => {
    const match = link.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleDownloadPdf = async () => {
  const docId = getDocumentId(documentLink);
  if (!docId) return;

  setDownloadingPdf(true);
  try {
const pdfUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;

window.location.href = pdfUrl;

    toast({
      title: "تم بدء التحميل",
      description: "سيتم تحميل ملف PDF قريباً",
    });
  } catch (error) {
    toast({
      title: "خطأ في التحميل",
      description: "حدث خطأ أثناء تحميل ملف PDF",
      variant: "destructive",
    });
  } finally {
    setDownloadingPdf(false);
  }
};

  const handleDownloadWord = async () => {
    const docId = getDocumentId(documentLink);
    if (!docId) return;

    setDownloadingWord(true);
    try {
      // Use Google Drive download link for better mobile compatibility
      const docxUrl = `https://docs.google.com/document/d/${docId}/export?format=docx`;
      
      window.location.href = docxUrl;
      
      toast({
        title: "تم بدء التحميل",
        description: "تحميل ملف Word قريباً",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل ملف Word",
        variant: "destructive",
      });
    } finally {
      setDownloadingWord(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="bg-white shadow-lg border-bahthali-200">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-bahthali-700">
            تم إنشاء البحث بنجاح
          </CardTitle>
          <CardDescription className="text-gray-500">
            يمكنك الآن {!isMobile ? 'تحميل البحث أو ' : ''}فتحه في Google Docs للمراجعة والتعديل
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle className="text-green-800 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              البحث جاهز
            </AlertTitle>
            <AlertDescription className="text-green-700">
              لقد تم إنشاء بحثك بنجاح، يمكنك {!isMobile ? 'تحميله أو ' : ''}فتحه للمراجعة
            </AlertDescription>
          </Alert>
          
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTitle className="text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              تنبيه للطالب/ة
            </AlertTitle>
            <AlertDescription className="text-yellow-700">
              البحث المُولَّد ليس نسخة نهائية. يُرجى التعديل و مراجعة البحث جيدًا، وإضافة لمستك الخاصة قبل الطباعة أو التقديم للأستاذ/ة. 
              لا تتحمل المنصة أي مسؤولية عن تقديم أعمال رديئة نتيجة عدم التعديل أو المراجعة غير الدقيقة.
            </AlertDescription>
          </Alert>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={() => window.open(documentLink, '_blank')} 
              className="bg-bahthali-500 hover:bg-bahthali-600 text-white"
            >
              <ExternalLink className="ml-2 h-5 w-5" />
              فتح في Google Docs
            </Button>
              <>
                <Button 
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {downloadingPdf ? (
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="ml-2 h-5 w-5" />
                  )}
                  تحميل PDF
                </Button>
                
                <Button 
                  onClick={handleDownloadWord}
                  disabled={downloadingWord}
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  {downloadingWord ? (
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  ) : (
                    <FileDown className="ml-2 h-5 w-5" />
                  )}
                  تحميل Word
                </Button>
              </>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={onCreateNew} 
              className="text-bahthali-600"
            >
              إنشاء بحث جديد
            </Button>
            
            <Link to="/profile">
              <Button 
                variant="outline"
                className="text-bahthali-600 border-bahthali-200 hover:bg-bahthali-50 w-full sm:w-auto"
              >
                <History className="ml-2 h-5 w-5" />
                سجل الأبحاث
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchComplete;
