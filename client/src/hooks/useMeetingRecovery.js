// hooks/useMeetingRecovery.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useMeetingRecovery = (token) => {
  const [pendingMeeting, setPendingMeeting] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkForActiveMeeting = async () => {
      if (!token) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/live-meeting/active`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data?.activeMeeting) {
          const meeting = response.data.activeMeeting;
          console.log('📋 Found active meeting:', meeting);
          // Only show dialog if meeting is in 'active' or 'recording' status
          if (meeting.status === 'active' || meeting.status === 'recording') {
            setPendingMeeting(meeting);
          }
        }
      } catch (error) {
        console.error('Error checking for active meetings:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkForActiveMeeting();
  }, [token]);

  const clearPendingMeeting = () => {
    setPendingMeeting(null);
  };

  return { pendingMeeting, isChecking, clearPendingMeeting };
};