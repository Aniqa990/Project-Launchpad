using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.TaskDTO;
using ProjectLaunchpad.Models.Models.Enums;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
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

        public TaskFunctions(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [Function("GetAllTask")]
        public async Task<HttpResponseData> GetAllTask(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "tasks")] HttpRequestData req)
        {
            var tasks = await _unitOfWork.TaskRepository.GetAllAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(tasks);
            return response;
        }

        [Function("CreateTask")]
        public async Task<HttpResponseData> CreateTaskAsync(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = "tasks")] HttpRequestData req)
        {

            
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
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.TaskRepository.AddAsync(task);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(task);
            return response;
        }

        [Function("UpdateTask")]
        public async Task<HttpResponseData> UpdateTaskAsync(
            [HttpTrigger(AuthorizationLevel.Function, "put", Route = "tasks/{id:int}")] HttpRequestData req, int id)
        {
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
            [HttpTrigger(AuthorizationLevel.Function, "delete", Route = "tasks/{id:int}")] HttpRequestData req, int id)
        {
            var task = await _unitOfWork.TaskRepository.GetByIdAsync(id);
            if (task == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            _unitOfWork.TaskRepository.Delete(task);
            await _unitOfWork.SaveAsync();

            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}
