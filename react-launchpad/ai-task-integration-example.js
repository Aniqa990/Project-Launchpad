// Example Backend Integration for AI Task Generation
// This shows how the frontend connects to your existing APIs and FastAPI services

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Configuration - Update these URLs to match your setup
const MERGE_TRANSCRIPT_API = 'http://127.0.0.1:8000'; // Your merge transcript FastAPI
const TASK_GENERATOR_API = 'http://127.0.0.1:8001';   // Your task generator FastAPI
const YOUR_BACKEND_API = 'http://localhost:7053/api'; // Your existing backend

/**
 * Example of how the frontend orchestrates the entire process:
 * 
 * 1. Frontend calls your existing APIs to get data
 * 2. Frontend calls FastAPI services directly
 * 3. Frontend calls your SyncTasksFromAI endpoint
 */

// This is what the frontend does step by step:

async function exampleAITaskGeneration(projectId) {
  try {
    console.log(`🚀 Starting AI task generation for project ${projectId}`);

    // Step 1: Get project details
    const projectResponse = await axios.get(`${YOUR_BACKEND_API}/projects/${projectId}`);
    const project = projectResponse.data;

    // Step 2: Get meetings for this project
    const meetingsResponse = await axios.get(`${YOUR_BACKEND_API}/projects/${projectId}/meetings`);
    const meetings = meetingsResponse.data;

    // Step 3: Get existing tasks
    const tasksResponse = await axios.get(`${YOUR_BACKEND_API}/tasks/project/${projectId}`);
    const existingTasks = tasksResponse.data;

    // Step 4: Get freelancers
    const freelancersResponse = await axios.get(`${YOUR_BACKEND_API}/projects/${projectId}/freelancers`);
    const freelancers = freelancersResponse.data;

    // Step 5: Collect transcript URLs from all meetings
    const allTranscriptUrls = [];
    for (const meeting of meetings) {
      const meetingDetails = await axios.get(`${YOUR_BACKEND_API}/meetings/${meeting.id}/details`);
      if (meetingDetails.data.transcriptUrls) {
        allTranscriptUrls.push(...meetingDetails.data.transcriptUrls);
      }
    }

    // Step 6: Call merge transcript service
    const mergeResponse = await axios.post(`${MERGE_TRANSCRIPT_API}/combine-transcripts-json`, {
      links: allTranscriptUrls
    });
    const transcriptItems = mergeResponse.data;

    // Step 7: Call task generator service
    const freelancerDirectory = {};
    freelancers.forEach(f => {
      freelancerDirectory[f.Id] = `${f.FirstName} ${f.LastName}`;
    });

    const taskGeneratorResponse = await axios.post(`${TASK_GENERATOR_API}/generate-tasks`, {
      project_id: `project${projectId}`,
      project_description: project.description || project.title,
      existing_tasks: existingTasks.map(task => ({
        Id: task.Id,
        Title: task.Title,
        Description: task.Description || 'NA',
        EstimatedDeadline: task.EstimatedDeadline || 'NA',
        Priority: task.Priority,
        Status: task.Status,
        CreatedAt: task.CreatedAt,
        CreatedByUser: {
          FirstName: task.CreatedByUser?.FirstName || 'Unknown',
          LastName: task.CreatedByUser?.LastName || 'User'
        },
        AssignedToUser: {
          FirstName: task.AssignedToUser?.FirstName || 'Unknown',
          LastName: task.AssignedToUser?.LastName || 'User'
        }
      })),
      transcript_items: transcriptItems,
      freelancer_directory: freelancerDirectory
    });

    const generatedTasks = taskGeneratorResponse.data;

    // Step 8: Save tasks using your existing endpoint
    await axios.post(`${YOUR_BACKEND_API}/tasks/ai/sync`, {
      tasks: generatedTasks.tasks
    });

    console.log(`✅ Successfully generated ${generatedTasks.tasks.length} tasks`);
    return generatedTasks.tasks;

  } catch (error) {
    console.error('❌ AI Task Generation failed:', error.message);
    throw error;
  }
}

// Example usage:
// exampleAITaskGeneration(4).then(tasks => console.log('Generated tasks:', tasks));

module.exports = router; 