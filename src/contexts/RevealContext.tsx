import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface RevealContextType {
  isRevealed: boolean;
  triggerReveal: () => void;
}

const RevealContext = createContext<RevealContextType | undefined>(undefined);

export const RevealProvider = ({ children }: { children: ReactNode }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const triggerReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  return (
    <RevealContext.Provider value={{ isRevealed, triggerReveal }}>
      {children}
    </RevealContext.Provider>
  );
};

export const useReveal = (): RevealContextType => {
  const context = useContext(RevealContext);
  if (!context) {
    throw new Error('useReveal must be used within a RevealProvider');
  }
  return context;
};
