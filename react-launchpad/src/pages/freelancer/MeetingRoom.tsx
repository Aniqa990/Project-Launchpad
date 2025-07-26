import React, { useRef, useState, useEffect } from 'react';
import JaaSMeeting from '../client/JaaSMeeting';
import { useAuth } from '../../contexts/AuthContext';
import { getNotifications, getMeetingDetails, uploadMeetingAudio } from '../../apiendpoints';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';

function renderMessage(msg: string) {
  if (!msg || typeof msg !== 'string') return null;
  const urlRegex = /(https?:\/\/[\S]+)/g;
  return msg.split(urlRegex).map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{part}</a>
      : part
  );
}

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

  // Notification filter state
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<any>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [startingMeeting, setStartingMeeting] = useState(false);
  const [meetingRoomId, setMeetingRoomId] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<number | null>(null); // Store integer meeting ID
  const [uploadingTranscript, setUploadingTranscript] = useState(false);
  const [uploadTranscriptSuccess, setUploadTranscriptSuccess] = useState<string | null>(null);
  const [uploadTranscriptError, setUploadTranscriptError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ASSEMBLYAI_API_KEY = '2a10d51c006c409681db68820636a14d';

  // Fetch notifications for freelancer
  useEffect(() => {
    if (!user?.id) return;
    getNotifications(user.id)
      .then(data => {
        setNotifications(data);
        if (data && data.length > 0) {
          setSelectedNotificationId(String(data[0].id));
        }
      })
      .catch(() => setError('Failed to load notifications.'));
  }, [user?.id]);

  // Fetch meeting details for selected notification
  useEffect(() => {
    if (!selectedNotificationId) {
      setMeeting(null);
      return;
    }
    const notif = notifications.find((n: any) => String(n.id) === selectedNotificationId);
    if (notif && notif.relatedMeetingId) {
      getMeetingDetails(notif.relatedMeetingId)
        .then(data => {
          setMeeting(data);
          setMeetingId(data.meetingId || data.Id || data.id);
        })
        .catch(() => setError('Failed to load meeting details.'));
    } else {
      setMeeting(null);
    }
  }, [selectedNotificationId, notifications]);

  const handleStartRecording = async () => {
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

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Jitsi end: always stop recording if recorder exists
  const handleJitsiEnd = () => {
    setMeetingActive(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // AssemblyAI transcription handler (with timestamps)
  const handleTranscribe = async () => {
    setTranscribing(true);
    setTranscribeError(null);
    setTranscript(null);
    try {
      if (!audioUrl) {
        setTranscribeError('No audio to transcribe.');
        setTranscribing(false);
        return;
      }
      const audioBlob = await fetch(audioUrl).then(r => r.blob());
      // 2. Upload the audio to AssemblyAI
      const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY
        },
        body: audioBlob
      });
      const { upload_url } = await uploadRes.json();
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
      let transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify(transcriptBody)
      });
      let transcriptJson = await transcriptRes.json();
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
    } catch (err) {
      setTranscribeError('Transcription failed.');
    } finally {
      setTranscribing(false);
    }
  };

  // Upload transcript to backend
  const handleUploadTranscript = async () => {
    if (!transcript || !user || !meetingId) {
      setUploadTranscriptError('Missing transcript, user, or meeting ID.');
      return;
    }
    setUploadingTranscript(true);
    setUploadTranscriptSuccess(null);
    setUploadTranscriptError(null);
    try {
      // 1. Upload transcript to Cloudinary
      const cloudName = 'depfyzzad';
      const unsignedPreset = 'projectLaunchpad';
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      const transcriptBlob = new Blob([transcript], { type: 'text/plain' });
      const cloudForm = new FormData();
      cloudForm.append('file', transcriptBlob, `transcript-${meetingId}-user-${user.id}.txt`);
      cloudForm.append('upload_preset', unsignedPreset);
      // Optionally, set folder or public_id here
      const cloudRes = await fetch(url, {
        method: 'POST',
        body: cloudForm
      });
      const cloudData = await cloudRes.json();
      if (!cloudData.secure_url) {
        throw new Error('Failed to upload transcript to Cloudinary');
      }
      const transcriptUrl = cloudData.secure_url;
      // 2. Send Cloudinary URL to backend as audioUrl using FormData
      const formData = new FormData();
      formData.append('userId', String(user.id));
      formData.append('audioUrl', transcriptUrl);
      const backendRes = await uploadMeetingAudio(meetingId, formData);
      setUploadTranscriptSuccess('Transcript uploaded and saved!');
    } catch (err: any) {
      setUploadTranscriptError(err?.response?.data || err.message || 'Failed to upload transcript.');
    } finally {
      setUploadingTranscript(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Notification Filter */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Select Notification</label>
          <Select
            value={selectedNotificationId || ''}
            onValueChange={(val) => setSelectedNotificationId(val)}
            disabled={notifications.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={notifications.length === 0 ? 'No notifications' : 'Choose a notification'} />
            </SelectTrigger>
            <SelectContent>
              {notifications.map((n: any) => (
                <SelectItem key={n.id} value={String(n.id)}>
                  {n.message?.slice(0, 40) || 'No message'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Meeting Details Inputs */}
      {meeting && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Meeting Title (optional)"
            value={meeting.Title || ''}
            readOnly
          />
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Description (optional)"
            value={meeting.Description || ''}
            readOnly
          />
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Agenda (optional)"
            value={meeting.Agenda || ''}
            readOnly
          />
        </div>
      )}
      {/* Jitsi JaaS Meeting Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-center">Jitsi Meeting (JaaS)</h2>
        <div className="rounded-xl overflow-hidden shadow border border-gray-200 bg-white">
          {meetingActive && meeting ? (
            <JaaSMeeting 
              onMeetingStart={handleStartRecording}
              onMeetingEnd={handleJitsiEnd}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-gray-600">Meeting not started.</p>
            </div>
          )}
        </div>
      </div>
      {/* Audio Recording Section */}
      <div className="mt-12 text-center">
        <h2 className="text-xl font-bold mb-4">Audio Recording</h2>
        {/* Show download/transcribe UI after recording stops */}
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
                <div className="flex flex-wrap gap-4 mb-2">
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(transcript)}`}
                    download="transcript.txt"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Download Transcript
                  </a>
                  <button
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    onClick={handleUploadTranscript}
                    disabled={uploadingTranscript}
                  >
                    {uploadingTranscript ? 'Uploading...' : 'Upload Transcript to Database'}
                  </button>
                </div>
                {uploadTranscriptSuccess && <div className="text-green-600 mt-2">{uploadTranscriptSuccess}</div>}
                {uploadTranscriptError && <div className="text-red-600 mt-2">{uploadTranscriptError}</div>}
              </div>
            )}
          </div>
        )}
        {/* Fallback manual controls in a collapsible section */}
        <details className="mt-8">
          <summary className="cursor-pointer text-blue-600 underline">Show Manual Recording Controls (Fallback)</summary>
          <div className="mt-4">
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
          </div>
        </details>
        <p className="mt-4 text-gray-500 text-sm">
          This will record audio using your microphone and let you download the file. You can also transcribe the audio and download the transcript as a text file.
        </p>
      </div>
    </div>
  );
} 