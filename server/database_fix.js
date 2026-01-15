// هذا الملف يحتوي على الدالة المحسنة لـ saveAthkarLog
// يجب نسخ هذه الدالة واستبدالها بالدالة الأصلية في ملف database.js

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
