import React, { useRef, useState } from 'react';
import JaaSMeeting from './JaaSMeeting';

export default function Meetings() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [meetingActive, setMeetingActive] = useState(true);
  // AssemblyAI transcription state
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const ASSEMBLYAI_API_KEY = '2a10d51c006c409681db68820636a14d'; // Replace with your real key for testing

  // Helper to start recording (used for auto-start)
  const startRecording = async () => {
    setAudioUrl(null);
    setTranscript(null);
    setTranscribeError(null);
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

  // Helper to stop recording (used for auto-stop)
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Start recording when meeting starts
  React.useEffect(() => {
    if (meetingActive) {
      startRecording();
    } else {
      stopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingActive]);

  // AssemblyAI transcription handler (with timestamps)
  const handleTranscribe = async () => {
    setTranscribing(true);
    setTranscribeError(null);
    setTranscript(null);
    try {
      // 1. Get the audio blob from the audioUrl
      let upload_url = null;
      let audioBlob = null;
      if (!audioUrl) {
        setTranscribeError('No audio to transcribe.');
        setTranscribing(false);
        return;
      }
      audioBlob = await fetch(audioUrl).then(r => r.blob());

      // 2. Upload the audio to AssemblyAI
      const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY
        },
        body: audioBlob
      });
      const uploadData = await uploadRes.json();
      upload_url = uploadData.upload_url;
      console.log('AssemblyAI upload_url:', upload_url);

      if (!upload_url) {
        setTranscribeError('Audio upload failed.');
        setTranscribing(false);
        return;
      }

      // 3. Start the transcription job (with word-level timestamps)
      let transcriptBody: any = {
        audio_url: upload_url,
        words: true,
        punctuate: true,
        format_text: true
      };
      console.log('Transcript request body:', transcriptBody);

      let transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify(transcriptBody)
      });
      let transcriptJson = await transcriptRes.json();
      console.log('AssemblyAI response:', transcriptJson);

      // Fallback: If error is about invalid schema or unsupported param, try without words
      if (!transcriptJson.id && transcriptJson.error && transcriptJson.error.toLowerCase().includes('invalid endpoint schema')) {
        transcriptBody = {
          audio_url: upload_url,
          punctuate: true,
          format_text: true
        };
        transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
          method: 'POST',
          headers: {
            'authorization': ASSEMBLYAI_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify(transcriptBody)
        });
        transcriptJson = await transcriptRes.json();
        console.log('AssemblyAI fallback response:', transcriptJson);
      }

      const id = transcriptJson.id;
      if (!id) {
        setTranscribeError(transcriptJson.error || 'Failed to start transcription job. Please try again.');
        setTranscribing(false);
        return;
      }

      // 4. Poll for completion
      let completed = false;
      let transcriptText = '';
      let words = [];
      while (!completed) {
        await new Promise(res => setTimeout(res, 4000));
        const pollingRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
          headers: { 'authorization': ASSEMBLYAI_API_KEY }
        });
        const pollingData = await pollingRes.json();
        if (pollingData.status === 'completed') {
          completed = true;
          transcriptText = pollingData.text;
          words = pollingData.words || [];
        } else if (pollingData.status === 'failed') {
          setTranscribeError(pollingData.error || 'Transcription failed.');
          setTranscribing(false);
          return;
        }
      }

      // 5. Format transcript with timestamps based on pauses
      let formatted = '';
      if (words && words.length > 0) {
        let segment = [];
        let lastEnd = 0;
        let lastStart = words[0].start;
        const PAUSE_THRESHOLD = 1000; // 1 second

        for (let i = 0; i < words.length; i++) {
          const w = words[i];
          // If this word starts more than 1s after the previous word ended, start a new segment
          if (i > 0 && w.start - lastEnd > PAUSE_THRESHOLD) {
            // Output the previous segment
            const ts = new Date(lastStart).toISOString().substr(11, 8);
            formatted += `[${ts}] ${segment.join(' ')}\n`;
            // Start new segment
            segment = [];
            lastStart = w.start;
          }
          segment.push(w.text);
          lastEnd = w.end;
        }
        // Output the last segment
        if (segment.length > 0) {
          const ts = new Date(lastStart).toISOString().substr(11, 8);
          formatted += `[${ts}] ${segment.join(' ')}\n`;
        }
      } else {
        formatted = transcriptText;
      }
      setTranscript(formatted);
    } catch (err: any) {
      setTranscribeError(err.message || 'Transcription failed.');
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Meetings</h1>
      {/* Jitsi JaaS Meeting Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-center">Jitsi Meeting (JaaS)</h2>
        <div className="rounded-xl overflow-hidden shadow border border-gray-200 bg-white">
          {meetingActive ? (
            <JaaSMeeting onMeetingEnd={() => setMeetingActive(false)} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-gray-600">Meeting ended.</p>
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                onClick={() => setMeetingActive(true)}
              >
                Rejoin Meeting
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Audio Recording Section */}
      <div className="mt-12 text-center">
        <h2 className="text-xl font-bold mb-4">Audio Recording</h2>
        {/* Hide manual recording controls during meeting */}
        {!meetingActive && !recording && !audioUrl && (
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            onClick={startRecording}
          >
            Start Audio Recording
          </button>
        )}
        {!meetingActive && recording && (
          <button
            className="px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
            onClick={stopRecording}
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
            <button
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={handleTranscribe}
              disabled={transcribing}
            >
              {transcribing ? 'Transcribing...' : 'Transcribe Audio'}
            </button>
            {transcribeError && <div className="text-red-600 mt-2">{transcribeError}</div>}
            {transcript && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Transcript</h3>
                <textarea value={transcript} readOnly className="w-full h-40 mb-2" />
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(transcript)}`}
                  download="transcript.txt"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Download Transcript
                </a>
              </div>
            )}
          </div>
        )}
        <p className="mt-4 text-gray-500 text-sm">
          This will record audio using your microphone and let you download the file. You can also transcribe the audio and download the transcript as a text file.
        </p>
      </div>
    </div>
  );
} 