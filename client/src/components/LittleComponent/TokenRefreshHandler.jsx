import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { logout, updateToken } from '../../redux/authSlice';

const TokenRefreshHandler = () => {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) return;

    // Refresh token when tab becomes visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && token) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/auth/refresh-token`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            }
          );

          if (response.data && response.data.token) {
            const newToken = response.data.token;
            const payload = JSON.parse(atob(newToken.split('.')[1]));
            const newExpiration = payload.exp * 1000;

            dispatch(updateToken({
              token: newToken,
              tokenExpiration: newExpiration
            }));

            console.log('Token refreshed on tab focus');
          }
        } catch (error) {
          if (error.response?.status === 401) {
            console.log('Token invalid, logging out...');
            dispatch(logout());
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, dispatch]);

  return null;
};

export default TokenRefreshHandler;