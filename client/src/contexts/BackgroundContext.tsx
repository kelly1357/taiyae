import React, { createContext, useContext, useState, useCallback } from 'react';

interface BackgroundContextType {
  backgroundUrl: string;
  setBackgroundUrl: (url: string) => void;
  resetBackground: () => void;
  isGrayscale: boolean;
  setGrayscale: (value: boolean) => void;
}

const DEFAULT_BACKGROUND = 'https://taiyaefiles.blob.core.windows.net/web/home.jpg';

const BackgroundContext = createContext<BackgroundContextType>({
  backgroundUrl: DEFAULT_BACKGROUND,
  setBackgroundUrl: () => {},
  resetBackground: () => {},
  isGrayscale: false,
  setGrayscale: () => {},
});

export const useBackground = () => useContext(BackgroundContext);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backgroundUrl, setBackgroundUrlState] = useState(DEFAULT_BACKGROUND);
  const [isGrayscale, setIsGrayscale] = useState(false);

  const setBackgroundUrl = useCallback((url: string) => {
    setBackgroundUrlState(url || DEFAULT_BACKGROUND);
  }, []);

  const resetBackground = useCallback(() => {
    setBackgroundUrlState(DEFAULT_BACKGROUND);
    setIsGrayscale(false);
  }, []);

  const setGrayscale = useCallback((value: boolean) => {
    setIsGrayscale(value);
  }, []);

  return (
    <BackgroundContext.Provider value={{ backgroundUrl, setBackgroundUrl, resetBackground, isGrayscale, setGrayscale }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export default BackgroundContext;
