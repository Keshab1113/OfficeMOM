import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const TokenRefreshHandler = () => {
  const token = useSelector((state) => state.auth.token);
  const tokenExpiration = useSelector((state) => state.auth.tokenExpiration);

  useEffect(() => {
    if (!token || !tokenExpiration) return;

    // Just log token status when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && token) {
        const timeUntilExpiration = tokenExpiration - Date.now();
        const minutesRemaining = Math.floor(timeUntilExpiration / 1000 / 60);
        
        console.log(`👁️ Tab visible - Token expires in ${minutesRemaining} minutes`);
        
        // The middleware in store.js will handle the refresh
        // No need to duplicate refresh logic here
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, tokenExpiration]);

  return null;
};

export default TokenRefreshHandler;