/*
  # إضافة مسؤول جديد

  1. إضافة المستخدم cherifhoucine91@gmail.com كمسؤول
  2. منح صلاحيات الإدارة الكاملة
  3. تمكين الوصول إلى لوحة الإدارة
*/

-- إضافة المستخدم كمسؤول بناءً على البريد الإلكتروني
-- سيتم تنفيذ هذا عندما يسجل المستخدم دخوله لأول مرة
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- البحث عن المستخدم بالبريد الإلكتروني
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'cherifhoucine91@gmail.com';
    
    -- إذا وُجد المستخدم، أضفه كمسؤول
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES (admin_user_id, now())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'تم إضافة المستخدم % كمسؤول', admin_user_id;
    ELSE
        RAISE NOTICE 'المستخدم cherifhoucine91@gmail.com غير موجود بعد. سيتم إضافته كمسؤول عند تسجيل الدخول لأول مرة.';
    END IF;
END $$;

-- إنشاء دالة لإضافة المسؤولين تلقائياً عند تسجيل الدخول
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- التحقق من البريد الإلكتروني وإضافة المستخدم كمسؤول إذا كان مطابقاً
    IF NEW.email = 'cherifhoucine91@gmail.com' THEN
        INSERT INTO public.admin_users (id, created_at)
        VALUES (NEW.id, now())
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- إنشاء trigger لتنفيذ الدالة عند إنشاء مستخدم جديد
DROP TRIGGER IF EXISTS auto_add_admin_trigger ON auth.users;
CREATE TRIGGER auto_add_admin_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_add_admin();

-- منح صلاحيات تنفيذ الدالة
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO anon;