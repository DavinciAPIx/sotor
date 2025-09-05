-- تصحيح البريد الإلكتروني للمسؤول
-- إزالة المسؤول القديم وإضافة الجديد

-- حذف trigger القديم
DROP TRIGGER IF EXISTS auto_add_admin_trigger ON auth.users;

-- تحديث دالة إضافة المسؤولين تلقائياً
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- التحقق من البريد الإلكتروني الصحيح وإضافة المستخدم كمسؤول
    IF NEW.email = 'cherifhoucine91@gmail.com' THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES (NEW.id, now())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'تم إضافة المستخدم % كمسؤول', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- إعادة إنشاء trigger
CREATE TRIGGER auto_add_admin_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_add_admin();

-- البحث عن المستخدم الحالي وإضافته كمسؤول إذا كان موجوداً
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- البحث عن المستخدم بالبريد الإلكتروني الصحيح
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'cherifhoucine91@gmail.com';
    
    -- إذا وُجد المستخدم، أضفه كمسؤول
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES (admin_user_id, now())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'تم إضافة المستخدم % كمسؤول بنجاح', admin_user_id;
    ELSE
        RAISE NOTICE 'المستخدم cherifhoucine91@gmail.com غير موجود حالياً. سيتم إضافته كمسؤول عند تسجيل الدخول.';
    END IF;
END $$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO anon;