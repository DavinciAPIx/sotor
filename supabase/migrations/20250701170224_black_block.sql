-- إصلاح صلاحيات المسؤول لـ cherifhoucine91@gmail.com

-- أولاً، دعنا نتحقق من وجود المستخدم ونضيفه كمسؤول
DO $$
DECLARE
    admin_user_id uuid;
    user_exists boolean := false;
BEGIN
    -- البحث عن المستخدم بالبريد الإلكتروني
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'cherifhoucine91@gmail.com';
    
    -- التحقق من وجود المستخدم
    IF admin_user_id IS NOT NULL THEN
        user_exists := true;
        
        -- إضافة المستخدم كمسؤول
        INSERT INTO public.admin_users (id, created_at)
        VALUES (admin_user_id, now())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'تم إضافة المستخدم % كمسؤول بنجاح', admin_user_id;
    END IF;
    
    -- إذا لم يوجد المستخدم، نبحث عن أي مستخدم بنفس البداية
    IF NOT user_exists THEN
        FOR admin_user_id IN 
            SELECT id FROM auth.users 
            WHERE email LIKE 'cherifhoucine91%'
        LOOP
            INSERT INTO public.admin_users (id, created_at)
            VALUES (admin_user_id, now())
            ON CONFLICT (id) DO NOTHING;
            
            RAISE NOTICE 'تم إضافة المستخدم % كمسؤول', admin_user_id;
            user_exists := true;
        END LOOP;
    END IF;
    
    -- إذا لم نجد أي مستخدم، نعرض رسالة
    IF NOT user_exists THEN
        RAISE NOTICE 'لم يتم العثور على المستخدم cherifhoucine91@gmail.com. يرجى التأكد من تسجيل الدخول أولاً.';
    END IF;
END $$;

-- تحديث دالة التحقق من المسؤول لتكون أكثر مرونة
CREATE OR REPLACE FUNCTION public.auto_add_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- التحقق من البريد الإلكتروني وإضافة المستخدم كمسؤول
    IF NEW.email = 'cherifhoucine91@gmail.com' OR 
       NEW.email LIKE 'cherifhoucine91%' THEN
        
        INSERT INTO public.admin_users (id, created_at)
        VALUES (NEW.id, now())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'تم إضافة المستخدم % كمسؤول تلقائياً', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- إنشاء دالة للتحقق من حالة المسؤول
CREATE OR REPLACE FUNCTION public.check_admin_status(user_email text)
RETURNS TABLE (
    user_id uuid,
    email text,
    is_admin boolean,
    admin_since timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        CASE WHEN a.id IS NOT NULL THEN true ELSE false END as is_admin,
        a.created_at as admin_since
    FROM auth.users u
    LEFT JOIN public.admin_users a ON u.id = a.id
    WHERE u.email = user_email;
END;
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.check_admin_status(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_add_admin() TO anon;