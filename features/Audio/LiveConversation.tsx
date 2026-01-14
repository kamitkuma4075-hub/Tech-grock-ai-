import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, Modality, LiveServerMessage } from '@google/genai';
import { createPcmBlob, decode, decodeAudioData } from '../../utils/audioUtils';
// FIX: Imported Spinner component
import Spinner from '../../components/Spinner';

type TranscriptionEntry = {
    speaker: 'You' | 'Gemini';
    text: string;
};

const LiveConversation: React.FC = () => {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');


    useEffect(() => {
        if (process.env.API_KEY) {
            setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
        }
        return () => {
             stopSession();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startSession = useCallback(async () => {
        if (!ai || isConnecting || isSessionActive) return;

        setIsConnecting(true);
        setError(null);
        setTranscription([]);
        
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        const inputAudioContext = inputAudioContextRef.current;
                        if (!inputAudioContext || !streamRef.current) return;
                        
                        mediaStreamSourceRef.current = inputAudioContext.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContext.destination);
                        
                        setIsConnecting(false);
                        setIsSessionActive(true);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription?.text) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription?.text) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }

                        if(message.serverContent?.turnComplete) {
                            if(currentInputTranscriptionRef.current) {
                                setTranscription(prev => [...prev, {speaker: 'You', text: currentInputTranscriptionRef.current}]);
                                currentInputTranscriptionRef.current = '';
                            }
                            if(currentOutputTranscriptionRef.current) {
                                setTranscription(prev => [...prev, {speaker: 'Gemini', text: currentOutputTranscriptionRef.current}]);
                                currentOutputTranscriptionRef.current = '';
                            }
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onclose: () => {
                        stopSession(false);
                    },
                    onerror: (e) => {
                        console.error('Session error:', e);
                        setError('A session error occurred. The connection may have been lost.');
                        stopSession(false);
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                },
            });
        } catch (err) {
            console.error("Failed to start session:", err);
            setError("Could not get microphone permissions. Please allow access and try again.");
            setIsConnecting(false);
        }
    }, [ai, isConnecting, isSessionActive]);

    const stopSession = useCallback((closePromise = true) => {
        if(closePromise) {
            sessionPromiseRef.current?.then(s => s.close());
        }
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamSourceRef.current = null;
        
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        for (const source of audioSourcesRef.current.values()) {
          source.stop();
        }
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        
        setIsSessionActive(false);
        setIsConnecting(false);
    }, []);

    return (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-white">Live Conversation</h2>
                <p className="text-gray-400">Speak with Gemini in real-time. Transcription will appear below.</p>
            </header>

            <div className="flex flex-col items-center justify-center space-y-6">
                <button
                    onClick={isSessionActive ? stopSession : startSession}
                    disabled={isConnecting || !ai}
                    className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300
                    ${isSessionActive ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'}
                    disabled:bg-gray-600 disabled:cursor-not-allowed text-white shadow-lg`}
                >
                    {isConnecting ? <Spinner /> : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path fillRule="evenodd" d="M5.5 8.5A.5.5 0 016 8v1a4 4 0 004 4 .5.5 0 010 1 5 5 0 01-5-5V8a.5.5 0 01.5-.5zM10 13a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 0110 13zM14.5 8.5a.5.5 0 01.5-.5H15a5 5 0 01-5 5 .5.5 0 010-1 4 4 0 004-4v-1a.5.5 0 01-.5-.5z" clipRule="evenodd" />
                        </svg>
                    )}
                     {isSessionActive && <span className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></span>}
                </button>
                <p className="text-lg font-medium">
                    {isConnecting ? "Connecting..." : isSessionActive ? "Conversation Active" : "Tap to Start"}
                </p>
                {!ai && <p className="text-xs text-yellow-400 mt-2 text-center">API key not configured. Please set your API_KEY.</p>}
                {error && <p className="text-red-400 text-center mt-2">{error}</p>}
            </div>

            <div className="mt-8 bg-gray-800/50 rounded-lg p-4 flex-1 min-h-[200px] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Transcription</h3>
                <div className="space-y-4">
                    {transcription.length > 0 ? transcription.map((entry, index) => (
                        <div key={index} className={`flex ${entry.speaker === 'You' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`px-4 py-2 rounded-lg max-w-lg ${entry.speaker === 'You' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                                <span className="font-bold text-sm">{entry.speaker}: </span>{entry.text}
                            </div>
                        </div>
                    )) : <p className="text-gray-500">Awaiting conversation...</p>}
                </div>
            </div>
        </div>
    );
};

export default LiveConversation;