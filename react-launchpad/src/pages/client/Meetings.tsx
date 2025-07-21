import React, { useRef, useState } from 'react';
import JaaSMeeting from './JaaSMeeting';

export default function Meetings() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    setAudioUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(audioBlob));
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-6">Meetings</h1>
      {/* Audio Recording Section */}
      <div className="mb-8">
        {!recording ? (
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            onClick={handleStartRecording}
          >
            Start Audio Recording
          </button>
        ) : (
          <button
            className="px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
            onClick={handleStopRecording}
          >
            Stop Recording
          </button>
        )}
        {audioUrl && (
          <div className="mt-6">
            <audio controls src={audioUrl} className="w-full mb-2" />
            <a
              href={audioUrl}
              download={`meeting-recording-${Date.now()}.webm`}
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Download Recording
            </a>
          </div>
        )}
        <p className="mt-4 text-gray-500 text-sm">
          This will record audio using your microphone and let you download the file.
        </p>
      </div>
      {/* Jitsi JaaS Meeting Section */}
      <h2 className="text-xl font-bold mt-8 mb-4">Jitsi Meeting (JaaS)</h2>
      <JaaSMeeting />
    </div>
  );
} 