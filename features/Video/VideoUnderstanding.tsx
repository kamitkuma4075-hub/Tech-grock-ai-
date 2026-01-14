import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from '../../components/Spinner';
import Uploader from '../../components/Uploader';
import { fileToBase64 } from '../../utils/fileUtils';

const VideoUnderstanding: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    if (process.env.API_KEY) {
      setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
    }
  }, []);

  const handleFileChange = (file: File) => {
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setResponse(null);
    setError(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !videoFile || isLoading || !ai) return;

    setIsLoading(true);
    setResponse(null);
    setError(null);

    try {
        const base64Video = await fileToBase64(videoFile);
        
        const videoPart = {
            inlineData: {
                mimeType: videoFile.type,
                data: base64Video,
            },
        };
        const textPart = { text: prompt };

        const result = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [videoPart, textPart] },
            config: {
                systemInstruction: "You are a professional AI assistant specializing in video analysis. Provide a detailed, professional, and accurate analysis based on the user's query about the video."
            }
        });

        setResponse(result.text);

    } catch (err) {
      console.error("Video analysis error:", err);
      setError("An error occurred during analysis. The video may be too long or in an unsupported format.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Video Analysis</h2>
        <p className="text-gray-400">Upload a video and ask Gemini Pro to find key information.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="flex flex-col space-y-4">
            {!videoFile ? (
                 <Uploader
                    onFileUpload={handleFileChange}
                    accept="video/*"
                    title="Upload or drop a video"
                    description="MP4, MOV, WEBM up to 2 minutes"
                 />
            ) : (
                <div className="relative">
                    <video src={videoUrl!} controls className="w-full rounded-lg shadow-md" />
                    <button
                        onClick={() => { setVideoFile(null); setVideoUrl(null); }}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}
             {videoFile && (
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
                    <textarea
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Summarize this video', 'What is the main topic?'"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        disabled={isLoading || !ai}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !prompt.trim() || !ai}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors flex items-center justify-center space-x-2"
                    >
                        {isLoading && <Spinner />}
                        <span>{isLoading ? 'Analyzing...' : 'Ask Gemini'}</span>
                    </button>
                </form>
            )}
        </div>
        <div className="bg-gray-800/50 rounded-lg p-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Analysis Result</h3>
            <div className="flex-1 overflow-y-auto">
                {isLoading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Spinner />
                            <p className="mt-4 text-gray-400">Gemini Pro is analyzing the video...</p>
                        </div>
                    </div>
                )}
                {error && <p className="text-red-400">{error}</p>}
                {response && <p className="text-gray-200 whitespace-pre-wrap">{response}</p>}
                {!isLoading && !error && !response && (
                    <p className="text-gray-500 text-center self-center">The analysis will appear here.</p>
                )}
            </div>
             {!ai && <p className="text-xs text-yellow-400 mt-2 text-center">API key not configured. Please set your API_KEY.</p>}
        </div>
      </div>
    </div>
  );
};

export default VideoUnderstanding;