import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatFeature from './features/Chat/ChatFeature';
import ImageGeneration from './features/Image/ImageGeneration';
import ImageUnderstanding from './features/Image/ImageUnderstanding';
import ImageEditing from './features/Image/ImageEditing';
import VideoGeneration from './features/Video/VideoGeneration';
import VideoUnderstanding from './features/Video/VideoUnderstanding';
import LiveConversation from './features/Audio/LiveConversation';
import Transcription from './features/Audio/Transcription';
import { ApiKeySelector } from './components/ApiKeySelector';

export type Feature = 
  | 'chat' 
  | 'image-generation' 
  | 'image-understanding' 
  | 'image-editing' 
  | 'video-generation' 
  | 'video-understanding'
  | 'live-conversation'
  | 'transcription';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('chat');

  const renderContent = useCallback(() => {
    switch (activeFeature) {
      case 'chat':
        return <ChatFeature />;
      case 'image-generation':
        return <ImageGeneration />;
      case 'image-understanding':
        return <ImageUnderstanding />;
      case 'image-editing':
        return <ImageEditing />;
      case 'video-generation':
        return <ApiKeySelector><VideoGeneration /></ApiKeySelector>;
      case 'video-understanding':
        return <VideoUnderstanding />;
      case 'live-conversation':
        return <LiveConversation />;
       case 'transcription':
        return <Transcription />;
      default:
        return <ChatFeature />;
    }
  }, [activeFeature]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
