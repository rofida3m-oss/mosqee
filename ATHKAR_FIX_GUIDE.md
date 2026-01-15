# دليل إصلاح مشكلة حفظ بيانات الأذكار

## المشكلة
عندما يقوم المستخدم بحفظ تقدم الأذكار، يتم الحصول على خطأ "Internal Server Error" ولا يتم حفظ البيانات.

## السبب
المشكلة تكمن في دالة `saveAthkarLog` في ملف `server/database.js` التي تستخدم عبارة `INSERT ... ON CONFLICT` التي قد لا تعمل بشكل صحيح مع بعض إصدارات SQLite.

## الحل
يجب استبدال دالة `saveAthkarLog` الحالية بالدالة المحسنة الموجودة في ملف `server/database_fix.js`.

## الخطوات

1. افتح ملف `server/database.js`
2. ابحث عن دالة `saveAthkarLog` (تبدأ من السطر 609)
3. استبدل الدالة بالكامل بالدالة الموجودة في ملف `server/database_fix.js`

## الدالة المحسنة

```javascript
    // Athkar Logs
    saveAthkarLog(userId, category, progress, date) {
        return new Promise((resolve, reject) => {
            console.log('saveAthkarLog called with:', { userId, category, progress, date });

            // Validate inputs
            if (!userId || !category || !date) {
                console.error('Missing required parameters:', { userId, category, progress, date });
                reject(new Error('Missing required parameters: userId, category, and date are required'));
                return;
            }

            const progressJson = JSON.stringify(progress || {});
            console.log('Progress JSON:', progressJson);

            // First, try to update if exists
            const checkSql = `SELECT * FROM athkar_logs WHERE user_id = ? AND category = ? AND date = ?`;
            this.db.get(checkSql, [userId, category, date], (checkErr, row) => {
                if (checkErr) {
                    console.error('saveAthkarLog check error:', checkErr);
                    reject(checkErr);
                    return;
                }

                if (row) {
                    // Update existing record
                    const updateSql = `UPDATE athkar_logs SET progress = ?, updated_at = CURRENT_TIMESTAMP 
                                      WHERE user_id = ? AND category = ? AND date = ?`;
                    this.db.run(updateSql, [progressJson, userId, category, date], function(err) {
                        if (err) {
                            console.error('saveAthkarLog update error:', err);
                            reject(err);
                        } else {
                            console.log('saveAthkarLog update success');
                            resolve();
                        }
                    });
                } else {
                    // Insert new record
                    const insertSql = `INSERT INTO athkar_logs (user_id, category, progress, date) 
                                      VALUES (?, ?, ?, ?)`;
                    this.db.run(insertSql, [userId, category, progressJson, date], function(err) {
                        if (err) {
                            console.error('saveAthkarLog insert error:', err);
                            reject(err);
                        } else {
                            console.log('saveAthkarLog insert success');
                            resolve();
                        }
                    });
                }
            });
        });
    }
```

## الفرق بين الدالة القديمة والمحسنة

الدالة القديمة تستخدم عبارة `INSERT ... ON CONFLICT` التي قد لا تعمل بشكل صحيح مع بعض إصدارات SQLite.

الدالة المحسنة تستخدم نهجًا أكثر موثوقية:
1. تتحقق أولاً مما إذا كان السجل موجودًا
2. إذا كان موجودًا، تقوم بتحديثه
3. إذا لم يكن موجودًا، تقوم بإدراج سجل جديد

## بعد الإصلاح

بعد استبدال الدالة، يجب:
1. إعادة تشغيل الخادم
2. اختبار حفظ بيانات الأذكار
3. التأكد من أن البيانات يتم حفظها بشكل صحيح لكل مستخدم
