-- فرض تحديث تكلفة البحث إلى 100 دج
-- حذف القيمة الموجودة وإعادة إدراجها

DELETE FROM public.app_settings WHERE id = 'research_cost';

INSERT INTO public.app_settings (id, value, created_at, updated_at) 
VALUES (
  'research_cost', 
  '{"cost": 100}',
  now(),
  now()
);

-- التحقق من أن القيمة تم إدراجها بشكل صحيح
DO $$
DECLARE
    current_cost jsonb;
BEGIN
    SELECT value INTO current_cost 
    FROM public.app_settings 
    WHERE id = 'research_cost';
    
    IF current_cost IS NOT NULL THEN
        RAISE NOTICE 'تكلفة البحث الحالية: %', current_cost;
    ELSE
        RAISE NOTICE 'خطأ: لم يتم العثور على تكلفة البحث';
    END IF;
END $$;