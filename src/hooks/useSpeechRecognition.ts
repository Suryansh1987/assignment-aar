import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition() as SpeechRecognitionInstance;
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US'; // changed to English if preferred

      recognitionInstance.addEventListener('result', (event: Event) => {
        const speechEvent = event as SpeechRecognitionEvent;
        const transcript = Array.from(speechEvent.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');
        setTranscript(transcript);
      });

      recognitionInstance.addEventListener('end', () => {
        setIsListening(false);
      });

      recognitionInstance.addEventListener('error', (event: Event) => {
        const errorEvent = event as SpeechRecognitionErrorEvent;
        console.error('Speech recognition error:', errorEvent.error);
        setIsListening(false);
      });

      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript('');
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  // New method to clear the transcript manually
  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,  // added here
  };
};
