import { useEffect } from 'react';

export default function useFocusSearchBar() {
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        const focusEl = document.getElementById('search');
        if (focusEl) {
          focusEl.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', onKeydown);

    return () => {
      window.removeEventListener('keydown', onKeydown);
    };
  }, []);
}
