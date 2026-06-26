import { useState, useEffect } from 'react';

const PHRASES = [
  'I have a meeting at 3 and a dinner at 8, plan my day',
  'Add review design mockups to my task list',
  'I need to submit the report by Friday night, critical',
  'Remind me to call mom this evening',
  'Break down my project presentation into steps',
  'What should I focus on right now?',
];

export function useTypewriterPlaceholder(speed = 55, pause = 1800) {
  const [displayed, setDisplayed] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = PHRASES[phraseIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayed(current.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
        if (charIndex + 1 === current.length) {
          setTimeout(() => setIsDeleting(true), pause);
        }
      } else {
        setDisplayed(current.slice(0, charIndex - 1));
        setCharIndex((c) => c - 1);
        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setPhraseIndex((i) => (i + 1) % PHRASES.length);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, speed, pause]);

  return displayed;
}
