import { GoogleGenAI } from "@google/genai";
import { Lesson, Mosque } from "../types";
import { calculateDistance } from "../utils/location";
import APIService from "./apiService";

const AI_KEY = process.env.REACT_APP_GOOGLE_AI_KEY;

const ai = AI_KEY ? new GoogleGenAI({ apiKey: AI_KEY }) : null;

export interface ChatResponse {
    reply: string;
    recommendedLessons: Lesson[];
}

/* ==================== Offline Agent ==================== */

const offlineAgent = (
    query: string,
    lessons: Lesson[],
    mosques: Mosque[]
): ChatResponse => {

    const q = query.toLowerCase();

    if (/(وقت|ساعة|كام|كم|صلاة)/.test(q)) {
        return {
            reply: `الساعة الآن ${new Date().toLocaleTimeString('ar-EG')} بتوقيت جهازك.`,
            recommendedLessons: []
        };
    }

    if (/(سلام|مرحبا|اهلا)/.test(q)) {
        return {
            reply: "وعليكم السلام ورحمة الله وبركاته 🌿 كيف أساعدك؟",
            recommendedLessons: []
        };
    }

    if (q.includes('زكاة')) {
        return {
            reply: "الزكاة 2.5% من المال إذا بلغ النصاب (85 جرام ذهب) وحال عليه الحول.",
            recommendedLessons: []
        };
    }

    if (/(صيام|رمضان|صوم)/.test(q)) {
        return {
            reply: "الصيام من الفجر إلى المغرب مع النية، والسحور فيه بركة.",
            recommendedLessons: []
        };
    }

    if (/(قرآن|ختمة)/.test(q)) {
        return {
            reply: "يمكنك قراءة القرآن أو الانضمام للختمة الجماعية من قسم الخدمات.",
            recommendedLessons: []
        };
    }

    const matches = lessons.filter(l =>
        l.title.includes(query) ||
        l.description?.includes(query) ||
        l.sheikhName?.includes(query)
    ).slice(0, 3);

    if (matches.length) {
        return {
            reply: "وجدت لك بعض الدروس المناسبة 👇",
            recommendedLessons: matches
        };
    }

    return {
        reply: "لم أفهم سؤالك تماماً، يمكنك سؤالي عن الصلاة، الزكاة أو البحث عن درس.",
        recommendedLessons: lessons.slice(0, 2)
    };
};

/* ==================== Main Chat ==================== */

export const chatWithAssistant = async (
    userQuery: string,
    lessons: Lesson[],
    mosques: Mosque[],
    userLocation?: { lat: number; lng: number },
    userData?: any
): Promise<ChatResponse> => {

    if (!ai) {
        await APIService.addAssistantLog({
            query: userQuery,
            source: "offline",
            success: false
        }).catch(() => { });
        return offlineAgent(userQuery, lessons, mosques);
    }

    try {
        const enriched = lessons.map(l => {
            const mosque = mosques.find(m => m.id === l.mosqueId);
            const dist = mosque && userLocation
                ? calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    mosque.location.lat,
                    mosque.location.lng
                )
                : Infinity;

            return { ...l, mosqueName: mosque?.name, dist };
        }).sort((a, b) => a.dist - b.dist);

        const context = enriched.slice(0, 5)
            .map(l => `[${l.id}] ${l.title} - ${l.sheikhName}`)
            .join("\n");

        const userContextText = userData ? `
بيانات المستخدم الحالية:
الاسم: ${userData.name}
التسبيح اليومي: ${userData.dailyCount || 0}/${userData.dailyGoal || 100}
الختمة الحالية: ${userData.currentJuz ? `الجزء ${userData.currentJuz}` : 'لا توجد ختمة نشطة'}
` : '';

        const prompt = `
أنت مساعد ذكي لتطبيق "جامع". 
${userContextText}

الدروس المتاحة (استخدمها فقط إذا سأل عنها):
${context}

السؤال: "${userQuery}"

تعليمات:
1. كن ودوداً ومؤدباً جداً.
2. إذا سأل المستخدم "كيف حالي في التسبيح؟" أو "ما وضعي؟" استخدم بيانات المستخدم للإجابة.
3. إذا كان السؤال دينياً عاماً، أجب باختصار وفائدة.

أعد الرد بصيغة JSON فقط:
{"reply":"", "ids":[]}
`;

        const res = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const raw = res.text?.replace(/```json|```/g, '').trim();
        if (!raw) throw new Error("Empty AI response");

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            throw new Error("Invalid JSON from AI");
        }

        const recommended = lessons.filter(l =>
            parsed.ids?.includes(l.id)
        );

        await APIService.addAssistantLog({
            query: userQuery,
            source: "ai",
            success: true
        }).catch(() => { });

        return {
            reply: parsed.reply,
            recommendedLessons: recommended
        };

    } catch (err: any) {
        await APIService.addAssistantLog({
            query: userQuery,
            source: "ai_error",
            snippet: err.message,
            success: false
        }).catch(() => { });
        return offlineAgent(userQuery, lessons, mosques);
    }
};

/* ==================== Simple Recommendation ==================== */

export const getSmartLessonRecommendations = (
    query: string,
    lessons: Lesson[]
) => lessons.filter(l =>
    l.title.includes(query) || l.description?.includes(query)
);
