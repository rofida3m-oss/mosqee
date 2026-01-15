# 🔍 دليل تشخيص المشاكل

## الخطوة 1: تحقق من الخادم

```powershell
# في PowerShell:
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing
```

**النتيجة المتوقعة:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-12T00:00:00.000Z"
}
```

إذا فشل: **الخادم لا يعمل!**
```bash
cd c:\Users\kali\Desktop\mosqee\server
npm run dev
```

---

## الخطوة 2: تحقق من قاعدة البيانات المحلية

**في Console (F12):**
```javascript
// كم جدول موجود؟
Object.keys(localStorage).filter(k => k.includes('jami'))
// يجب ترى: ['jami_sqlite_db', 'jami_user_id', ...]

// حجم البيانات
localStorage.getItem('jami_sqlite_db').length / 1024 / 1024
// يجب يكون أكثر من 0.01 MB
```

---

## الخطوة 3: فتّش Network Requests

**في DevTools (F12 > Network):**

1. اضغط إعجاب على منشور
2. ستشوف requests:
   - `POST /api/posts/[id]/like` ✅
   - أو `POST /api/posts/[id]/comment` ✅

إذا لم تشوف requests:
- قد لا يكون currentUser محدد
- قد تكون function غير معرّفة

---

## الخطوة 4: تحقق من الأخطاء

**في Console:**
```javascript
// شوف جميع الأخطاء الأخيرة
// الخطأ هيظهر بـ red
// اكتبه هنا 👇
```

### الأخطاء الشائعة:

#### ❌ `Cannot read property 'likePost' of undefined`
**الحل:** ستخدم `useApp()` لم يتم import صحيح
```typescript
// ✅ صحيح:
import { useApp } from '../context/AppContext';
const { likePost } = useApp();

// ❌ خطأ:
import useApp from '../context/AppContext';
```

#### ❌ `POST /api/posts/.../like 404`
**الحل:** الـ endpoint غير موجود في الخادم
```bash
# تحقق من server/index.js
grep "posts.*like" server/index.js
```

#### ❌ `SQLITE_CANTOPEN: unable to open database file`
**الحل:** مجلد `data` غير موجود
```bash
mkdir server/data
npm run dev
```

#### ❌ `TypeError: dbQueries.addPostLike is not a function`
**الحل:** الدالة غير معرّفة في dbService
```bash
# تحقق من services/dbService.ts
grep "addPostLike" services/dbService.ts
```

---

## الخطوة 5: اختبر الـ API يدويًا

### اختبر الإعجابات:
```powershell
# في PowerShell:

# أولاً جلب المنشورات
Invoke-WebRequest -Uri "http://localhost:5000/api/posts" | Select-Object -ExpandProperty Content

# ثم أضف إعجاب (غيّر الـ IDs)
$body = @{ userId = "user123" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/posts/post123/like" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" | Select-Object -ExpandProperty Content
```

---

## الخطوة 6: تحقق من الملفات

### ✅ الملفات المهمة:
```
c:\Users\kali\Desktop\mosqee\
├── services/
│   ├── apiService.ts              ✅ endpoints معرّفة
│   └── dbService.ts               ✅ دوال محلية معرّفة
├── context/
│   └── AppContext.tsx             ✅ functions معرّفة في Context
├── components/
│   └── PostCard.tsx               ✅ يستدعي الدوال صحيح
└── server/
    ├── index.js                   ✅ endpoints موجودة
    └── database.js                ✅ methods موجودة
```

### هل الملفات محدثة؟
```bash
# تحقق من وجود الدوال:
grep -r "likePost" services/
grep -r "likePost" context/
grep -r "app.post.*like" server/
```

---

## الخطوة 7: أعد التشغيل من البداية

### كل شيء فشل؟ جرب هذا:
```bash
# 1. توقف عن كل شيء (Ctrl+C في Terminals)

# 2. امسح البيانات المحلية
# في Console (F12):
localStorage.clear()
indexedDB.databases().forEach(db => indexedDB.deleteDatabase(db.name))
location.reload()

# 3. احذف قاعدة الخادم
rm server/data/mosqee.db

# 4. شغّل من الآخر
cd server
npm run dev

# في Terminal آخر:
npm run dev
```

---

## الخطوة 8: تحقق من الأداء

```javascript
// في Console:

// كم عدد المنشورات؟
JSON.stringify(localStorage.getItem('jami_sqlite_db')).length / 1024

// كم عدد الإعجابات؟
// (لا يمكن شفها مباشرة لكن تظهر في UI)

// كم وقت استغرق التحميل؟
console.time('dbLoad')
// ... عمليات ...
console.timeEnd('dbLoad')
```

---

## قائمة فحص سريعة ✓

- [ ] الخادم يعمل على 5000
- [ ] التطبيق يعمل على 3000
- [ ] المتصفح Console خالي من الأخطاء
- [ ] يمكنك تسجيل الدخول
- [ ] تقدر تنشئ منشور
- [ ] الإعجاب يعمل محلياً
- [ ] الإعجاب يتزامن على جهاز ثاني
- [ ] التعليقات تعمل
- [ ] الحذف يعمل

---

## معلومات الاتصال بـ API

| النقطة | الـ URL | الطريقة | الجسم |
|-------|--------|--------|--------|
| جلب المنشورات | `/api/posts` | GET | - |
| إنشاء إعجاب | `/api/posts/:id/like` | POST | `{userId}` |
| حذف إعجاب | `/api/posts/:id/like` | DELETE | `{userId}` |
| عد الإعجابات | `/api/posts/:id/likes` | GET | - |
| إضافة تعليق | `/api/posts/:id/comments` | POST | `{userId, text}` |
| جلب التعليقات | `/api/posts/:id/comments` | GET | - |

---

## 📞 للدعم:

إذا استمرت المشكلة:
1. تحقق من Console (F12) وانسخ الخطأ
2. تحقق من Network tab (F12)
3. شوف server logs في Terminal
4. امسح localStorage وأعد التحميل

