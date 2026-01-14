import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import Spinner from '../../components/Spinner';

type ChatRole = 'user' | 'model';
type ChatMode = 'flash' | 'flash-lite' | 'pro' | 'search';

interface Message {
  role: ChatRole;
  text: string;
  sources?: GroundingChunk[];
}

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

const ChatFeature: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('flash');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    if (process.env.API_KEY) {
      setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const getModelName = useCallback(() => {
    switch (mode) {
      case 'flash': return 'gemini-3-flash-preview';
      case 'flash-lite': return 'gemini-flash-lite-latest';
      case 'pro': return 'gemini-3-pro-preview';
      case 'search': return 'gemini-3-flash-preview';
      default: return 'gemini-3-flash-preview';
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !ai) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const model = getModelName();
      const config: any = {
        systemInstruction: "You are a professional AI assistant named Tech Grock AI. Provide clear, structured, and helpful answers to all questions."
      };
      if (mode === 'pro') {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }
      if (mode === 'search') {
        config.tools = [{ googleSearch: {} }];
      }

      const responseStream = await ai.models.generateContentStream({
        model,
        contents: input,
        config
      });

      let modelResponse: Message = { role: 'model', text: '', sources: [] };
      setMessages(prev => [...prev, modelResponse]);

      for await (const chunk of responseStream) {
        const newText = chunk.text;
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;

        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'model') {
            const updatedMessage = {
              ...lastMessage,
              text: lastMessage.text + newText,
              sources: groundingMetadata?.groundingChunks || lastMessage.sources,
            };
            return [...prev.slice(0, -1), updatedMessage];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error generating content:", error);
      const errorMessage: Message = { role: 'model', text: 'Sorry, something went wrong. Please try again.' };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const playTTS = async (text: string) => {
    if (!ai || !text) return;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        audio.play();
      }
    } catch (error) {
      console.error("TTS Error:", error);
    }
  };


  const modeConfig = {
    'flash': { name: 'Flash', description: 'Fast and versatile for most tasks.', icon: '⚡️' },
    'flash-lite': { name: 'Flash-Lite', description: 'For low-latency, quick responses.', icon: '💨' },
    'pro': { name: 'Pro', description: 'Advanced reasoning for complex problems.', icon: '🧠' },
    'search': { name: 'Search', description: 'Up-to-date info with web grounding.', icon: '🌐' }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
        <header className="p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold">AI Chat</h2>
            <div className="flex space-x-2 mt-2">
                {Object.entries(modeConfig).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => setMode(key as ChatMode)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${mode === key ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        title={config.description}
                    >
                        {config.icon} {config.name}
                    </button>
                ))}
            </div>
        </header>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl p-4 rounded-2xl shadow-md ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.role === 'model' && msg.text && (
                 <button onClick={() => playTTS(msg.text)} className="mt-2 text-indigo-300 hover:text-indigo-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                </button>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-2 border-t border-gray-600">
                  <h4 className="text-xs font-semibold text-gray-400 mb-1">Sources:</h4>
                  <ul className="text-xs space-y-1">
                    {msg.sources.map((source, i) => source.web && (
                      <li key={i}>
                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline truncate">
                           {i+1}. {source.web.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="max-w-xl p-4 rounded-2xl shadow-md bg-gray-700 text-gray-200 rounded-bl-none flex items-center space-x-2">
              <Spinner /> <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask anything in ${modeConfig[mode].name} mode...`}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            disabled={isLoading || !ai}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !ai}
            className="bg-indigo-600 text-white font-semibold py-3 px-5 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
          >
            Send
          </button>
        </form>
         {!ai && <p className="text-xs text-yellow-400 mt-2 text-center">API key not configured. Please set your API_KEY.</p>}
      </div>
    </div>
  );
};

export default ChatFeature;