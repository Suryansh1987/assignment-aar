import { useState, useEffect, useCallback, useRef } from 'react';
import { Shirt, MapPin, Loader2, Send } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { VoiceInput } from './components/VoiceInput';
import { WeatherDisplay } from './components/WeatherDisplay';
import { OutfitSuggestions } from './components/OutfitSuggestions';
import { ChatMessage } from './components/ChatMessage';

interface WeatherData {
  location: string;
  description: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [location, setLocation] = useState('Tokyo');
  const [debouncedLocation, setDebouncedLocation] = useState('Tokyo');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [suggestions, setSuggestions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [hasVoiceQuery, setHasVoiceQuery] = useState(false);
  const [textInput, setTextInput] = useState('');

  const debounceTimer = useRef<NodeJS.Timeout>();

  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedLocation(location);
    }, 800);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [location]);

  useEffect(() => {
    if (!debouncedLocation.trim()) return;
    fetchWeatherOnly(debouncedLocation);
  }, [debouncedLocation]);

  const fetchWeatherOnly = async (loc: string) => {
    if (!hasVoiceQuery) {
      setIsLoading(true);
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('fashion-assistant', {
        body: {
          userQuery: null,
          location: loc,
          mode: 'weather-only',
        },
      });

      if (error) throw error;

      if (data && data.weather) {
        setWeatherData(data.weather);
        if (!hasVoiceQuery) {
          setShowResults(true);
        }
      }

      if (!hasVoiceQuery) {
        setSuggestions('');
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      
      if (!hasVoiceQuery) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Could not load weather for this location. Please try again.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      if (!hasVoiceQuery) {
        setIsLoading(false);
      }
    }
  };

  const handleUserInput = async (inputText: string) => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    setHasVoiceQuery(true);
    setShowResults(false);

    try {
      const { data, error } = await supabase.functions.invoke('fashion-assistant', {
        body: {
          userQuery: inputText,
          location: debouncedLocation,
        },
      });

      if (error) throw error;

      if (data) {
        if (data.weather) {
          setWeatherData(data.weather);
        }
        
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }

        if (data.conversationResponse) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.conversationResponse,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else if (data.suggestions) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'I prepared some outfit suggestions based on current weather!',
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
        
        setShowResults(true);
      } else {
        throw new Error('No data received from server');
      }
    } catch (error) {
      console.error('Query error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'An error occurred while processing your request. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setHasVoiceQuery(false);
    }
  };

  const handleVoiceInput = async (voiceText: string) => {
    await handleUserInput(voiceText);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      await handleUserInput(textInput);
      setTextInput('');
    }
  };

  const handleMouseDown = useCallback(() => {
    resetTranscript();
    startListening();
  }, [resetTranscript, startListening]);

  const handleMouseUp = useCallback(async () => {
    stopListening();
    
    setTimeout(async () => {
      const text = transcript.trim();
      if (text) {
        await handleVoiceInput(text);
      }
    }, 300);
  }, [stopListening, transcript, handleVoiceInput]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseDown();
  }, [handleMouseDown]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  return (
    <div className="min-h-screen gradient-orange-bg">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shirt className="w-12 h-12 text-orange" />
            <h1 className="text-5xl font-bold gradient-orange-text">
              Fashion Weather Assistant
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Use your voice or type to get outfit ideas tailored to today&apos;s weather.
          </p>
        </header>

        <div className="mb-8 flex justify-center gap-4 items-center">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter a location"
              className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange focus:outline-none transition-colors w-64"
            />
            {location !== debouncedLocation && (
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Updating...
                </span>
              </div>
            )}
          </div>
        </div>

        {messages.length === 0 && !weatherData && !isLoading && (
          <div className="bg-white rounded-2xl shadow-orange-lg p-12 mb-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                How to use
              </h2>
              <div className="space-y-4 text-left text-gray-600">
                <p>1. Enter or confirm your location.</p>
                <p>2. <strong>Hold</strong> the mic button and speak, or <strong>type</strong> your question.</p>
                <p className="text-sm text-gray-500 pl-6">
                  Example: &quot;What should I wear today?&quot; or &quot;How is the weather?&quot;
                </p>
                <p>3. Get outfit suggestions or weather information instantly.</p>
              </div>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-orange-lg p-6 mb-8 max-h-96 overflow-y-auto scrollbar-orange">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  onSendMessage={handleUserInput}
                  isLoading={isLoading}
                  showInput={index === messages.length - 1 && message.role === 'assistant'}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-6 mb-8">
          <VoiceInput
            isListening={isListening}
            isSupported={isSupported}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
          
          {messages.length === 0 && (
            <>
              <div className="text-gray-500 text-sm">or</div>
              
              <form onSubmit={handleTextSubmit} className="w-full max-w-md">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your question here..."
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !textInput.trim()}
                    className="gradient-orange-button text-white px-6 py-3 rounded-lg hover:shadow-orange transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {isListening && transcript && (
          <div className="flex justify-center mb-4">
            <div className="bg-orange-light border border-orange-light rounded-lg p-4 max-w-md">
              <p className="text-orange-dark text-sm">
                <strong>Listening:</strong> {transcript}
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-orange animate-spin" />
            <span className="ml-4 text-gray-600 text-lg">Analyzing...</span>
          </div>
        )}

        {weatherData && !isLoading && showResults && (
          <div className="space-y-8">
            <WeatherDisplay weather={weatherData} />
            {suggestions && (
              <OutfitSuggestions suggestions={suggestions} />
            )}
          </div>
        )}

        <footer className="text-center mt-16 text-gray-500 text-sm">
          <p>Powered by OpenWeather API &amp; Gemini AI</p>
        </footer>
      </div>
    </div>
  );
}

export default App;