using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Models.Models.DTOs.TaskDTO;
using ProjectLaunchpad.Models.Models.Enums;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System.Net;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class SubTaskFunction
    {
        private readonly IUnitOfWork _unitOfWork;

        public SubTaskFunction(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }


        [Function("GetAllSubTask")]
        public async Task<HttpResponseData> GetAllSubTask(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "subtasks")] HttpRequestData req)
        {
            var subtasks = await _unitOfWork.SubTaskRepository.GetAllAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(subtasks);
            return response;
        }


        [Function("GetAllSubTaskByParentId")]
        public async Task<HttpResponseData> GetAllSubTaskByParentId(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "subtasks/parent/{parentId:int}")] HttpRequestData req,
    int parentId)
        {
            var subtasks = await _unitOfWork.SubTaskRepository.GetAllAsync(parentId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(subtasks);
            return response;
        }


        [Function("CreateSubtask")]
        public async Task<HttpResponseData> CreateSubTask(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = "subtasks")] HttpRequestData req)
        {

            var dto = await req.ReadFromJsonAsync<CreateSubtaskDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            var subtask = new Subtask
            {
                Title = dto.Title,
                Description = dto.Description,
                DueDate = dto.DueDate,
                TaskItemId = dto.TaskItemId,
                Status = KanbanSubtaskStatus.ToDo
            };

            await _unitOfWork.SubTaskRepository.AddAsync(subtask);
            await _unitOfWork.SaveAsync();

            var result = new SubtaskDto
            {
                Id = subtask.Id,
                Title = subtask.Title,
                Description = subtask.Description,
                DueDate = subtask.DueDate,
                Status = subtask.Status
            };

            var res = req.CreateResponse(HttpStatusCode.Created);
            await res.WriteAsJsonAsync(result);
            return res;
        }

        [Function("UpdateSubTask")]
        public async Task<HttpResponseData> UpdateSubTaskAsync(
            [HttpTrigger(AuthorizationLevel.Function, "put", Route = "subtasks/{id:int}")] HttpRequestData req,
            int id)
        {
            var dto = await req.ReadFromJsonAsync<UpdateSubTaskDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            var task = await _unitOfWork.SubTaskRepository.GetByIdAsync(id);
            if (task == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            if (!string.IsNullOrWhiteSpace(dto.Title)) task.Title = dto.Title;
            if (!string.IsNullOrWhiteSpace(dto.Description)) task.Description = dto.Description;
            if (dto.Status.HasValue) task.Status = dto.Status.Value;
            if (dto.DueDate.HasValue) task.DueDate = dto.DueDate.Value;

            _unitOfWork.SubTaskRepository.Update(task);
            await _unitOfWork.SaveAsync();

            return req.CreateResponse(HttpStatusCode.OK);
        }

        [Function("DeleteSubTask")]
        public async Task<HttpResponseData> DeleteSubTaskAsync(
            [HttpTrigger(AuthorizationLevel.Function, "delete", Route = "subtasks/{id:int}")] HttpRequestData req,
            int id)
        {
            var task = await _unitOfWork.SubTaskRepository.GetByIdAsync(id);
            if (task == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            _unitOfWork.SubTaskRepository.Delete(task);
            await _unitOfWork.SaveAsync();

            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}
