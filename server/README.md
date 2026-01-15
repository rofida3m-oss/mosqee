# 🔧 Mosqee Backend Server

خادم Express.js لتطبيق Mosqee يوفر API كامل لإدارة البيانات.

## المميزات

✅ REST API كامل
✅ قاعدة بيانات SQLite محلية
✅ CORS مفعل
✅ معالجة الأخطاء الشاملة
✅ إدارة المستخدمين والمساجد والدروس والمنشورات

## البدء السريع

### التثبيت
```bash
npm install
```

### التشغيل
```bash
# وضع التطوير (مع Auto-reload)
npm run dev

# وضع الإنتاج
npm start
```

الخادم سيعمل على: **http://localhost:5000**

## التشغيل الكامل للتطبيق

### من مجلد المشروع الرئيسي:

**Terminal 1 - تشغيل الـ Frontend:**
```bash
npm run dev
```

**Terminal 2 - تشغيل الـ Backend:**
```bash
npm run server
```

أو باستخدام أمر واحد:
```bash
npm run dev:all
```

## 📁 هيكل الملفات

```
server/
├── index.js           # الخادم الرئيسي وجميع Routes
├── database.js        # قاعدة البيانات والاستعلامات
├── data/              # مجلد البيانات (يتم إنشاؤه تلقائياً)
│   └── mosqee.db      # ملف قاعدة البيانات
├── package.json       # المتطلبات
└── README.md          # هذا الملف
```

## 🔌 API Endpoints

### Authentication
- `POST /api/users/login` - تسجيل الدخول
- `POST /api/users/register` - التسجيل الجديد

### Users
- `GET /api/users` - جميع المستخدمين
- `GET /api/users/:id` - المستخدم بـ ID
- `PUT /api/users/:id` - تحديث المستخدم

### Mosques
- `GET /api/mosques` - جميع المساجد
- `POST /api/mosques` - إنشاء مسجد جديد
- `PUT /api/mosques/:id` - تحديث المسجد

### Lessons
- `GET /api/lessons` - جميع الدروس
- `POST /api/lessons` - إضافة درس جديد

### Posts
- `GET /api/posts` - جميع المنشورات
- `POST /api/posts` - إنشاء منشور جديد
- `PUT /api/posts/:id` - تحديث المنشور

### Prayer Logs
- `GET /api/prayer-logs/:userId/:date` - سجل الصلاة
- `POST /api/prayer-logs` - حفظ سجل الصلاة

### Tasbih
- `GET /api/tasbih-logs/:userId/:date` - سجل التسبيح
- `POST /api/tasbih-logs` - حفظ سجل التسبيح
- `GET /api/tasbih-count/:userId` - إجمالي العدد

### Khatma
- `GET /api/khatma` - الختمة
- `PUT /api/khatma/:id` - تحديث الختمة

### Support
- `GET /api/tickets` - جميع التذاكر
- `POST /api/tickets` - إنشاء تذكرة
- `PUT /api/tickets/:id` - تحديث التذكرة

### Health
- `GET /api/health` - فحص صحة الخادم

## 🗄️ قاعدة البيانات

تستخدم SQLite3 مع الجداول التالية:
- `users` - المستخدمين
- `mosques` - المساجد
- `lessons` - الدروس
- `posts` - المنشورات
- `prayer_logs` - سجلات الصلوات
- `tasbih_logs` - سجلات التسبيح
- `khatmas` - بيانات الختمة
- `tickets` - تذاكر الدعم

## 🔒 الأمان

- ✅ CORS مفعل للتطبيق الرئيسي
- ✅ Body-parser محدد (50MB)
- ✅ معالجة الأخطاء الكاملة
- ⚠️ ملاحظة: في الإنتاج، أضف JWT Authentication

## 📝 المتطلبات

- Node.js >= 18.0.0
- npm >= 9.0.0

## 🐛 استكشاف الأخطاء

### الخادم لا ينطلق
```bash
# تأكد من عدم استخدام الـ Port
lsof -i :5000
```

### خطأ في قاعدة البيانات
```bash
# احذف قاعدة البيانات وأعد التشغيل
rm -rf server/data/
npm run dev
```

### CORS Errors
```bash
# تأكد من أن الـ Frontend على localhost:5173
# وأن الـ Backend على localhost:5000
```

## 🚀 النشر

### على Heroku
```bash
heroku create mosqee-api
git push heroku main
```

### على Railway
```bash
railway up
```

### على Render
1. ربط الـ GitHub
2. اختر `server` folder
3. اختر Node.js runtime
4. Deploy

## 📚 معلومات إضافية

- [Express.js Docs](https://expressjs.com/)
- [SQLite Docs](https://www.sqlite.org/docs.html)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**تم ✅**
