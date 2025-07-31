using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.TaskDTO;
using ProjectLaunchpad.Models.Models.Enums;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using ProjectLaunchpad.Utility;
using System;
using System.IO;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class TaskFunctions
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly TokenAuthorization _auth;

        public TaskFunctions(IUnitOfWork unitOfWork, TokenAuthorization auth)
        {
            _unitOfWork = unitOfWork;
            _auth = auth;
        }

        [Function("GetAllTask")]
        public async Task<HttpResponseData> GetAllTask(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "tasks")] HttpRequestData req)
        {

            var tasks = await _unitOfWork.TaskRepository.GetAllAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(tasks);
            return response;
        }

        [Function("CreateTask")]
        public async Task<HttpResponseData> CreateTaskAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "tasks")] HttpRequestData req)
        {
            var (isAuthorized, user, unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer", "client");

            if (!isAuthorized)
                return unauthorizedResponse!;
            
            var dto = await req.ReadFromJsonAsync<CreateTaskDto>();

            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                EstimatedDeadline = dto.EstimatedDeadline,
                Status = KanbanTaskStatus.ToDo,
                Priority = dto.Priority,
                CreatedByUserId = dto.CreatedByUserId,
                AssignedToUserId = dto.AssignedToUserId,
                projectId = dto.ProjectId, // ✅ New line
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.TaskRepository.AddAsync(task);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(task);
            return response;
        }


        [Function("GetTasksByProjectId")]
        public async Task<HttpResponseData> GetTasksByProjectId(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "tasks/project/{projectId:int}")] HttpRequestData req,
    int projectId)
        {
            var tasks = await _unitOfWork.TaskRepository.GetTasksByProjectIdAsync(projectId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(tasks);
            return response;
        }


        [Function("UpdateTask")]
        public async Task<HttpResponseData> UpdateTaskAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "tasks/{id:int}")] HttpRequestData req, int id)
        {
            var (isAuthorized, user, unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer", "client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var dto = await req.ReadFromJsonAsync<UpdateTaskDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            var task = await _unitOfWork.TaskRepository.GetByIdAsync(id);
            if (task == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            if (!string.IsNullOrWhiteSpace(dto.Title)) task.Title = dto.Title;
            if (!string.IsNullOrWhiteSpace(dto.Description)) task.Description = dto.Description;
            if (dto.EstimatedDeadline.HasValue) task.EstimatedDeadline = dto.EstimatedDeadline;
            if (dto.Priority.HasValue) task.Priority = dto.Priority.Value;
            if (dto.Status.HasValue) task.Status = dto.Status.Value;
            if (dto.AssignedToUserId.HasValue) task.AssignedToUserId = dto.AssignedToUserId.Value;

            _unitOfWork.TaskRepository.Update(task);
            await _unitOfWork.SaveAsync();

            return req.CreateResponse(HttpStatusCode.OK);
        }

        [Function("DeleteTask")]
        public async Task<HttpResponseData> DeleteTaskAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "tasks/{id:int}")] HttpRequestData req, int id)
        {
            var (isAuthorized, user, unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer", "client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var task = await _unitOfWork.TaskRepository.GetByIdAsync(id);
            if (task == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            _unitOfWork.TaskRepository.Delete(task);
            await _unitOfWork.SaveAsync();

            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    
    
        [Function("SyncTasksFromAI")]
        public async Task<HttpResponseData> SyncTasksFromAI(
[HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "tasks/ai/sync")] HttpRequestData req)
        {
            Console.WriteLine("🔍 DEBUG - SyncTasksFromAI started");

            try
            {
                // ✅ Authorize client or freelancer
                var (isAuthorized, user, unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer", "client");
                if (!isAuthorized)
                {
                    Console.WriteLine("❌ DEBUG - Authorization failed");
                    return unauthorizedResponse!;
                }

                Console.WriteLine($"✅ DEBUG - Authorization successful for user:");

                // ✅ Parse JSON body into dictionary { tasks: [...] }
                var requestData = await req.ReadFromJsonAsync<Dictionary<string, List<AiTaskDto>>>();
                if (requestData == null || !requestData.TryGetValue("tasks", out var aiTasks) || aiTasks == null)
                {
                    Console.WriteLine("❌ DEBUG - Invalid request data or no tasks found");
                    return req.CreateResponse(HttpStatusCode.BadRequest);
                }

                Console.WriteLine($"✅ DEBUG - Received {aiTasks.Count} tasks to process");

                int tasksProcessed = 0;
                int tasksCreated = 0;
                int tasksUpdated = 0;

                foreach (var aiTask in aiTasks)
                {
                    Console.WriteLine($" DEBUG - Processing task: '{aiTask.title}'");

                    if (string.IsNullOrWhiteSpace(aiTask.title) || string.IsNullOrWhiteSpace(aiTask.project_id))
                    {
                        Console.WriteLine($"⚠️ DEBUG - Skipping task due to missing title or project ID");
                        Console.WriteLine($"  Title: '{aiTask.title}'");
                        Console.WriteLine($"  ProjectId: '{aiTask.project_id}'");
                        continue;
                    }

                    // ✅ Parse project ID from "project1" → 1
                    if (!int.TryParse(aiTask.project_id.Replace("project", ""), out var numericProjectId))
                    {
                        Console.WriteLine($"❌ DEBUG - Failed to parse project ID: {aiTask.project_id}");
                        continue;
                    }

                    Console.WriteLine($"🔍 DEBUG - Parsed project ID: {numericProjectId}");

                    // ✅ Check if task already exists by title + project ID
                    var existingTask = await _unitOfWork.TaskRepository
                        .FindTaskByTitleAndProjectAsync(aiTask.title, numericProjectId);

                    if (existingTask != null)
                    {
                        Console.WriteLine($"🔍 DEBUG - Updating existing task: ID={existingTask.Id}, Title='{existingTask.Title}'");

                        // ✅ Update existing task fields conditionally
                        if (!string.IsNullOrWhiteSpace(aiTask.description))
                        {
                            Console.WriteLine($"🔍 DEBUG - Updating description: '{existingTask.Description}' → '{aiTask.description}'");
                            existingTask.Description = aiTask.description;
                        }

                        if (aiTask.priority != 0)
                        {
                            Console.WriteLine($"🔍 DEBUG - Updating priority: {existingTask.Priority} → {aiTask.priority}");
                            existingTask.Priority = (KanbanTaskPriorityLevel)aiTask.priority;
                        }

                        Console.WriteLine($"🔍 DEBUG - Updating status: {existingTask.Status} → {aiTask.status}");
                        existingTask.Status = (KanbanTaskStatus)aiTask.status;

                        if (!string.Equals(aiTask.estimated_deadline, "NA", StringComparison.OrdinalIgnoreCase) &&
                            DateTime.TryParse(aiTask.estimated_deadline, out var parsedDeadline))
                        {
                            Console.WriteLine($"🔍 DEBUG - Updating deadline: {existingTask.EstimatedDeadline} → {parsedDeadline}");
                            existingTask.EstimatedDeadline = parsedDeadline;
                        }

                        _unitOfWork.TaskRepository.Update(existingTask);
                        tasksUpdated++;
                        Console.WriteLine($"✅ DEBUG - Existing task updated successfully");
                    }
                    else
                    {
                        Console.WriteLine($"🔍 DEBUG - Creating new task: '{aiTask.title}' for project {numericProjectId}");

                        // ✅ Prepare new task object
                        DateTime? deadline = null;
                        if (!string.Equals(aiTask.estimated_deadline, "NA", StringComparison.OrdinalIgnoreCase) &&
                            DateTime.TryParse(aiTask.estimated_deadline, out var parsedDeadline))
                        {
                            deadline = parsedDeadline;
                            Console.WriteLine($"🔍 DEBUG - Setting deadline: {deadline}");
                        }

                        var newTask = new TaskItem
                        {
                            Title = aiTask.title,
                            Description = aiTask.description ?? "",
                            EstimatedDeadline = deadline,
                            Priority = (KanbanTaskPriorityLevel)aiTask.priority,
                            Status = (KanbanTaskStatus)aiTask.status,
                            CreatedByUserId = aiTask.created_by_id,
                            AssignedToUserId = aiTask.freelancer_id,
                            projectId = numericProjectId,
                            CreatedAt = DateTime.UtcNow
                        };

                        Console.WriteLine($"🔍 DEBUG - New task details:");
                        Console.WriteLine($"  Title: {newTask.Title}");
                        Console.WriteLine($"  Description: {newTask.Description}");
                        Console.WriteLine($"  Priority: {newTask.Priority}");
                        Console.WriteLine($"  Status: {newTask.Status}");
                        Console.WriteLine($"  CreatedByUserId: {newTask.CreatedByUserId}");
                        Console.WriteLine($"  AssignedToUserId: {newTask.AssignedToUserId}");
                        Console.WriteLine($"  ProjectId: {newTask.projectId}");
                        Console.WriteLine($"  CreatedAt: {newTask.CreatedAt}");

                        await _unitOfWork.TaskRepository.AddAsync(newTask);
                        tasksCreated++;
                        Console.WriteLine($"✅ DEBUG - New task added to repository");
                    }

                    tasksProcessed++;
                }

                Console.WriteLine($"🔍 DEBUG - Summary before save:");
                Console.WriteLine($"  Tasks processed: {tasksProcessed}");
                Console.WriteLine($"  Tasks created: {tasksCreated}");
                Console.WriteLine($"  Tasks updated: {tasksUpdated}");

                Console.WriteLine("🔍 DEBUG - About to save changes to database...");
                await _unitOfWork.SaveAsync();
                Console.WriteLine("✅ DEBUG - Changes saved successfully to database!");

                // ✅ Return a proper JSON response (NO MANUAL Content-Type HEADER!)
                var response = req.CreateResponse(HttpStatusCode.OK);

                var result = new
                {
                    success = true,
                    message = "Tasks synced successfully",
                    tasksProcessed = tasksProcessed,
                    tasksCreated = tasksCreated,
                    tasksUpdated = tasksUpdated
                };

                Console.WriteLine($"🔍 DEBUG - Returning response: {System.Text.Json.JsonSerializer.Serialize(result)}");
                await response.WriteAsJsonAsync(result);
                return response;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ DEBUG - Exception in SyncTasksFromAI: {ex.Message}");
                Console.WriteLine($"❌ DEBUG - Stack trace: {ex.StackTrace}");

                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                var errorResult = new
                {
                    success = false,
                    message = "Error syncing tasks",
                    error = ex.Message
                };
                await errorResponse.WriteAsJsonAsync(errorResult);
                return errorResponse;
            }
        }

    }
}


