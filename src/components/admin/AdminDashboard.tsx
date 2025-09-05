import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, BarChart3, Settings, FileText, Activity, ArrowRightLeft, ArrowLeftRight } from 'lucide-react';
import UserManagement from './UserManagement';
import GiftCreditsPanel from './GiftCreditsPanel';
import AdminStats from './AdminStats';
import ResearchCostManager from './ResearchCostManager';
import TransactionManager from './TransactionManager';
import ResearchAnalytics from './ResearchAnalytics';
import SystemLogs from './SystemLogs';
import CreditTransactionsList from './CreditTransactionsList';
import CreditTransfersList from './CreditTransfersList';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-bahthali-700">لوحة الإدارة المتقدمة</CardTitle>
          <CardDescription>
            إدارة شاملة للمنصة مع إحصائيات متقدمة وأدوات تحليل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">نظرة عامة</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">المستخدمين</span>
              </TabsTrigger>
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">الرصيد</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">المعاملات</span>
              </TabsTrigger>
              <TabsTrigger value="credit-transactions" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                <span className="hidden sm:inline">معاملات الرصيد</span>
              </TabsTrigger>
              <TabsTrigger value="credit-transfers" className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                <span className="hidden sm:inline">تحويلات الرصيد</span>
              </TabsTrigger>
              <TabsTrigger value="research" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">الأبحاث</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">السجل</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">الإعدادات</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <AdminStats />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-bahthali-600">الإجراءات السريعة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <button 
                      onClick={() => setActiveTab('credits')}
                      className="w-full p-3 text-right rounded-lg border border-bahthali-200 hover:bg-bahthali-50 transition-colors"
                    >
                      إهداء رصيد للمستخدمين
                    </button>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="w-full p-3 text-right rounded-lg border border-bahthali-200 hover:bg-bahthali-50 transition-colors"
                    >
                      تحديث تكلفة البحث
                    </button>
                    <button 
                      onClick={() => setActiveTab('users')}
                      className="w-full p-3 text-right rounded-lg border border-bahthali-200 hover:bg-bahthali-50 transition-colors"
                    >
                      إدارة المستخدمين
                    </button>
                    <button 
                      onClick={() => setActiveTab('credit-transactions')}
                      className="w-full p-3 text-right rounded-lg border border-bahthali-200 hover:bg-bahthali-50 transition-colors"
                    >
                      عرض معاملات الرصيد
                    </button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-bahthali-600">آخر الأنشطة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span>تسجيل مستخدم جديد</span>
                        <span className="text-gray-500">منذ 5 دقائق</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span>إنشاء بحث جديد</span>
                        <span className="text-gray-500">منذ 15 دقيقة</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <span>عملية دفع ناجحة</span>
                        <span className="text-gray-500">منذ 30 دقيقة</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="credits" className="space-y-4">
              <GiftCreditsPanel />
            </TabsContent>
            
            <TabsContent value="transactions" className="space-y-4">
              <TransactionManager />
            </TabsContent>
            
            <TabsContent value="credit-transactions" className="space-y-4">
              <CreditTransactionsList />
            </TabsContent>
            
            <TabsContent value="credit-transfers" className="space-y-4">
              <CreditTransfersList />
            </TabsContent>
            
            <TabsContent value="research" className="space-y-4">
              <ResearchAnalytics />
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-4">
              <SystemLogs />
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResearchCostManager />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-bahthali-600">إعدادات أخرى</CardTitle>
                    <CardDescription>إعدادات إضافية للمنصة</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">صيانة المنصة</h4>
                        <p className="text-sm text-gray-600 mb-3">تفعيل وضع الصيانة لإجراء التحديثات</p>
                        <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors">
                          تفعيل وضع الصيانة
                        </button>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">نسخ احتياطي</h4>
                        <p className="text-sm text-gray-600 mb-3">إنشاء نسخة احتياطية من البيانات</p>
                        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                          إنشاء نسخة احتياطية
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;