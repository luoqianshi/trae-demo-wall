import { Bot, User } from 'lucide-react';

export default function ConversationBubble({ message, compact = false }) {
  const isAI = message.type === 'ai';
  
  if (compact) {
    return (
      <div className={`flex gap-2 items-start`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          isAI ? 'bg-primary/20' : 'bg-gray-700'
        }`}>
          {isAI ? (
            <Bot size={12} className="text-primary" />
          ) : (
            <User size={12} className="text-gray-300" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={`inline-block px-3 py-1.5 rounded-lg text-sm ${
            isAI 
              ? 'bg-primary/20 text-white' 
              : 'bg-gray-700 text-white'
          }`}>
            <p className="text-xs truncate">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isAI ? 'bg-primary/20' : 'bg-gray-700'
      }`}>
        {isAI ? (
          <Bot size={16} className="text-primary" />
        ) : (
          <User size={16} className="text-gray-300" />
        )}
      </div>
      
      <div className={`max-w-[75%] ${isAI ? '' : 'text-right'}`}>
        <div className={`inline-block px-4 py-2 rounded-2xl ${
          isAI 
            ? 'bg-primary/20 text-white rounded-tl-sm' 
            : 'bg-gray-700 text-white rounded-tr-sm'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isAI ? '' : 'text-right'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}