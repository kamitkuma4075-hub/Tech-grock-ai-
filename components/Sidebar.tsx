import React from 'react';
import type { Feature } from '../App';

interface SidebarProps {
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
}

const BrainCircuitIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.079 4.921a.5.5 0 01.121.602l-1.4 3.5a.5.5 0 01-.602.278l-3.5-1.4a.5.5 0 01-.278-.602l1.4-3.5a.5.5 0 01.602-.278l3.5 1.4zM4.921 19.079a.5.5 0 01.602-.121l3.5 1.4a.5.5 0 01.278.602l-1.4 3.5a.5.5 0 01-.602.278l-3.5-1.4a.5.5 0 01-.278-.602l1.4-3.5zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v1m0 8v1m-4-4.5h1m7 0h1m-7.5-.5l.707-.707m5.657 5.657l.707-.707m-7.071 0l.707.707m5.657-7.071l.707.707" />
    </svg>
);

const NavItem: React.FC<{
  feature: Feature;
  label: string;
  // FIX: Changed type from JSX.Element to React.ReactElement to avoid namespace errors.
  icon: React.ReactElement;
  activeFeature: Feature;
  onClick: (feature: Feature) => void;
}> = ({ feature, label, icon, activeFeature, onClick }) => (
  <button
    onClick={() => onClick(feature)}
    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      activeFeature === feature
        ? 'bg-indigo-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="truncate">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature }) => {
  const navItems = [
    { feature: 'chat' as Feature, label: 'AI Chat', icon: <ChatIcon /> },
    { feature: 'image-generation' as Feature, label: 'Image Generation', icon: <ImageIcon /> },
    { feature: 'image-understanding' as Feature, label: 'Image Analysis', icon: <SearchImageIcon /> },
    { feature: 'image-editing' as Feature, label: 'Image Editing', icon: <EditIcon /> },
    { feature: 'video-generation' as Feature, label: 'Video Generation', icon: <VideoIcon /> },
    { feature: 'video-understanding' as Feature, label: 'Video Analysis', icon: <SearchVideoIcon /> },
    { feature: 'live-conversation' as Feature, label: 'Live Conversation', icon: <MicIcon /> },
    { feature: 'transcription' as Feature, label: 'Audio Transcription', icon: <DocumentTextIcon /> },
  ];

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-center py-4 mb-4 border-b border-gray-700">
          <BrainCircuitIcon />
          <h1 className="text-xl font-bold text-white">Tech Grock AI</h1>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavItem key={item.feature} {...item} activeFeature={activeFeature} onClick={setActiveFeature} />
        ))}
      </nav>
      <div className="text-center text-xs text-gray-500 p-4">
        Powered by Gemini
      </div>
    </div>
  );
};

// SVG Icons
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
);
const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const SearchImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 17l-6-5 3-3 5 4 4-4 3 3-5 5-4-2z" /></svg>
);
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
);
const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);
const SearchVideoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h3" /></svg>
);
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
);
const DocumentTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);


export default Sidebar;