import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';

import './index.css';
import App from './App';

import { AccessibilityProvider } from './providers/AccessibilityProvider';
import { MotionPreferences } from './providers/MotionPreferences';
import { ScrollProvider } from './providers/ScrollProvider';
import { AnimationController } from './providers/AnimationController';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SettingsProvider>
          <ThemeProvider>
            <CartProvider>
              <WishlistProvider>
                  <AccessibilityProvider>
                    <MotionPreferences>
                      <ScrollProvider>
                        <AnimationController>
                          <App />
                        </AnimationController>
                      </ScrollProvider>
                    </MotionPreferences>
                  </AccessibilityProvider>
              </WishlistProvider>
            </CartProvider>
          </ThemeProvider>
        </SettingsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);