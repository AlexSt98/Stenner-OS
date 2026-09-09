export function speakText(text: string) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
  return true;
}

export const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
