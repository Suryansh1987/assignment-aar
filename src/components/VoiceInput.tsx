import { Mic } from 'lucide-react';

interface VoiceInputProps {
  isListening: boolean;
  isSupported: boolean;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export const VoiceInput = ({
  isListening,
  isSupported,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
}: VoiceInputProps) => {
  if (!isSupported) {
    return (
      <div className="text-center p-4 bg-orange-50 border border-orange-light rounded-lg">
        <p className="text-orange-dark">
          Your browser does not support voice input.<br />
          Please try Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <button
        aria-label={isListening ? "Recording..." : "Hold to speak"}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-orange-lg transition-all duration-300 select-none ${
          isListening
            ? 'gradient-black-button animate-pulse-orange scale-110'
            : 'gradient-orange-button hover:scale-105 active:scale-95'
        }`}
        style={{ touchAction: 'none' }}
      >
        <Mic className="w-8 h-8 text-white" />
        
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-orange-400 animate-ping opacity-75"></div>
        )}
      </button>

      <span className="mt-3 text-sm text-gray-600 text-center">
        {isListening ? (
          <span className="text-orange-dark font-semibold">
            🔴 Recording... Release to send
          </span>
        ) : (
          <span>
            Hold to speak
          </span>
        )}
      </span>

      <div className="mt-2 text-xs text-gray-500 text-center max-w-xs">
        {!isListening && (
          <>
            <p>Press and hold the microphone</p>
            <p>Speak your request and release</p>
          </>
        )}
      </div>
    </div>
  );
};