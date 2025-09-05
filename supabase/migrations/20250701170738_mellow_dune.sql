/*
  # تحديث تكلفة البحث وإزالة الرصيد غير المحدود للأدمن

  1. تحديث تكلفة البحث إلى 100 دج
  2. إزالة الرصيد غير المحدود للأدمن وإعطاؤه 100 دج
  3. تحديث الدوال المتعلقة بالأدمن
*/

-- تحديث تكلفة البحث إلى 100 دج
UPDATE public.app_settings 
SET value = '{"cost": 100}', updated_at = now()
WHERE id = 'research_cost';

-- تحديث دالة get_all_users_with_profiles لإزالة الرصيد غير المحدود للأدمن
CREATE OR REPLACE FUNCTION public.get_all_users_with_profiles()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  email text,
  is_admin boolean
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    au.email,
    CASE WHEN admin_users.id IS NOT NULL THEN true ELSE false END as is_admin
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.admin_users ON p.id = admin_users.id
  ORDER BY p.created_at DESC;
END;
$$;

-- إعطاء الأدمن رصيد 100 دج بدلاً من الرصيد غير المحدود
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- البحث عن المستخدم الأدمن
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'cherifhoucine91@gmail.com';
    
    -- إذا وُجد المستخدم، تحديث رصيده إلى 100 دج
    IF admin_user_id IS NOT NULL THEN
        -- إدراج أو تحديث رصيد المستخدم إلى 100 دج
        INSERT INTO public.user_credits (id, balance)
        VALUES (admin_user_id, 100)
        ON CONFLICT (id) 
        DO UPDATE SET 
            balance = 100,
            updated_at = now();
        
        RAISE NOTICE 'تم تحديث رصيد المسؤول % إلى 100 دج', admin_user_id;
    ELSE
        RAISE NOTICE 'المستخدم cherifhoucine91@gmail.com غير موجود';
    END IF;
END $$;