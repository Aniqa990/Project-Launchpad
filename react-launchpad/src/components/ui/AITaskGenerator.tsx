import React, { useState } from 'react';
import { Button } from './button';
import { Card } from './card';
import { 
  Brain, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react';
import { 
  getMeetingsByProjectId, 
  getMeetingDetails, 
  getProjectDetails, 
  getTasksByProjectId, 
  getFreelancersByProject, 
  syncTasksFromAI,
  getAudioByMeetingId
} from '../../apiendpoints';

interface AITaskGeneratorProps {
  projectId: number;
  onTasksGenerated: () => void;
}

export function AITaskGenerator({ projectId, onTasksGenerated }: AITaskGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generateAITasks = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setStatus('Starting AI task generation...');

    try {
      // Step 1: Get project details
      setStatus('Fetching project details...');
      const projectDetails = await getProjectDetails(projectId);
      console.log('🔍 Step 1 - Project Details:', projectDetails);
      
      // Step 2: Get meetings for this project
      setStatus('Fetching project meetings...');
      const meetings = await getMeetingsByProjectId(projectId);
      console.log('🔍 Step 2 - Project Meetings:', meetings);
      
      if (!meetings || meetings.length === 0) {
        throw new Error('No meetings found for this project');
      }

      // Step 3: Get existing tasks
      setStatus('Fetching existing tasks...');
      const existingTasks = await getTasksByProjectId(projectId);
      console.log('🔍 Step 3 - Existing Tasks:', existingTasks);
      console.log('🔍 Step 3 - Current task count in database:', existingTasks.length);
      
      // Step 4: Get freelancers
      setStatus('Fetching project freelancers...');
      const freelancers = await getFreelancersByProject(projectId);
      console.log('🔍 Step 4 - Project Freelancers:', freelancers);
      
      // Create freelancer directory
      const freelancerDirectory: { [key: number]: string } = {};
      freelancers.forEach((f: any) => {
        freelancerDirectory[f.Id] = `${f.FirstName} ${f.LastName}`;
      });
      console.log('🔍 Step 4 - Freelancer Directory:', freelancerDirectory);

      // Step 5: Collect all transcript URLs from meetings
      setStatus('Collecting meeting transcripts...');
      const allTranscriptUrls: string[] = [];
      
      for (const meeting of meetings) {
        try {
          console.log(`🔍 Step 5 - Processing meeting ${meeting.id}:`, meeting);
          // Get transcript URLs using the audio endpoint
          const audioData = await getAudioByMeetingId(meeting.id);
          console.log(`🔍 Step 5 - Audio data for meeting ${meeting.id}:`, audioData);
          
          // Extract transcript URLs from the audio data
          // The response format is: { "Link1": "url", "UserId1": 2, "Username1": "name" }
          if (audioData && audioData.Link1 && audioData.Link1.trim() !== '') {
            allTranscriptUrls.push(audioData.Link1);
            console.log(`🔍 Step 5 - Added transcript URL for meeting ${meeting.id}:`, audioData.Link1);
          }
          
          // If there are more links (Link2, Link3, etc.), add them too
          for (let i = 2; i <= 10; i++) {
            const linkKey = `Link${i}`;
            if (audioData && audioData[linkKey] && audioData[linkKey].trim() !== '') {
              allTranscriptUrls.push(audioData[linkKey]);
              console.log(`🔍 Step 5 - Added transcript URL ${i} for meeting ${meeting.id}:`, audioData[linkKey]);
            }
          }
        } catch (error) {
          console.error(`🔍 Step 5 - Error processing meeting ${meeting.id}:`, error);
          // Continue with other meetings
        }
      }

      console.log('🔍 Step 5 - All collected transcript URLs:', allTranscriptUrls);

      if (allTranscriptUrls.length === 0) {
        throw new Error(`No transcript URLs found in ${meetings.length} project meetings. Please ensure meetings have transcript files uploaded via the meeting room.`);
      }

      // Step 6: Call merge transcript service
      setStatus('Merging transcripts...');
      console.log('🔍 Step 6 - Calling merge service with URLs:', allTranscriptUrls);
      const mergeResponse = await fetch('http://127.0.0.1:8002/combine-transcripts-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          links: allTranscriptUrls
        })
      });

      console.log('🔍 Step 6 - Merge service response status:', mergeResponse.status);
      console.log('🔍 Step 6 - Merge service response headers:', mergeResponse.headers);

      if (!mergeResponse.ok) {
        const errorText = await mergeResponse.text();
        console.error('🔍 Step 6 - Merge service error response:', errorText);
        throw new Error(`Failed to merge transcripts: ${mergeResponse.status} ${errorText}`);
      }

      const transcriptItems = await mergeResponse.json();
      console.log('🔍 Step 6 - Merged transcript items:', transcriptItems);

      // Step 7: Call task generator service
      setStatus('Generating tasks with AI...');
      const taskGeneratorPayload = {
        project_id: `project${projectId}`,
        project_description: projectDetails.description || projectDetails.title || 'Project',
        existing_tasks: existingTasks.map((task: any) => ({
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
      };
      
      console.log('🔍 Step 7 - Task generator payload:', taskGeneratorPayload);
      console.log('🔍 Step 7 - Calling task generator service...');
      
      const taskGeneratorResponse = await fetch('http://127.0.0.1:8001/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskGeneratorPayload)
      });

      console.log('🔍 Step 7 - Task generator response status:', taskGeneratorResponse.status);
      console.log('🔍 Step 7 - Task generator response headers:', taskGeneratorResponse.headers);

      if (!taskGeneratorResponse.ok) {
        const errorText = await taskGeneratorResponse.text();
        console.error('🔍 Step 7 - Task generator error response:', errorText);
        throw new Error(`Failed to generate tasks with AI: ${taskGeneratorResponse.status} ${errorText}`);
      }

      const generatedTasks = await taskGeneratorResponse.json();
      console.log('🔍 Step 7 - Generated tasks from AI:', generatedTasks);

      // Step 8: Save tasks to database
      setStatus('Saving generated tasks...');
      console.log('🔍 Step 8 - Saving tasks to database:', generatedTasks.tasks);
      console.log('🔍 Step 8 - Task count to save:', generatedTasks.tasks.length);
      
      try {
        const saveResult = await syncTasksFromAI(generatedTasks.tasks);
              console.log('🔍 Step 8 - Save result:', saveResult);
      console.log('🔍 Step 8 - Save successful!');
      
      // Check if new tasks were actually added
      console.log('🔍 Step 8 - Checking if new tasks were added...');
      const tasksAfterSave = await getTasksByProjectId(projectId);
      console.log('🔍 Step 8 - Tasks after save:', tasksAfterSave);
      console.log('🔍 Step 8 - Task count after save:', tasksAfterSave.length);
      console.log('🔍 Step 8 - New tasks added:', tasksAfterSave.length - existingTasks.length);
      } catch (saveError) {
        console.error('🔍 Step 8 - Save error:', saveError);
        throw saveError;
      }

      setSuccess(`Successfully generated ${generatedTasks.tasks.length} tasks from meeting transcripts!`);
      
      // Add a small delay to ensure the database save is complete
      console.log('🔍 Step 8 - Waiting 2 seconds before refreshing board...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('🔍 Step 8 - Calling onTasksGenerated to refresh board...');
      onTasksGenerated(); // Refresh the Kanban board
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (err: any) {
      console.error('🔍 AI Task Generation failed:', err);
      setError(err.message || 'Failed to generate AI tasks');
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  // Test function with mock transcript data
  const generateAITasksWithMockData = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setStatus('Testing with mock transcript data...');

    try {
      // Step 1: Get project details
      setStatus('Fetching project details...');
      const projectDetails = await getProjectDetails(projectId);
      console.log('🧪 Mock Test - Project Details:', projectDetails);
      
      // Step 2: Get existing tasks
      setStatus('Fetching existing tasks...');
      const existingTasks = await getTasksByProjectId(projectId);
      console.log('🧪 Mock Test - Existing Tasks:', existingTasks);
      console.log('🧪 Mock Test - Current task count:', existingTasks.length);
      
      // Step 3: Get freelancers
      setStatus('Fetching project freelancers...');
      const freelancers = await getFreelancersByProject(projectId);
      console.log('🧪 Mock Test - Project Freelancers:', freelancers);
      
      const freelancerDirectory: { [key: number]: string } = {};
      freelancers.forEach((f: any) => {
        freelancerDirectory[f.Id] = `${f.FirstName} ${f.LastName}`;
      });
      
      // Add the client (Matiullah) to the directory for proper mapping
      freelancerDirectory[1] = "Matiullah Yousfani"; // Assuming Matiullah has ID 1
      
      console.log('🧪 Mock Test - Freelancer Directory:', freelancerDirectory);

      // Step 4: Create mock transcript data
      setStatus('Creating mock transcript data...');
      const mockTranscriptItems = [
        {
          timestamp: "[00:00:01]",
          text: "Matiullah (Client): Hello team, let's assign some tasks."
        },
        {
          timestamp: "[00:00:05]",
          text: "Matiullah (Client): Moiz, I need you to create a new task for payment gateway integration."
        },
        {
          timestamp: "[00:00:10]",
          text: "moiz habib (Freelancer): Understood. I will create a task for payment gateway integration."
        },
        {
          timestamp: "[00:00:15]",
          text: "Matiullah (Client): The task should be high priority and due by Wednesday."
        },
        {
          timestamp: "[00:00:20]",
          text: "moiz habib (Freelancer): I'll set the priority to high and deadline to Wednesday."
        },
        {
          timestamp: "[00:00:25]",
          text: "Matiullah (Client): Perfect. Please start working on this task immediately."
        }
      ];
      console.log('🧪 Mock Test - Mock transcript items:', mockTranscriptItems);

      // Step 5: Call task generator service with mock data
      setStatus('Generating tasks with mock data...');
      const taskGeneratorPayload = {
        project_id: `project${projectId}`,
        project_description: projectDetails.Description || projectDetails.ProjectTitle || 'Project',
        existing_tasks: existingTasks.map((task: any) => ({
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
        transcript_items: mockTranscriptItems,
        freelancer_directory: freelancerDirectory
      };
      
      console.log('🧪 Mock Test - Task generator payload:', taskGeneratorPayload);
      console.log('🧪 Mock Test - Freelancer directory being sent:', freelancerDirectory);
      console.log('🧪 Mock Test - Mock transcript being sent:', mockTranscriptItems);
      console.log('🧪 Mock Test - Calling task generator service...');
      console.log('🧪 Mock Test - Service URL: http://127.0.0.1:8001/generate-tasks');
      
      // 🔍 DEBUG: Show exact JSON being sent
      console.log('🔍 DEBUG - EXACT JSON BEING SENT TO AI SERVICE:');
      console.log(JSON.stringify(taskGeneratorPayload, null, 2));
      
      // 🔄 Retry logic for inconsistent AI service
      let taskGeneratorResponse;
      let generatedTasks;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        console.log(`🔄 AI Service - Attempt ${retryCount + 1}/${maxRetries}`);
        
        taskGeneratorResponse = await fetch('http://127.0.0.1:8001/generate-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskGeneratorPayload)
        });

        if (!taskGeneratorResponse.ok) {
          const errorText = await taskGeneratorResponse.text();
          console.error(`🔄 AI Service - Attempt ${retryCount + 1} failed:`, errorText);
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to generate tasks with AI after ${maxRetries} attempts: ${taskGeneratorResponse.status} ${errorText}`);
          }
          continue;
        }

        const responseText = await taskGeneratorResponse.text();
        generatedTasks = JSON.parse(responseText);
        
        console.log(`🔄 AI Service - Attempt ${retryCount + 1} response:`, generatedTasks);
        
        // If we got tasks, break out of retry loop
        if (generatedTasks.tasks && generatedTasks.tasks.length > 0) {
          console.log(`✅ AI Service - Success on attempt ${retryCount + 1} with ${generatedTasks.tasks.length} tasks`);
          break;
        }
        
        console.log(`⚠️ AI Service - Attempt ${retryCount + 1} returned 0 tasks, retrying...`);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          console.warn(`❌ AI Service - All ${maxRetries} attempts returned 0 tasks`);
          break;
        }
        
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('🧪 Mock Test - Task generator response status:', taskGeneratorResponse.status);
      console.log('🧪 Mock Test - Task generator response headers:', taskGeneratorResponse.headers);

      // 🔍 DEBUG: Show exact response details
      console.log('🔍 DEBUG - AI SERVICE RESPONSE DETAILS:');
      console.log('Status:', taskGeneratorResponse.status);
      console.log('Headers:', Object.fromEntries(taskGeneratorResponse.headers.entries()));
      console.log('Raw Response Text:', JSON.stringify(generatedTasks));
      console.log('Response Length:', JSON.stringify(generatedTasks).length);
      console.log('🧪 Mock Test - Generated tasks from AI:', generatedTasks);
      console.log('🧪 Mock Test - Number of tasks generated:', generatedTasks.tasks?.length || 0);
      
      if (generatedTasks.tasks?.length === 0) {
        console.warn('🧪 Mock Test - WARNING: No tasks were generated by AI service!');
        console.warn('🧪 Mock Test - This might be due to:');
        console.warn('🧪 Mock Test - 1. Names in transcript not matching freelancer directory');
        console.warn('🧪 Mock Test - 2. AI service not recognizing task assignment content');
        console.warn('🧪 Mock Test - 3. AI service configuration issues');
      }

      // Step 6: Save tasks to database
      setStatus('Saving generated tasks...');
      
      // Map AI task format to backend format - ONLY NEW TASKS
      const mappedTasks = generatedTasks.tasks
        .filter((task: any) => {
          // Filter out existing tasks (check if task already exists)
          const isExistingTask = existingTasks.some((existingTask: any) => 
            existingTask.Title === task.title
          );
          return !isExistingTask; // Only keep NEW tasks
        })
        .map((task: any) => {
          const mappedTask = {
            title: task.title,
            description: task.description || '',
            estimated_deadline: task.estimated_deadline,
            priority: task.priority,
            status: task.status,
            created_by_id: task.created_by_id,
            freelancer_id: task.freelancer_id,
            project_id: task.project_id
          };
          
          // 🔍 DEBUG: Log each NEW mapped task
          console.log('🔍 DEBUG - NEW mapped task:', mappedTask);
          return mappedTask;
        });
      
      console.log('🧪 Mock Test - Original AI tasks:', generatedTasks.tasks);
      console.log('🧪 Mock Test - Mapped tasks for backend:', mappedTasks);
      console.log('🧪 Mock Test - Task count to save:', mappedTasks.length);
      
      // Log each mapped task in detail
      mappedTasks.forEach((task, index) => {
        console.log(`🧪 Mock Test - Mapped task ${index + 1}:`, {
          title: task.title,
          description: task.description,
          estimated_deadline: task.estimated_deadline,
          priority: task.priority,
          status: task.status,
          created_by_id: task.created_by_id,
          freelancer_id: task.freelancer_id,
          project_id: task.project_id
        });
      });
      
      try {
        // 🔍 DEBUG: Show exact data being sent to backend
        console.log('🔍 DEBUG - DATA BEING SENT TO BACKEND:');
        console.log('Mapped tasks:', mappedTasks);
        console.log('JSON stringified:', JSON.stringify(mappedTasks, null, 2));
        
        const saveResult = await syncTasksFromAI(mappedTasks);
        console.log('🧪 Mock Test - Save result:', saveResult);
        console.log('🧪 Mock Test - Save result type:', typeof saveResult);
        console.log('🧪 Mock Test - Save result keys:', Object.keys(saveResult || {}));
        console.log('🧪 Mock Test - Save successful!');
        
        // Check if new tasks were actually added
        console.log('🧪 Mock Test - Checking if new tasks were added...');
        const tasksAfterSave = await getTasksByProjectId(projectId);
        console.log('🧪 Mock Test - Tasks after save:', tasksAfterSave);
        
        // 🔍 DEBUG: Log the raw API response
        console.log('🔍 DEBUG - Raw API response from getTasksByProjectId:');
        console.log('  Response type:', typeof tasksAfterSave);
        console.log('  Response length:', Array.isArray(tasksAfterSave) ? tasksAfterSave.length : 'Not an array');
        console.log('  Full response:', JSON.stringify(tasksAfterSave, null, 2));
      console.log('🧪 Mock Test - Task count after save:', tasksAfterSave.length);
      console.log('🧪 Mock Test - New tasks added:', tasksAfterSave.length - existingTasks.length);
      
      // 🔍 DEBUG: Show detailed task comparison
      console.log('🔍 DEBUG - EXISTING TASKS BEFORE SAVE:');
      existingTasks.forEach((task: any, index: number) => {
        console.log(`  Task ${index + 1}: ID=${task.Id}, Title="${task.Title}"`);
      });
      
      console.log('🔍 DEBUG - TASKS AFTER SAVE:');
      tasksAfterSave.forEach((task: any, index: number) => {
        console.log(`  Task ${index + 1}: ID=${task.Id}, Title="${task.Title}"`);
      });
      
      // 🔍 DEBUG: Check if new task exists by title
      const newTaskTitle = "Payment Gateway Integration";
      const newTaskExists = tasksAfterSave.some((task: any) => task.Title === newTaskTitle);
      console.log(`🔍 DEBUG - New task "${newTaskTitle}" exists:`, newTaskExists);
      } catch (saveError) {
        console.error('🧪 Mock Test - Save error:', saveError);
        throw saveError;
      }

      setSuccess(`Successfully generated ${generatedTasks.tasks.length} tasks from mock transcript!`);
      
      // Add a small delay to ensure the database save is complete
      console.log('🧪 Mock Test - Waiting 2 seconds before refreshing board...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('🧪 Mock Test - Calling onTasksGenerated to refresh board...');
      onTasksGenerated(); // Refresh the Kanban board
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (err: any) {
      console.error('🧪 Mock Test - AI Task Generation failed:', err);
      setError(err.message || 'Failed to generate AI tasks');
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Task Generator</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600">
          Generate tasks automatically from meeting transcripts using AI. 
          This will analyze all meeting transcripts for this project and create relevant tasks.
        </p>
        
        {/* Requirements */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Requirements:</p>
          <p>• Project must have meetings with transcript files uploaded</p>
          <p>• Transcript files should be accessible via Cloudinary URLs</p>
          <p>• FastAPI services must be running on ports 8001 (task generator) and 8002 (merge transcript)</p>
        </div>

        {/* Status Messages */}
        {status && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-blue-800 text-sm">{status}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-800 text-sm">{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={generateAITasks}
          disabled={isGenerating}
          variant="primary"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating Tasks...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Generate AI Task Result
            </>
          )}
        </Button>

        {/* Test with Mock Data Button */}
        <Button
          onClick={generateAITasksWithMockData}
          disabled={isGenerating}
          variant="secondary"
          className="w-full mt-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Testing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Test with Mock Transcript
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-xs text-gray-500">
          <p>• Analyzes all meeting transcripts for this project</p>
          <p>• Creates tasks with appropriate priorities and assignments</p>
          <p>• Integrates with your existing Kanban workflow</p>
        </div>
      </div>
    </Card>
  );
} 