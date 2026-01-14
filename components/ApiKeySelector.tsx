import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Spinner from './Spinner';

// FIX: Changed the global declaration to use a named interface `AIStudio` to prevent type conflicts with other potential declarations of `window.aistudio`.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // FIX: Made 'aistudio' optional to resolve a modifier conflict with other potential declarations.
    aistudio?: AIStudio;
  }
}

interface ApiKeyContextType {
  resetApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | null>(null);

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within a child component of ApiKeySelector');
  }
  return context;
};

export const ApiKeySelector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkApiKey = useCallback(async () => {
    if (typeof window.aistudio?.hasSelectedApiKey !== 'function') {
      setError("This feature is not available in the current environment.");
      setHasKey(false);
      return;
    }
    try {
      const keyStatus = await window.aistudio.hasSelectedApiKey();
      setHasKey(keyStatus);
    } catch (e) {
      console.error("Error checking API key:", e);
      setError("Could not verify API key status.");
      setHasKey(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    if (typeof window.aistudio?.openSelectKey !== 'function') {
       setError("This feature is not available in the current environment.");
       return;
    }
    try {
      await window.aistudio.openSelectKey();
      // Assume success and optimistically update UI.
      // A race condition can occur, but we assume the user successfully selected a key.
      setHasKey(true);
      setError(null);
    } catch (e) {
      console.error("Error opening key selector:", e);
      setError("Failed to open the API key selector.");
    }
  };

  const resetApiKey = useCallback(() => {
    setHasKey(false);
  }, []);

  if (hasKey === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Spinner />
        <p className="mt-4 text-gray-400">Verifying API key status...</p>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg m-4 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold text-white mb-2">API Key Required</h2>
        <p className="text-gray-300 max-w-md mb-6">
          To use the video generation features, you need to select an API key. This will be used for billing purposes.
        </p>
        <button
          onClick={handleSelectKey}
          className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-500 transition-colors duration-300"
        >
          Select API Key
        </button>
         <p className="text-xs text-gray-500 mt-4">
          For more information, see the{" "}
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">
            billing documentation
          </a>.
        </p>
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    );
  }

  return <ApiKeyContext.Provider value={{ resetApiKey }}>{children}</ApiKeyContext.Provider>;
};