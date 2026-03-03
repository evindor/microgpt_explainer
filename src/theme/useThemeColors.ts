import { useState, useEffect } from 'react';

/**
 * Hook that returns resolved CSS variable values as plain strings.
 * Re-resolves whenever the data-theme attribute changes.
 *
 * Usage:
 *   const colors = useThemeColors(['--accent-cyan', '--accent-amber']);
 *   // colors['--accent-cyan'] → 'rgb(34, 211, 238)'
 */
export function useThemeColors(vars: string[]): Record<string, string> {
  const [colors, setColors] = useState<Record<string, string>>({});

  useEffect(() => {
    function resolve() {
      const style = getComputedStyle(document.documentElement);
      const result: Record<string, string> = {};
      for (const v of vars) {
        result[v] = style.getPropertyValue(v).trim();
      }
      setColors(result);
    }

    resolve();

    // Watch for data-theme attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          resolve();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [vars]);

  return colors;
}
