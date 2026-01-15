import { Mosque, Lesson, Post, User, UserRole, SupportTicket } from './types';

// Mock Mosques
export const MOCK_MOSQUES: Mosque[] = [
  {
    id: 'm1',
    name: 'مسجد النور',
    imamName: 'الشيخ أحمد',
    address: 'حي الزهور، القاهرة',
    location: { lat: 30.0444, lng: 31.2357 },
    image: 'https://picsum.photos/800/600?random=1',
    followersCount: 1250,
  },
  {
    id: 'm2',
    name: 'جامع الرحمن',
    imamName: 'الشيخ محمد',
    address: 'شارع التحرير، الدقي',
    location: { lat: 30.0500, lng: 31.2400 },
    image: 'https://picsum.photos/800/600?random=2',
    followersCount: 890,
  },
  {
    id: 'm3',
    name: 'مسجد الهدى',
    imamName: 'الشيخ عمر',
    address: 'مدينة نصر',
    location: { lat: 30.0600, lng: 31.3300 },
    image: 'https://picsum.photos/800/600?random=3',
    followersCount: 3400,
  },
];

// Mock Users for Admin Dashboard
export const MOCK_USERS: User[] = [
    {
        id: 'u_101',
        name: 'علي حسن',
        phone: '0100000001',
        role: UserRole.USER,
        isActive: true,
        followingMosques: [],
        registeredLessons: []
    },
    {
        id: 'u_102',
        name: 'سعيد محمود',
        phone: '0100000002',
        role: UserRole.USER,
        isActive: false, // Banned
        followingMosques: [],
        registeredLessons: []
    },
    {
        id: 'u_103',
        name: 'الشيخ أحمد',
        phone: '0120000001',
        role: UserRole.IMAM,
        isActive: true,
        followingMosques: [],
        registeredLessons: [],
        managedMosqueId: 'm1'
    }
];

// Mock Tickets
export const MOCK_TICKETS: SupportTicket[] = [
    {
        id: 't1',
        userId: 'u_101',
        userName: 'علي حسن',
        subject: 'مشكلة في التسجيل',
        message: 'لا أستطيع التسجيل في درس الجمعة، يظهر لي خطأ.',
        status: 'open',
        createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: 't2',
        userId: 'u_102',
        userName: 'سعيد محمود',
        subject: 'استفسار عن حسابي',
        message: 'لماذا تم حظر حسابي؟ أرجو التوضيح.',
        status: 'open',
        createdAt: new Date(Date.now() - 172800000).toISOString()
    }
];

// Mock Lessons
export const MOCK_LESSONS: Lesson[] = [
  {
    id: 'l1',
    mosqueId: 'm1',
    title: 'تفسير سورة الكهف',
    sheikhName: 'الشيخ أحمد',
    date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    time: '18:30',
    type: 'lecture',
    description: 'شرح مفصل لآيات سورة الكهف وقصصها والعبر المستفادة منها.',
  },
  {
    id: 'l2',
    mosqueId: 'm1',
    title: 'مسابقة حفظ القرآن الكريم',
    sheikhName: 'لجنة التحكيم',
    date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    time: '16:00',
    type: 'competition',
    description: 'مسابقة للشباب دون 18 سنة في حفظ جزء عم.',
  },
  {
    id: 'l3',
    mosqueId: 'm2',
    title: 'أحكام الصيام',
    sheikhName: 'الشيخ محمد',
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    time: '19:00',
    type: 'course',
    description: 'سلسلة فقهية لشرح أحكام الصيام ومبطلاته.',
  },
];

// Mock Posts
export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    mosqueId: 'm1',
    userId: 'u_admin',
    content: 'يسرنا دعوتكم لحضور درس الجمعة القادم بعنوان "فضل الصدقة".',
    image: 'https://picsum.photos/800/400?random=10',
    likes: 45,
    comments: [
        { id: 'c1', userName: 'محمد علي', content: 'بارك الله فيكم', createdAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString(),
    type: 'lesson_alert',
  },
  {
    id: 'p2',
    mosqueId: 'm3',
    userId: 'u_admin',
    content: 'تم بحمد الله تجديد فرش المسجد. نسأل الله أن يبارك في المتبرعين.',
    likes: 120,
    comments: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    type: 'general',
  },
  {
    id: 'p3',
    mosqueId: 'm2',
    userId: 'u_admin',
    content: 'تذكير: موعدنا اليوم مع مجلس الفقه بعد صلاة المغرب.',
    likes: 30,
    comments: [],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    type: 'announcement',
  },
  {
    id: 'p4',
    mosqueId: 'm1',
    userId: 'u_admin',
    content: 'مقطع مرئي من خطبة الجمعة الماضية: "الأمانة".',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // Dummy video
    likes: 210,
    comments: [
        { id: 'c2', userName: 'أحمد حسن', content: 'ما شاء الله تبارك الله', createdAt: new Date().toISOString() },
        { id: 'c3', userName: 'كريم محمود', content: 'جزاكم الله خيراً يا شيخ', createdAt: new Date().toISOString() }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    type: 'video',
  },
];