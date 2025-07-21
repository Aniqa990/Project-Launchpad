import React, { useEffect, useRef } from 'react';

const JAAS_DOMAIN = '8x8.vc';
const JAAS_ROOM = 'vpaas-magic-cookie-e02913f46a32460a8b99e79628fd6cb2/SampleAppFrightenedPresidentsInviteSeldom';

// @ts-ignore
declare global { interface Window { JitsiMeetExternalAPI: any; } }

export default function JaaSMeeting() {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (apiRef.current) return;

    // Load the external Jitsi script if not already loaded
    if (!window.JitsiMeetExternalAPI && !scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = 'https://8x8.vc/vpaas-magic-cookie-e02913f46a32460a8b99e79628fd6cb2/external_api.js';
      script.async = true;
      script.onload = () => {
        createMeeting();
      };
      document.body.appendChild(script);
    } else if (window.JitsiMeetExternalAPI) {
      createMeeting();
    }

    function createMeeting() {
      if (window.JitsiMeetExternalAPI && containerRef.current && !apiRef.current) {
        apiRef.current = new window.JitsiMeetExternalAPI(JAAS_DOMAIN, {
          roomName: JAAS_ROOM,
          parentNode: containerRef.current,
          // jwt: "YOUR_JWT_TOKEN" // If you have premium features
        });
      }
    }

    // Cleanup function
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, []);

  return <div id="jaas-container" ref={containerRef} style={{ height: 600, width: '100%' }} />;
} 