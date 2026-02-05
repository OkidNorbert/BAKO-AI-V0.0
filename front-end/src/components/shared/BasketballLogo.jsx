import React from 'react';

const BasketballLogo = ({ className = "h-8 w-8", color = "currentColor" }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Simplified Court Background */}
            <path
                d="M10 85 L90 85 M20 85 Q50 65 80 85 M50 85 L50 75"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.3"
            />

            {/* Net Mesh */}
            <path
                d="M36 42 L42 62 L58 62 L64 42"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.4"
            />
            <path
                d="M40 42 L45 62 M45 42 L50 62 M50 42 L55 62 M55 42 L60 62 M60 42 L63 55 M37 55 L40 42"
                stroke={color}
                strokeWidth="1"
                opacity="0.3"
            />

            {/* Hoop/Rim */}
            <ellipse
                cx="50"
                cy="42"
                rx="18"
                ry="5"
                stroke="#ef4444"
                strokeWidth="4"
            />

            {/* The Ball - Perfectly positioned entering the hoop */}
            <g className="animate-bounce-subtle">
                <circle cx="50" cy="32" r="10" fill="#f97316" />
                {/* Basketball lines */}
                <path
                    d="M43 27 Q50 32 57 27 M43 37 Q50 32 57 37 M50 22 L50 42"
                    stroke="#411e08"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
                <path
                    d="M40 32 Q50 32 60 32"
                    stroke="#411e08"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                />
            </g>

            {/* Swish/Motion Lines */}
            <g opacity="0.8">
                <path d="M30 20 L35 25" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                <path d="M70 20 L65 25" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                <path d="M50 12 L50 18" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
            </g>
        </svg>
    );
};

export default BasketballLogo;
