// Backend Integration for AI Task Generation
// This file shows how to connect your existing services

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Configuration
const MERGE_TRANSCRIPT_API = 'http://localhost:8000'; // Your FastAPI merge transcript service
const TASK_GENERATOR_API = 'http://localhost:8001';   // Your FastAPI task generator service
const YOUR_BACKEND_API = 'http://localhost:7053/api'; // Your existing backend

/**
 * POST /api/meetings/generate-tasks
 * Orchestrates the AI task generation process
 */
router.post('/meetings/generate-tasks', async (req, res) => {
  try {
    const { meetingId } = req.body;
    
    if (!meetingId) {
      return res.status(400).json({ error: 'Meeting ID is required' });
    }

    console.log(`🚀 Starting AI task generation for meeting ${meetingId}`);

    // Step 1: Get meeting details and project info
    const meetingResponse = await axios.get(`${YOUR_BACKEND_API}/meetings/${meetingId}`);
    const meeting = meetingResponse.data;
    
    const projectResponse = await axios.get(`${YOUR_BACKEND_API}/projects/${meeting.projectId}`);
    const project = projectResponse.data;

    // Step 2: Get existing tasks for the project
    const existingTasksResponse = await axios.get(`${YOUR_BACKEND_API}/tasks/project/${meeting.projectId}`);
    const existingTasks = existingTasksResponse.data;

    // Step 3: Get freelancer directory for the project
    const freelancersResponse = await axios.get(`${YOUR_BACKEND_API}/projects/${meeting.projectId}/freelancers`);
    const freelancers = freelancersResponse.data;
    
    // Create freelancer directory mapping
    const freelancerDirectory = {};
    freelancers.forEach(f => {
      freelancerDirectory[f.Id] = `${f.FirstName} ${f.LastName}`;
    });

    // Step 4: Get merged transcript from your FastAPI service
    console.log('📝 Fetching merged transcript...');
    const transcriptResponse = await axios.post(`${MERGE_TRANSCRIPT_API}/combine-transcripts-json`, {
      links: meeting.transcriptUrls || [] // Array of transcript URLs from your meeting
    });
    
    if (!transcriptResponse.data || transcriptResponse.data.error) {
      throw new Error('Failed to fetch merged transcript');
    }

    const transcriptItems = transcriptResponse.data;

    // Step 5: Generate tasks using your AI service
    console.log('🧠 Generating tasks with AI...');
    const taskGenerationResponse = await axios.post(`${TASK_GENERATOR_API}/generate-tasks`, {
      project_id: meeting.projectId.toString(),
      project_description: project.description || project.title,
      existing_tasks: existingTasks,
      transcript_items: transcriptItems,
      freelancer_directory: freelancerDirectory
    });

    if (!taskGenerationResponse.data || !taskGenerationResponse.data.tasks) {
      throw new Error('Failed to generate tasks');
    }

    const generatedTasks = taskGenerationResponse.data.tasks;

    // Step 6: Save generated tasks to your database
    console.log(`💾 Saving ${generatedTasks.length} generated tasks...`);
    const savedTasks = [];
    
    for (const task of generatedTasks) {
      try {
        const taskPayload = {
          title: task.title,
          description: task.description,
          estimatedDeadline: task.estimated_deadline,
          priority: task.priority,
          createdByUserId: task.created_by_id,
          assignedToUserId: task.freelancer_id,
          ProjectId: meeting.projectId,
          status: 0 // To Do status
        };

        const saveResponse = await axios.post(`${YOUR_BACKEND_API}/tasks`, taskPayload);
        savedTasks.push(saveResponse.data);
      } catch (error) {
        console.error(`Failed to save task: ${task.title}`, error.message);
      }
    }

    console.log(`✅ Successfully generated and saved ${savedTasks.length} tasks`);

    res.json({
      success: true,
      message: `Generated ${savedTasks.length} tasks from meeting transcript`,
      tasks: savedTasks,
      meetingId,
      projectId: meeting.projectId
    });

  } catch (error) {
    console.error('❌ AI Task Generation failed:', error.message);
    res.status(500).json({
      error: 'Failed to generate tasks from meeting',
      details: error.message
    });
  }
});

/**
 * GET /api/meetings/:meetingId/transcripts
 * Get transcript URLs for a meeting
 */
router.get('/meetings/:meetingId/transcripts', async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Get meeting details and return transcript URLs
    const meetingResponse = await axios.get(`${YOUR_BACKEND_API}/meetings/${meetingId}`);
    const meeting = meetingResponse.data;
    
    res.json({
      meetingId: parseInt(meetingId),
      transcriptUrls: meeting.transcriptUrls || [],
      hasTranscript: (meeting.transcriptUrls && meeting.transcriptUrls.length > 0)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch meeting transcripts',
      details: error.message
    });
  }
});

/**
 * GET /api/projects/:projectId/meetings
 * Get all meetings for a project
 */
router.get('/projects/:projectId/meetings', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get all meetings for the project
    const meetingsResponse = await axios.get(`${YOUR_BACKEND_API}/meetings/project/${projectId}`);
    const meetings = meetingsResponse.data;
    
    // Format meetings for the frontend
    const formattedMeetings = meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title || 'Untitled Meeting',
      description: meeting.description,
      agenda: meeting.agenda,
      createdAt: meeting.createdAt,
      participants: meeting.participants || [],
      hasTranscript: (meeting.transcriptUrls && meeting.transcriptUrls.length > 0)
    }));
    
    res.json(formattedMeetings);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch project meetings',
      details: error.message
    });
  }
});

module.exports = router; 