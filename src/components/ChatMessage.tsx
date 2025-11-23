import { User, Bot, Send } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  showInput?: boolean;
}

export const ChatMessage = ({ 
  role, 
  content, 
  onSendMessage, 
  isLoading = false,
  showInput = false 
}: ChatMessageProps) => {
  const [inputText, setInputText] = useState('');
  const isUser = role === 'user';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && onSendMessage && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="space-y-3">
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-orange-button flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
        )}

        <div
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            isUser
              ? 'gradient-black-button text-white'
              : 'bg-white text-gray-800 shadow-orange border border-orange-light'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>

        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-black-button flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {showInput && onSendMessage && (
        <div className="flex justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange focus:outline-none transition-colors text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="gradient-orange-button text-white px-4 py-2 rounded-lg hover:shadow-orange transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};