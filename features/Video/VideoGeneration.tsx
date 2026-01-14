import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from '../../components/Spinner';
import Uploader from '../../components/Uploader';
import { fileToBase64 } from '../../utils/fileUtils';
import { useApiKey } from '../../components/ApiKeySelector';

type AspectRatio = "16:9" | "9:16";
type GenerationMode = "text-to-video" | "image-to-video";

const VideoGeneration: React.FC = () => {
  const [mode, setMode] = useState<GenerationMode>('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { resetApiKey } = useApiKey();
  
  const handleFileChange = (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || (!prompt.trim() && mode === 'text-to-video')) return;

    setIsLoading(true);
    setGeneratedVideoUrl(null);
    setError(null);
    setLoadingMessage('Initializing video generation...');
    
    // Create new instance to get latest key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio,
        },
      };

      if (mode === 'image-to-video' && imageFile) {
        const base64Image = await fileToBase64(imageFile);
        payload.image = {
          imageBytes: base64Image,
          mimeType: imageFile.type,
        };
      }
      
      let operation = await ai.models.generateVideos(payload);
      setLoadingMessage('Video generation in progress... This can take several minutes.');
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        setLoadingMessage('Checking status...');
        operation = await ai.operations.getVideosOperation({ operation });
      }

      setLoadingMessage('Finalizing video...');
      
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

      if (downloadLink) {
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        setGeneratedVideoUrl(URL.createObjectURL(videoBlob));
      } else {
        throw new Error('Video generation finished, but no download link was provided.');
      }
    } catch (err: any) {
      console.error("Video generation error:", err);
       if (err.message && err.message.includes("Requested entity was not found.")) {
          resetApiKey();
       } else {
          setError("An error occurred while generating the video. Please check the console.");
       }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Video Generation with Veo</h2>
        <p className="text-gray-400">Bring your ideas to life. Generate videos from text or images.</p>
      </header>

      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-center mb-6 border-b border-gray-700">
            <button onClick={() => setMode('text-to-video')} className={`px-4 py-2 text-lg font-medium ${mode === 'text-to-video' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>Text-to-Video</button>
            <button onClick={() => setMode('image-to-video')} className={`px-4 py-2 text-lg font-medium ${mode === 'image-to-video' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>Image-to-Video</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            {mode === 'image-to-video' && (
                <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Starting Image</label>
                    {!imageFile ? (
                        <Uploader onFileUpload={handleFileChange} accept="image/*" title="Upload an initial image" description="PNG, JPG, WEBP"/>
                    ) : (
                         <div className="relative w-full max-w-sm mx-auto">
                            <img src={imageUrl!} alt="upload" className="w-full rounded-lg" />
                             <button type="button" onClick={() => {setImageFile(null); setImageUrl(null)}} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white">X</button>
                         </div>
                    )}
                </div>
            )}
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
                Prompt {mode === 'image-to-video' && '(optional)'}
              </label>
              <textarea
                id="prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A futuristic city with flying cars at sunset"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-1">
                Aspect Ratio
              </label>
              <select
                id="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                disabled={isLoading}
              >
                <option value="16:9">Landscape (16:9)</option>
                <option value="9:16">Portrait (9:16)</option>
              </select>
            </div>
            <button type="submit" disabled={isLoading || (mode === 'image-to-video' && !imageFile)}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading && <Spinner />}
              <span>{isLoading ? 'Generating...' : 'Generate Video'}</span>
            </button>
        </form>

        <div className="flex-1 flex items-center justify-center bg-gray-800/50 rounded-lg p-4 min-h-[300px]">
            {isLoading && (
                <div className="text-center">
                    <Spinner />
                    <p className="mt-4 text-gray-400">{loadingMessage}</p>
                </div>
            )}
            {error && <p className="text-red-400 text-center">{error}</p>}
            {generatedVideoUrl && (
                <video src={generatedVideoUrl} controls autoPlay loop className="max-w-full rounded-lg shadow-lg" />
            )}
            {!isLoading && !error && !generatedVideoUrl && (
                <p className="text-gray-500">Your generated video will appear here.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration;