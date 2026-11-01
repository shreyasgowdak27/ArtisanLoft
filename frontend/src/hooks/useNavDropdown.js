import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useNavDropdown
 *
 * Manages a set of mutually-exclusive navbar panels (search, user menu,
 * mobile menu, …). At most one panel is open at a time.
 *
 * Returns:
 *   open        – name of the currently open panel, or null
 *   toggle(name)– opens that panel (closing any other); if it was already
 *                 open, closes it instead
 *   close()     – closes whatever is open
 *   ref         – attach to the navbar root <nav> so outside-clicks are
 *                 detected correctly
 */
export function useNavDropdown() {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);

  const close = useCallback(() => setOpen(null), []);

  const toggle = useCallback((name) => {
    setOpen((prev) => (prev === name ? null : name));
  }, []);

  useEffect(() => {
    // Close on pointerdown outside the navbar (works on touch too)
    function handlePointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(null);
      }
    }

    // Close on Escape
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(null);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return { open, toggle, close, ref };
}

