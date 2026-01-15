import confetti from 'canvas-confetti';

export const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#10b981', '#fbbf24', '#f59e0b'] // Emerald and Amber
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#10b981', '#fbbf24', '#f59e0b']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };

    frame();
};

export const triggerWinConfetti = () => {
    const end = Date.now() + 1000;

    const colors = ['#10b981', '#fbbf24'];

    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
};

export const triggerSmallBurst = () => {
    confetti({
        particleCount: 30,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#fbbf24', '#34d399']
    });
};
