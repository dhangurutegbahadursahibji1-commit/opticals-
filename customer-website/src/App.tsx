import { Suspense, useState } from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from './routes';
import CustomCursor from './motion/CustomCursor';
import IntroSequence from './components/intro/IntroSequence';
import { useSettings } from './context/SettingsContext';

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
    </div>
  );
}

const INTRO_SESSION_KEY = 'ao-intro-shown';

export default function App() {
  const element = useRoutes(routes);
  const { tagline, storeName, introLine1, introLine2 } = useSettings();
  const [showIntro, setShowIntro] = useState(
    () => sessionStorage.getItem(INTRO_SESSION_KEY) !== 'true',
  );

  const handleIntroComplete = () => {
    sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
    setShowIntro(false);
  };

  return (
    <>
      <CustomCursor />
      {showIntro && (
        <IntroSequence
          onComplete={handleIntroComplete}
          tagline={tagline}
          storeName={storeName}
          introLine1={introLine1}
          introLine2={introLine2}
        />
      )}
      <Suspense fallback={<PageLoader />}>{element}</Suspense>
    </>
  );
}