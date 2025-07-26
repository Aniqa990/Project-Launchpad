import React, { useRef, useState, useEffect } from 'react';
import JaaSMeeting from './JaaSMeeting';
import { useAuth } from '../../contexts/AuthContext';
import { getClientProjects, getProjectFreelancers, startMeeting, uploadMeetingAudio } from '../../apiendpoints';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import type { FreelancerProfile } from '../../types';

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

  // Filter state
  const { user } = useAuth();
  const clientId = user?.id;
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string | null>(null);
  const [meetingReady, setMeetingReady] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFreelancers, setLoadingFreelancers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New: Meeting details state
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [startingMeeting, setStartingMeeting] = useState(false);
  const [meetingRoomId, setMeetingRoomId] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<number | null>(null); // Store integer meeting ID

  // New: Upload transcript state
  const [uploadingTranscript, setUploadingTranscript] = useState(false);
  const [uploadTranscriptSuccess, setUploadTranscriptSuccess] = useState<string | null>(null);
  const [uploadTranscriptError, setUploadTranscriptError] = useState<string | null>(null);

  const ASSEMBLYAI_API_KEY = '2a10d51c006c409681db68820636a14d'; // Replace with your real key for testing

  // Fetch projects for client
  useEffect(() => {
    console.log('Client ID:', clientId); // DEBUG
    if (!clientId) return;
    setLoadingProjects(true);
    setError(null);
    getClientProjects(clientId)
      .then((data) => {
        console.log('Fetched projects:', data); // DEBUG
        setProjects(data);
      })
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoadingProjects(false));
  }, [clientId]);

  // Fetch freelancers for selected project
  useEffect(() => {
    if (!selectedProjectId) {
      setFreelancers([]);
      setSelectedFreelancerId(null);
      return;
    }
    setLoadingFreelancers(true);
    setError(null);
    getProjectFreelancers(Number(selectedProjectId))
      .then((data) => {
        setFreelancers(data);
      })
      .catch(() => setError('Failed to load freelancers'))
      .finally(() => setLoadingFreelancers(false));
  }, [selectedProjectId]);

  // Reset meeting state when project/freelancer changes
  useEffect(() => {
    setShowMeeting(false);
    setMeetingActive(false);
  }, [selectedProjectId, selectedFreelancerId]);

  // Remove stoppedByJitsiRef logic

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

  const handleStartMeeting = async () => {
    if (!selectedProjectId || !user || !user.id) return;
    setStartingMeeting(true);
    setError(null);
    try {
      // Compose participants: client + freelancers
      const participants = [
        {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          role: 'client',
        },
        ...freelancers.map(f => ({
          userId: f.Id,
          userName: `${f.FirstName} ${f.LastName}`,
          role: 'freelancer',
        }))
      ];
      const payload = {
        projectId: Number(selectedProjectId),
        title: meetingTitle || 'Project Meeting',
        description: meetingDescription,
        agenda: meetingAgenda,
        createdBy: user.id,
        participants,
      };
      const res = await startMeeting(payload);
      setMeetingRoomId(res.roomId);
      setMeetingId(res.meetingId); // Save integer meeting ID
      setShowMeeting(true);
      setMeetingActive(true);
      await handleStartRecording(); // Start recording automatically
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to start meeting.');
    } finally {
      setStartingMeeting(false);
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
      {/* Project & Freelancer Filter */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Select Project</label>
          <Select
            value={selectedProjectId || ''}
            onValueChange={(val) => setSelectedProjectId(val)}
            disabled={loadingProjects || !projects.length}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loadingProjects ? 'Loading projects...' : 'Choose a project'} />
            </SelectTrigger>
            <SelectContent>
              {projects.map((proj) => (
                <SelectItem key={proj.Id || proj.id} value={String(proj.Id || proj.id)}>
                  {proj.ProjectTitle || proj.projectTitle || proj.Title || proj.title || `Project #${proj.Id || proj.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-shrink-0 mt-6 md:mt-0">
          <Button
            onClick={handleStartMeeting}
            disabled={!selectedProjectId || startingMeeting}
            variant="primary"
            size="md"
          >
            {startingMeeting ? 'Starting...' : 'Start Meeting'}
          </Button>
        </div>
      </div>
      {/* Meeting Details Inputs */}
      {selectedProjectId && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Meeting Title (optional)"
            value={meetingTitle}
            onChange={e => setMeetingTitle(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Description (optional)"
            value={meetingDescription}
            onChange={e => setMeetingDescription(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Agenda (optional)"
            value={meetingAgenda}
            onChange={e => setMeetingAgenda(e.target.value)}
          />
        </div>
      )}
      {/* Freelancer List */}
      {selectedProjectId && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Freelancers on this project:</h3>
          {loadingFreelancers ? (
            <div>Loading freelancers...</div>
          ) : freelancers.length === 0 ? (
            <div className="text-gray-500">No freelancers found for this project.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {freelancers.map((f) => (
                <li key={f.Id} className="border rounded-lg p-4 bg-white shadow flex flex-col">
                  <span className="font-medium">{f.FirstName} {f.LastName}</span>
                  <span className="text-sm text-gray-600">{f.Email}</span>
                  {f.Availability && <span className="text-xs text-green-700">{f.Availability}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {/* Jitsi JaaS Meeting Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-center">Jitsi Meeting (JaaS)</h2>
        <div className="rounded-xl overflow-hidden shadow border border-gray-200 bg-white">
          {showMeeting && meetingActive ? (
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