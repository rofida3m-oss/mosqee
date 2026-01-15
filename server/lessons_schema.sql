-- Educational Lessons System Tables

-- Table for educational lessons (Hadith and Quran)
CREATE TABLE IF NOT EXISTS educational_lessons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK(category IN ('hadith', 'quran')),
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    
    -- For Hadith lessons
    hadith_text TEXT,
    hadith_narrator TEXT,
    hadith_explanation TEXT,
    hadith_lessons TEXT,
    
    -- For Quran lessons
    quran_verses TEXT,
    quran_surah TEXT,
    quran_verse_numbers TEXT,
    quran_word_meanings TEXT, -- JSON format
    quran_tafseer TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for lesson questions
CREATE TABLE IF NOT EXISTS lesson_questions (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON array
    correct_answer INTEGER NOT NULL,
    explanation TEXT,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES educational_lessons(id) ON DELETE CASCADE
);

-- Table for user lesson progress
CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    status TEXT DEFAULT 'locked' CHECK(status IN ('locked', 'unlocked', 'in_progress', 'completed')),
    quiz_score INTEGER DEFAULT 0,
    quiz_total INTEGER DEFAULT 0,
    quiz_attempts INTEGER DEFAULT 0,
    completed_at DATETIME,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES educational_lessons(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_educational_lessons_category ON educational_lessons(category, order_index);
CREATE INDEX IF NOT EXISTS idx_lesson_questions_lesson ON lesson_questions(lesson_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON user_lesson_progress(user_id, lesson_id);
