// ==================== EDUCATIONAL LESSONS ENDPOINTS ====================
// Get all lessons with user progress
app.get('/api/educational-lessons', async (req, res) => {
    try {
        const { userId } = req.query;
        const lessons = await db.getAllEducationalLessons();

        if (userId) {
            // Initialize progress for new users
            await db.initializeUserLessonProgress(userId);

            // Get user progress for all lessons
            const progressList = await db.getAllUserLessonProgress(userId);
            const progressMap = {};
            progressList.forEach(p => {
                progressMap[p.lesson_id] = p;
            });

            // Merge lessons with progress
            const lessonsWithProgress = lessons.map(lesson => ({
                ...lesson,
                progress: progressMap[lesson.id] || { status: 'locked' }
            }));

            res.json(lessonsWithProgress);
        } else {
            res.json(lessons);
        }
    } catch (error) {
        console.error('Error fetching educational lessons:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single lesson details
app.get('/api/educational-lessons/:lessonId', async (req, res) => {
    try {
        const { userId } = req.query;
        const lesson = await db.getEducationalLesson(req.params.lessonId);

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        if (userId) {
            const progress = await db.getUserLessonProgress(userId, req.params.lessonId);
            lesson.progress = progress || { status: 'locked' };
        }

        res.json(lesson);
    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get lesson questions
app.get('/api/educational-lessons/:lessonId/questions', async (req, res) => {
    try {
        const questions = await db.getLessonQuestions(req.params.lessonId);
        res.json(questions);
    } catch (error) {
        console.error('Error fetching lesson questions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start lesson (mark as in_progress)
app.post('/api/educational-lessons/:lessonId/start', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Check if lesson is unlocked
        const progress = await db.getUserLessonProgress(userId, req.params.lessonId);

        if (!progress || progress.status === 'locked') {
            return res.status(403).json({ error: 'Lesson is locked' });
        }

        // Update to in_progress
        await db.updateLessonProgress(userId, req.params.lessonId, {
            status: 'in_progress'
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error starting lesson:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit quiz results
app.post('/api/educational-lessons/:lessonId/submit-quiz', async (req, res) => {
    try {
        const { userId, answers } = req.body;

        if (!userId || !answers) {
            return res.status(400).json({ error: 'userId and answers are required' });
        }

        // Get questions to check answers
        const questions = await db.getLessonQuestions(req.params.lessonId);

        // Calculate score
        let correctCount = 0;
        answers.forEach((answer, index) => {
            if (questions[index] && answer === questions[index].correct_answer) {
                correctCount++;
            }
        });

        const totalQuestions = questions.length;
        const passed = correctCount === totalQuestions; // 100% required

        // Get current progress to increment attempts
        const currentProgress = await db.getUserLessonProgress(userId, req.params.lessonId);
        const attempts = (currentProgress?.quiz_attempts || 0) + 1;

        // Update progress
        const newStatus = passed ? 'completed' : 'in_progress';
        await db.updateLessonProgress(userId, req.params.lessonId, {
            status: newStatus,
            quiz_score: correctCount,
            quiz_total: totalQuestions,
            quiz_attempts: attempts
        });

        // If passed, unlock next lesson
        if (passed) {
            const lesson = await db.getEducationalLesson(req.params.lessonId);
            const nextLesson = await db.unlockNextLesson(userId, lesson.order_index);

            res.json({
                success: true,
                passed: true,
                score: correctCount,
                total: totalQuestions,
                nextLessonUnlocked: !!nextLesson,
                nextLesson: nextLesson
            });
        } else {
            res.json({
                success: true,
                passed: false,
                score: correctCount,
                total: totalQuestions,
                attempts: attempts
            });
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user progress for all lessons
app.get('/api/users/:userId/lesson-progress', async (req, res) => {
    try {
        await db.initializeUserLessonProgress(req.params.userId);
        const progress = await db.getAllUserLessonProgress(req.params.userId);
        res.json(progress);
    } catch (error) {
        console.error('Error fetching user lesson progress:', error);
        res.status(500).json({ error: error.message });
    }
});
