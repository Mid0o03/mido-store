import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal — renders children directly in document.body,
 * escaping any parent stacking context (sidebar, transforms, etc.)
 */
const Portal = ({ children }) => {
    const el = useRef(document.createElement('div'));

    useEffect(() => {
        const portalRoot = el.current;
        document.body.appendChild(portalRoot);
        return () => {
            document.body.removeChild(portalRoot);
        };
    }, []);

    return createPortal(children, el.current);
};

export default Portal;
