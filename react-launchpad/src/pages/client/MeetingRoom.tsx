import { useRef, useState, useEffect } from 'react';
import JaaSMeeting from './JaaSMeeting';
import { useAuth } from '../../contexts/AuthContext';
import { getClientProjects, startMeeting, uploadMeetingAudio, getProjectFreelancers } from '../../apiendpoints';
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
  const [meetingId, setMeetingId] = useState<number | null>(null);

  // Upload transcript state
  const [uploadingTranscript, setUploadingTranscript] = useState(false);
  const [uploadTranscriptSuccess, setUploadTranscriptSuccess] = useState<string | null>(null);
  const [uploadTranscriptError, setUploadTranscriptError] = useState<string | null>(null);

  const ASSEMBLYAI_API_KEY = '2a10d51c006c409681db68820636a14d';

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
      .then((res) => {
        setFreelancers(res);
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
      // 5. Format transcript with timestamps and username based on pauses
      let formatted = '';
      const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
      const userRole = 'Client';
      
      if (words && words.length > 0) {
        let segment = [];
        let lastEnd = 0;
        let lastStart = words[0].start;
        const PAUSE_THRESHOLD = 1000; // 1 second
        for (let i = 0; i < words.length; i++) {
          const w = words[i];
          // If this word starts more than 1s after the previous word ended, start a new segment
          if (i > 0 && w.start - lastEnd > PAUSE_THRESHOLD) {
            // Output the previous segment with username
            const ts = new Date(lastStart).toISOString().substr(11, 8);
            formatted += `[${ts}] ${userName} (${userRole}): ${segment.join(' ')}\n`;
            // Start new segment
            segment = [];
            lastStart = w.start;
          }
          segment.push(w.text);
          lastEnd = w.end;
        }
        // Output the last segment with username
        if (segment.length > 0) {
          const ts = new Date(lastStart).toISOString().substr(11, 8);
          formatted += `[${ts}] ${userName} (${userRole}): ${segment.join(' ')}\n`;
        }
      } else {
        // If no word-level timestamps, add username to the full transcript
        formatted = `${userName} (${userRole}): ${transcriptText}`;
      }
      
      // No header needed - just the conversation with timestamps
      
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
      const participants = [
        {
          userId: user.id!,
          userName: `${user.firstName} ${user.lastName}`,
          role: 'client',
        },
        ...freelancers.map(f => ({
          userId: f.id,
          userName: `${f.firstName} ${f.lastName}`,
          role: 'freelancer',
        }))
      ];
      const payload = {
        projectId: Number(selectedProjectId),
        title: meetingTitle || 'Project Meeting',
        description: meetingDescription,
        agenda: meetingAgenda,
        createdBy: user.id!,
        participants,
      };
      const res = await startMeeting(payload);
      setMeetingRoomId(res.data.roomId);
      setMeetingId(res.data.meetingId); // Save integer meeting ID
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
      const backendRes = await uploadMeetingAudio(meetingId!, formData);
      setUploadTranscriptSuccess('Transcript uploaded and saved!');
    } catch (err: any) {
      setUploadTranscriptError(err?.response?.data || err.message || 'Failed to upload transcript.');
    } finally {
      setUploadingTranscript(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meeting Room</h1>
        <p className="text-gray-600">Start and manage video meetings with your project team</p>
      </div>

      {/* Project & Freelancer Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Project</label>
            <Select
              value={selectedProjectId || ''}
              onValueChange={(val) => setSelectedProjectId(val)}
              disabled={loadingProjects || !projects.length}
            >
              <SelectTrigger className="w-full bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors">
                <SelectValue placeholder={loadingProjects ? 'Loading projects...' : 'Choose a project'} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                {projects.map((proj) => (
                  <SelectItem 
                    key={proj.Id || proj.id} 
                    value={String(proj.Id || proj.id)}
                    className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                  >
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startingMeeting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting...
                </div>
              ) : (
                'Start Meeting'
              )}
            </Button>
          </div>
        </div>
      </div>
      {/* Meeting Details Inputs */}
      {selectedProjectId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter meeting title"
                value={meetingTitle}
                onChange={e => setMeetingTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Meeting description"
                value={meetingDescription}
                onChange={e => setMeetingDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Meeting agenda"
                value={meetingAgenda}
                onChange={e => setMeetingAgenda(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      {/* Freelancer List */}
      {selectedProjectId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Team</h3>
          {loadingFreelancers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading freelancers...</span>
            </div>
          ) : freelancers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No freelancers found for this project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {freelancers.map((f) => (
                <div key={f.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {f.firstName.charAt(0)}{f.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{f.firstName} {f.lastName}</h4>
                      <p className="text-sm text-gray-600">{f.email}</p>
                      {f.availability && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {f.availability}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Jitsi JaaS Meeting Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Video Meeting</h2>
          {showMeeting && meetingActive && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 font-medium">Live</span>
            </div>
          )}
        </div>
        
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 min-h-[400px]">
          {showMeeting && meetingActive ? (
            <JaaSMeeting 
              onMeetingStart={handleStartRecording}
              onMeetingEnd={handleJitsiEnd}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Meeting Not Started</h3>
              <p className="text-gray-600 text-center max-w-md">
                Select a project and click "Start Meeting" to begin your video conference with the team.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Audio Recording Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Audio Recording & Transcription</h2>
          {recording && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 font-medium">Recording</span>
            </div>
          )}
        </div>

        {/* Show download/transcribe UI after recording stops */}
        {audioUrl && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Recorded Audio</h3>
              <audio controls src={audioUrl} className="w-full mb-4" />
              <div className="flex flex-wrap gap-3">
                <a
                  href={audioUrl}
                  download={`meeting-recording-${Date.now()}.webm`}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Recording
                </a>
                <button
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  onClick={handleTranscribe}
                  disabled={transcribing}
                >
                  {transcribing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Transcribe Audio
                    </>
                  )}
                </button>
              </div>
              {transcribeError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-800">{transcribeError}</span>
                  </div>
                </div>
              )}
            </div>

            {transcript && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Meeting Transcript</h3>
                <textarea 
                  value={transcript} 
                  readOnly 
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
                <div className="flex flex-wrap gap-3 mt-4">
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(transcript)}`}
                    download="transcript.txt"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Transcript
                  </a>
                  <button
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    onClick={handleUploadTranscript}
                    disabled={uploadingTranscript}
                  >
                    {uploadingTranscript ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload to Database
                      </>
                    )}
                  </button>
                </div>
                {uploadTranscriptSuccess && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-800">{uploadTranscriptSuccess}</span>
                    </div>
                  </div>
                )}
                {uploadTranscriptError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-800">{uploadTranscriptError}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Fallback manual controls */}
        <details className="mt-6">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Manual Recording Controls
          </summary>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-center">
              {!recording ? (
                <button
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
                  onClick={handleStartRecording}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Start Audio Recording
                </button>
              ) : (
                <button
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors"
                  onClick={handleStopRecording}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Stop Recording
                </button>
              )}
            </div>
            <p className="mt-3 text-gray-600 text-sm text-center">
              Use these controls to manually record audio using your microphone. The recording will automatically start when you begin a meeting.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
} 