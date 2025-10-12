import { useEffect } from 'react';
import { useSound } from '@/contexts/SoundContext';

export const useClickSound = () => {
  const { playClickSound, settings } = useSound();

  useEffect(() => {
    if (!settings.enabled || !settings.clickSounds) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the clicked element is interactive
      const isInteractive = target.matches(`
        button,
        a,
        [role="button"],
        [role="link"],
        [role="tab"],
        [role="menuitem"],
        input[type="button"],
        input[type="submit"],
        input[type="reset"],
        .clickable,
        [data-clickable="true"]
      `) || target.closest(`
        button,
        a,
        [role="button"],
        [role="link"],
        [role="tab"],
        [role="menuitem"],
        input[type="button"],
        input[type="submit"],
        input[type="reset"],
        .clickable,
        [data-clickable="true"]
      `);

      if (isInteractive) {
        playClickSound();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [playClickSound, settings.enabled, settings.clickSounds]);
};