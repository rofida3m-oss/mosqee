-- إضافة عمود updated_at إلى جدول athkar_logs
ALTER TABLE athkar_logs ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- تحديث البيانات الموجودة لتعيين updated_at = created_at
UPDATE athkar_logs SET updated_at = created_at WHERE updated_at IS NULL;
