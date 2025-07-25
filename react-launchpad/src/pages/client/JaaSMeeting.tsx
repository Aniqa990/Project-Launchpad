import React, { useEffect, useRef } from 'react';

const JAAS_DOMAIN = '8x8.vc';
const JAAS_ROOM = 'vpaas-magic-cookie-916ca21a710a40e0ac58af93b2f48abe/SampleAppFrightenedPresidentsInviteSeldom';

// @ts-ignore
declare global { interface Window { JitsiMeetExternalAPI: any; } }

export default function JaaSMeeting({ onMeetingStart, onMeetingEnd }: { onMeetingStart?: () => void, onMeetingEnd?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (apiRef.current) return;

    function createMeeting() {
      if (window.JitsiMeetExternalAPI && containerRef.current && !apiRef.current) {
        apiRef.current = new window.JitsiMeetExternalAPI(JAAS_DOMAIN, {
          roomName: JAAS_ROOM,
          parentNode: containerRef.current,
        });
        if (onMeetingStart) {
          apiRef.current.addListener('videoConferenceJoined', () => {
            onMeetingStart();
          });
        }
        if (onMeetingEnd) {
          apiRef.current.addListener('readyToClose', () => {
            onMeetingEnd();
          });
        }
      }
    }

    if (!window.JitsiMeetExternalAPI && !scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = 'https://8x8.vc/vpaas-magic-cookie-916ca21a710a40e0ac58af93b2f48abe/external_api.js';
      script.async = true;
      script.onload = createMeeting;
      document.body.appendChild(script);
    } else if (window.JitsiMeetExternalAPI) {
      createMeeting();
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [onMeetingStart, onMeetingEnd]);

  return <div id="jaas-container" ref={containerRef} style={{ height: 600, width: '100%' }} />;
} 