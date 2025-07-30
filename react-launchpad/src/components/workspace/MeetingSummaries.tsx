import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getMeetingSummaries, 
  getFreelancerProjects,
  getClientProjects
} from '../../apiendpoints';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Clock, 
  Calendar, 
  Filter, 
  Search, 
  Mic, 
  MicOff, 
  Play, 
  Square,
  MessageSquare,
  CalendarDays,
  FolderOpen,
  AlertCircle,
  Volume2,
  VolumeX,
  Bot
} from 'lucide-react';
import toast from 'react-hot-toast';

// ElevenLabs conversation hook - replace with real import when package is installed
import { useConversation } from '@elevenlabs/react';

interface MeetingSummary {
  id: number;
  freelancerId: number;
  projectId: number;
  freelancerName: string;
  projectName: string;
  summary: string;
  blocker?: string;
  createdAt: string;
}

interface Project {
  id: number;
  projectTitle: string;
  description: string;
}

export function MeetingSummaries() {
  const { user } = useAuth();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // ElevenLabs Conversational AI (only for freelancers)
  const [convStarted, setConvStarted] = useState(false);
  const [convError, setConvError] = useState<string | null>(null);
  const [showConversationUI, setShowConversationUI] = useState(false);
  
  // Summaries state
  const [summaries, setSummaries] = useState<MeetingSummary[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [summariesError, setSummariesError] = useState<string | null>(null);
  
  // Filtering state
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [projects, setProjects] = useState<Project[]>([]);
  
  const agentId = 'agent_4001k1b6f2kefwmtn30k4jcc8gjt';
  const conversation = useConversation({
    onConnect: () => setConvStarted(true),
    onDisconnect: () => setConvStarted(false),
    onError: (err) => setConvError(String(err)),
    onMessage: (msg) => {},
  });

  // Fetch projects based on user role
  useEffect(() => {
    async function fetchProjects() {
      if (!user?.id) return;
      try {
        let projectsData;
        if (user?.role === 'freelancer') {
          projectsData = await getFreelancerProjects(user.id);
        } else if (user?.role === 'client') {
          projectsData = await getClientProjects(user.id);
        } else {
          return;
        }
        setProjects(projectsData);
      } catch (e) {
        setProjects([]);
      }
    }
    fetchProjects();
  }, [user?.id, user?.role]);

  // Fetch summaries from backend
  const fetchSummaries = async () => {
    setLoadingSummaries(true);
    setSummariesError(null);
    try {
      if (!user?.id) return;
      
      const projectIds = selectedProject !== 'all' ? selectedProject : undefined;
      const data = await getMeetingSummaries(
        user.id, 
        user?.role || 'freelancer', 
        projectIds, 
        dateRange.start, 
        dateRange.end
      );
      
      if (data.status === 'success') {
        setSummaries(data.data || []);
        console.log(data.data);
      } else {
        setSummariesError('Failed to fetch summaries');
      }
    } catch (err) {
      setSummariesError('Error fetching summaries: ' + String(err));
    } finally {
      setLoadingSummaries(false);
    }
  };

  // Fetch summaries on component mount and when filters change
  useEffect(() => {
    fetchSummaries();
  }, [user?.id, selectedProject, dateRange]);

  // Helper to reset all state
  const resetAllState = () => {
    setConvStarted(false);
    setConvError(null);
    setRecording(false);
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
  };

  // Start both ElevenLabs conversation and audio recording
  const startConversation = async () => {
    if (selectedProject === 'all') {
      toast.error('Please select a project before starting conversation');
      return;
    }

    setConvError(null);
    setShowConversationUI(true);
    try {
      const response = await fetch('http://localhost:8001/start-project-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: Number(selectedProject),
          freelancer_id: user?.id
        })
      });
      const data = await response.json();
      if (data.status !== 'recording_started' && data.status !== 'already_recording') {
        setConvError('Failed to start backend recording: ' + (data.error || data.status));
        return;
      }
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId,
        connectionType: 'webrtc',
      });
      // Start recording
      startRecording();
    } catch (err) {
      setConvError('Failed to start conversation: ' + String(err));
    }
  };

  // End both ElevenLabs conversation and audio recording
  const endConversation = async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      setConvError('Failed to end conversation: ' + String(err));
    }
    // Stop recording
    stopRecording();
 
    try {
      const response = await fetch('http://localhost:8001/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.status !== 'success') {
        setConvError('Failed to stop backend recording: ' + (data.error || data.status));
      } else {
        // Optionally, handle the transcript data here
        // e.g., setTranscript(data.transcript);
      }
    } catch (err) {
      setConvError('Failed to stop backend recording: ' + String(err));
    }
 
    try {
      await fetch('http://localhost:8001/run-elevenlabs-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Bot triggered successfully.');
    } catch (err) {
      console.error('Failed to call bot endpoint:', err);
      setConvError('Failed to trigger post-conversation bot.');
    }
   
    // Hide all UI and reset state
    setShowConversationUI(false);
    resetAllState();
    
    // Refresh summaries
    fetchSummaries();
  };

  // Start recording helper
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        // Try to use 'audio/wav' for AssemblyAI compatibility
        let audioBlob;
        try {
          audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        } catch {
          audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        }
        // Transcription logic removed
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available.');
    }
  };

  // Stop recording helper
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Group summaries by date
  const groupSummariesByDate = (summaries: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    summaries.forEach(summary => {
      const date = summary.createdAt ? new Date(summary.createdAt).toLocaleDateString() : 'Unknown Date';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(summary);
    });
    
    // Sort dates in descending order (most recent first)
    return Object.entries(grouped).sort(([dateA], [dateB]) => {
      if (dateA === 'Unknown Date') return 1;
      if (dateB === 'Unknown Date') return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  };

  const groupedSummaries = groupSummariesByDate(summaries);

  const clearFilters = () => {
    setSelectedProject('all');
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
  };

  // Filter summaries based on search term
  const filteredSummaries = summaries.filter(summary =>
    summary.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (summary.blocker && summary.blocker.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredGroupedSummaries = groupSummariesByDate(filteredSummaries);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meeting Summaries</h1>
        <p className="text-gray-600">
          {user?.role === 'freelancer' 
            ? 'Converse with AI agent and view your meeting summaries'
            : 'View meeting summaries from your projects'
          }
        </p>
      </div>

      {/* Controls Section */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Project Filter */}
            <div className="flex flex-col gap-2 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700">
                {user?.role === 'freelancer' ? 'Project' : 'Your Project'}
              </label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.projectTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">From Date</label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">To Date</label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search summaries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
            
            {user?.role === 'freelancer' && (
              <Button
                onClick={startConversation}
                disabled={selectedProject === 'all' || convStarted || recording}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Bot className="h-4 w-4" />
                Start Conversation
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Conversational AI Card - Only for freelancers */}
      {user?.role === 'freelancer' && showConversationUI && (
        <Card className="p-6 mb-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Conversation</h2>
            <div className="flex justify-center gap-4 mb-4">
              <Button
                onClick={startConversation}
                disabled={convStarted || recording}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Conversation
              </Button>
              <Button
                onClick={endConversation}
                disabled={!convStarted && !recording}
                variant="danger"
              >
                End Conversation
              </Button>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <strong>Status:</strong> {conversation.status}
            </div>
            {convError && (
              <div className="text-red-600 text-sm font-medium">{convError}</div>
            )}
          </div>
        </Card>
      )}

      {/* Meeting Summaries Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Meeting Summaries</h2>
        
        {loadingSummaries && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading summaries...</p>
          </div>
        )}
        
        {summariesError && (
          <div className="text-red-600 text-center py-4 font-medium">{summariesError}</div>
        )}
        
        <div>
          {filteredSummaries.length === 0 && !loadingSummaries && !summariesError && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No meeting summaries found</h3>
              <p className="text-gray-600">
                {user?.role === 'freelancer' 
                  ? 'Start a conversation with the AI agent to create your first meeting summary'
                  : 'Meeting summaries will appear here when freelancers create them'
                }
              </p>
            </div>
          )}
          
          {filteredGroupedSummaries.map(([date, dateSummaries]) => (
            <div key={date} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                {date}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateSummaries.map((summary: any, index: number) => (
                  <Card key={summary.id || index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-gray-900">{summary.projectName || summary.name}</h4>
                        <Badge variant="outline">
                          {new Date(summary.createdAt || summary.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                      {summary.projectName && (
                        <div>
                          <strong className="text-gray-700 text-sm">Project:</strong>
                          <span className="text-gray-600 text-sm ml-2">{summary.projectName}</span>
                        </div>
                      )}
                      {summary.summary && (
                        <div>
                          <strong className="text-gray-700 text-sm">Summary:</strong>
                          <p className="text-gray-600 text-sm mt-1 leading-relaxed">{summary.summary}</p>
                        </div>
                      )}
                      {summary.blocker && (
                        <div>
                          <strong className="text-red-700 text-sm">Blockers:</strong>
                          <p className="text-red-600 text-sm mt-1 leading-relaxed">{summary.blocker}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}; 