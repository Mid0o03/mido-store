import React, { useState, useEffect } from 'react';

const GlitchText = ({ text, className }) => {
    const [displayText, setDisplayText] = useState(text);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

    const scramble = () => {
        let iterations = 0;
        const interval = setInterval(() => {
            setDisplayText(
                text.split('')
                    .map((letter, index) => {
                        if (index < iterations) {
                            return text[index];
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('')
            );

            if (iterations >= text.length) {
                clearInterval(interval);
            }

            iterations += 1 / 3;
        }, 30);
    };

    return (
        <span
            className={className}
            onMouseEnter={scramble}
            onTouchStart={scramble} // Mobile support
        >
            {displayText}
        </span>
    );
};

export default GlitchText;
