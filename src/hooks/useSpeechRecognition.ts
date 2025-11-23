import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SpeechRecognition, 
  SpeechRecognitionEvent, 
  SpeechRecognitionErrorEvent,
  SpeechRecognitionHookResult,
  getSpeechRecognitionConstructor 
} from '../types';

export const useSpeechRecognition = (): SpeechRecognitionHookResult => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = useRef(false);

  // Check browser support and initialize
  useEffect(() => {
    const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();
    
    if (SpeechRecognitionConstructor) {
      isSupported.current = true;
      recognitionRef.current = new SpeechRecognitionConstructor() as SpeechRecognition;
      
      const recognition = recognitionRef.current;
      
      // Configuration for better Japanese support
      recognition.continuous = false; // Set to false for better reliability
      recognition.interimResults = true; // Show real-time results
      recognition.maxAlternatives = 3; // Get multiple alternatives
      

      recognition.lang = navigator.language || 'en-US';

      
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('Speech recognition result:', event);
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcriptPart;
            maxConfidence = Math.max(maxConfidence, result[0].confidence || 0);
          } else {
            interimTranscript += transcriptPart;
          }
        }

        // Update transcript with both final and interim results
        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);
        setConfidence(maxConfidence);
        
        console.log('Transcript updated:', fullTranscript, 'Confidence:', maxConfidence);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error);
        setIsListening(false);
        
        // Handle specific errors
        switch (event.error) {
          case 'no-speech':
            setError('No speech detected. Please try again.');
            break;
          case 'audio-capture':
            setError('Audio capture failed. Check your microphone.');
            break;
          case 'not-allowed':
            setError('Microphone permission denied.');
            break;
          case 'network':
            setError('Network error. Please check your connection.');
            break;
          default:
            setError(`Speech recognition error: ${event.error}`);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    try {
      setError(null);
      setTranscript('');
      setConfidence(0);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setError('Failed to start speech recognition');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Failed to stop recognition:', error);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    isSupported: isSupported.current,
    startListening,
    stopListening,
    resetTranscript,
    error,
    confidence
  };
};