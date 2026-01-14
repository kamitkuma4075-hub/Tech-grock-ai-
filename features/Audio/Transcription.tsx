import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from '../../components/Spinner';
import { fileToBase64 } from '../../utils/fileUtils';

const Transcription: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ai, setAi] = useState<GoogleGenAI | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (process.env.API_KEY) {
            setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
        }
    }, []);
    
    const handleStartRecording = async () => {
        if (isRecording) return;
        setTranscribedText('');
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = handleTranscription;
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting recording:", err);
            setError("Microphone access was denied. Please enable it in your browser settings.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsLoading(true);
             // Stop the media stream tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleTranscription = useCallback(async () => {
        if (!ai || audioChunksRef.current.length === 0) {
            setIsLoading(false);
            return;
        }

        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const base64Audio = await fileToBase64(audioBlob);

            const audioPart = {
                inlineData: {
                    mimeType: audioBlob.type,
                    data: base64Audio,
                },
            };
            const textPart = { text: "Transcribe the following audio:" };
            
            const result = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts: [audioPart, textPart] },
            });
            setTranscribedText(result.text);

        } catch (err) {
            console.error("Transcription error:", err);
            setError("Failed to transcribe audio. Please try again.");
        } finally {
            setIsLoading(false);
            audioChunksRef.current = [];
        }
    }, [ai]);

    return (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-white">Audio Transcription</h2>
                <p className="text-gray-400">Record audio from your microphone and get a text transcription.</p>
            </header>

            <div className="flex flex-col items-center justify-center space-y-6">
                <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isLoading || !ai}
                    className={`w-40 h-40 rounded-full flex items-center justify-center transition-colors duration-300
                    ${isRecording ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'}
                    disabled:bg-gray-600 disabled:cursor-not-allowed text-white shadow-lg`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                        <path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 8v1a4 4 0 004 4 .5.5 0 010 1 5 5 0 01-5-5V8a.5.5 0 01.5-.5zM10 13a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 0110 13zM14.5 8.5a.5.5 0 01.5-.5H15a5 5 0 01-5 5 .5.5 0 010-1 4 4 0 004-4v-1a.5.5 0 01-.5-.5z" clipRule="evenodd" />
                    </svg>
                </button>
                 <p className="text-lg font-medium">
                    {isLoading ? "Transcribing..." : isRecording ? "Recording..." : "Tap to Record"}
                </p>
                {!ai && <p className="text-xs text-yellow-400 mt-2 text-center">API key not configured. Please set your API_KEY.</p>}
                {error && <p className="text-red-400 text-center mt-2">{error}</p>}
            </div>

            <div className="mt-8 bg-gray-800/50 rounded-lg p-6 flex-1 min-h-[200px]">
                <h3 className="text-lg font-semibold mb-4">Transcription Result</h3>
                <div className="overflow-y-auto h-full">
                    {isLoading && !transcribedText ? (
                        <div className="flex items-center justify-center h-full">
                            <Spinner />
                        </div>
                    ) : transcribedText ? (
                        <p className="text-gray-200 whitespace-pre-wrap">{transcribedText}</p>
                    ) : (
                        <p className="text-gray-500">Your transcription will appear here.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Transcription;