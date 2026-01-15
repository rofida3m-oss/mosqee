import React from 'react';

interface CircularProgressProps {
    value: number;
    max: number;
    size?: number;
    strokeWidth?: number;
    children?: React.ReactNode;
    color?: string;
    showCheckOnComplete?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    value,
    max,
    size = 60,
    strokeWidth = 4,
    children,
    color = "text-emerald-500",
    showCheckOnComplete = false
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(value / max, 1);
    const strokeDashoffset = circumference - progress * circumference;

    const isComplete = value >= max;
    const finalColor = isComplete && showCheckOnComplete ? "text-emerald-500" : color;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90 origin-center transition-all duration-300"
            >
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-stone-100"
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-300 ease-out ${finalColor} ${isComplete ? 'drop-shadow-sm' : ''}`}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
};
