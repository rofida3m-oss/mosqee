import {
  Coordinates,
  CalculationMethod,
  PrayerTimes as AdhanPrayerTimes,
  Madhab
} from "adhan";

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

/* ================= Utilities ================= */

// صيغة ثابتة للحساب (أرقام إنجليزي)
const timeFormatterEN = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// صيغة للعرض فقط (عربي)
export const formatArabicTime = (time: string) =>
  new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(`1970-01-01T${time}:00`));

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/* ================= Prayer Times ================= */

export const getPrayerTimes = (
  date: Date,
  lat: number,
  lng: number
): PrayerTimes => {
  try {
    const coordinates = new Coordinates(lat, lng);
    const params = CalculationMethod.Egyptian();
    params.madhab = Madhab.Shafi;

    const pt = new AdhanPrayerTimes(coordinates, date, params);

    return {
      Fajr: timeFormatterEN.format(pt.fajr),
      Dhuhr: timeFormatterEN.format(pt.dhuhr),
      Asr: timeFormatterEN.format(pt.asr),
      Maghrib: timeFormatterEN.format(pt.maghrib),
      Isha: timeFormatterEN.format(pt.isha),
    };
  } catch (e) {
    console.error("Prayer time calculation error:", e);
    return {
      Fajr: "04:30",
      Dhuhr: "12:00",
      Asr: "15:30",
      Maghrib: "18:00",
      Isha: "19:30",
    };
  }
};

/* ================= Next Prayer ================= */

export const getNextPrayer = (
  times: PrayerTimes
): { name: string; time: string; remainingMinutes: number } => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const prayers = [
    { name: "الفجر", time: times.Fajr },
    { name: "الظهر", time: times.Dhuhr },
    { name: "العصر", time: times.Asr },
    { name: "المغرب", time: times.Maghrib },
    { name: "العشاء", time: times.Isha },
  ];

  for (const p of prayers) {
    const prayerMinutes = toMinutes(p.time);
    if (prayerMinutes > nowMinutes) {
      return {
        name: p.name,
        time: p.time,
        remainingMinutes: prayerMinutes - nowMinutes,
      };
    }
  }

  // لو كل الصلوات عدت → الفجر بكرة
  const fajrMinutes = toMinutes(times.Fajr);

  return {
    name: "الفجر",
    time: times.Fajr,
    remainingMinutes: 24 * 60 - nowMinutes + fajrMinutes,
  };
};
