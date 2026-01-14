import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Spinner from '../../components/Spinner';
import Uploader from '../../components/Uploader';
import { fileToBase64 } from '../../utils/fileUtils';

const ImageEditing: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [editedUrl, setEditedUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    if (process.env.API_KEY) {
      setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
    }
  }, []);

  const handleFileChange = (file: File) => {
    setOriginalFile(file);
    setOriginalUrl(URL.createObjectURL(file));
    setEditedUrl(null);
    setError(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !originalFile || isLoading || !ai) return;

    setIsLoading(true);
    setEditedUrl(null);
    setError(null);

    try {
        const base64Image = await fileToBase64(originalFile);
        
        const imagePart = {
            inlineData: {
                mimeType: originalFile.type,
                data: base64Image,
            },
        };
        const textPart = { text: prompt };

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const part = result.candidates?.[0]?.content?.parts[0];
        if (part && part.inlineData) {
            const base64EditedImage = part.inlineData.data;
            setEditedUrl(`data:${part.inlineData.mimeType};base64,${base64EditedImage}`);
        } else {
             setError("No edited image was returned. The model might not have understood the request.");
        }

    } catch (err) {
      console.error("Image editing error:", err);
      setError("An error occurred while editing the image. Please try a different prompt or image.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetState = () => {
      setOriginalFile(null);
      setOriginalUrl(null);
      setEditedUrl(null);
      setError(null);
      setPrompt('');
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Image Editing</h2>
        <p className="text-gray-400">Describe the changes you want to make to your image.</p>
      </header>
      
      {!originalFile ? (
        <Uploader
            onFileUpload={handleFileChange}
            accept="image/*"
            title="Upload an image to edit"
            description="PNG, JPG, WEBP"
        />
      ) : (
        <div className="flex-1 flex flex-col">
            <form onSubmit={handleSubmit} className="mb-6 flex flex-col md:flex-row items-start gap-4">
                <textarea
                    rows={2}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Add a retro filter, remove the person in the background"
                    className="flex-1 w-full bg-gray-800 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    disabled={isLoading || !ai}
                />
                <div className="flex w-full md:w-auto gap-2">
                 <button
                    type="submit"
                    disabled={isLoading || !prompt.trim() || !ai}
                    className="flex-1 bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors flex items-center justify-center space-x-2"
                >
                    {isLoading && <Spinner />}
                    <span>{isLoading ? 'Editing...' : 'Apply Edit'}</span>
                </button>
                 <button type="button" onClick={resetState} className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-3 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>
                 </button>
                </div>
            </form>
             {!ai && <p className="text-xs text-yellow-400 mb-4 text-center">API key not configured. Please set your API_KEY.</p>}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-2">Original</h3>
                    <img src={originalUrl!} alt="Original upload" className="w-full rounded-lg shadow-md object-contain" />
                </div>
                <div className="flex flex-col items-center bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Edited</h3>
                    <div className="w-full h-full flex items-center justify-center">
                        {isLoading && (
                            <div className="text-center">
                                <Spinner />
                                <p className="mt-4 text-gray-400">Applying your edits...</p>
                            </div>
                        )}
                        {error && <p className="text-red-400 text-center">{error}</p>}
                        {editedUrl && <img src={editedUrl} alt="Edited result" className="w-full rounded-lg shadow-md object-contain" />}
                        {!isLoading && !editedUrl && !error && <p className="text-gray-500">Your edited image will appear here.</p>}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageEditing;
