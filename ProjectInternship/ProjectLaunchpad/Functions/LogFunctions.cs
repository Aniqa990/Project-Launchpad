using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Models.Models.DTOs.LogDTO;
using ProjectLaunchpad.Models.Models.Enums;
using ProjectLaunchpad.Repositories.Repositories;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class LogFunctions
    {
        private readonly IUnitOfWork UnitOfWork;

        public LogFunctions(IUnitOfWork unitOfWork)
        {
            UnitOfWork = unitOfWork;
        }

        [Function("CreateLog")]
        public async Task<HttpResponseData> CreateLog(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = "logs")] HttpRequestData req)
        {
            var log = await req.ReadFromJsonAsync<CreateLogDto>();
            if (log == null)
            {
                throw new ArgumentNullException(nameof(log), "Log cannot be null");
            }

            var logEntity = new Logs
            {
                FreelancerId = log.FreelancerId,
                TaskId = log.TaskId,
                StartTime = log.StartTime ?? DateTime.UtcNow
            };

            await UnitOfWork.logRepository.AddAsync(logEntity);
            await UnitOfWork.SaveAsync();

            var res = req.CreateResponse(HttpStatusCode.Created);
            await res.WriteAsJsonAsync(logEntity);
            return res;

        }

        [Function("GetAll")]
        public async Task<HttpResponseData> GetAllLogs(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "logs")] HttpRequestData req)
        {
            var logs = await UnitOfWork.logRepository.GetAllAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(logs);
            return response;
        }

        [Function("GetLogByTaskId")]
        public async Task<HttpResponseData> GetLogByTaskId(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "logs/task/{taskId:int}")] HttpRequestData req,
            int taskId)
        {
            var log = await UnitOfWork.logRepository.GetByTaskIdAsync(taskId);
            if (log == null)
            {
                return req.CreateResponse(HttpStatusCode.NotFound);
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(log);
            return response;
        }

        [Function("GetLogsByProjectId")]
        public async Task<HttpResponseData> GetLogsByProjectId(
     [HttpTrigger(AuthorizationLevel.Function, "get", Route = "projects/{projectId}/logs")] HttpRequestData req,
     int projectId)
        {
            var logs = await UnitOfWork.logRepository.GetTasksByProjectIdAsync(projectId);

            var logDtos = logs.Select(l => new LogWithDetailsDto
            {
                Id = l.Id,
                FreelancerId = l.FreelancerId,
                TaskId = l.TaskId,
                TaskName = l.Task?.Title,
                ProjectId = l.ProjectId,
                ProjectName = l.Project?.ProjectTitle,
                StartTime = l.StartTime,
                EndTime = l.EndTime
            });

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(logDtos);
            return response;
        }



        [Function("GetLogsByFreelancerId")]
        public async Task<HttpResponseData> GetLogsByFreelancerId(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "logs/freelancer/{freelancerId:int}")] HttpRequestData req,
    int freelancerId)
        {
            var logs = await UnitOfWork.logRepository.GetLogsByFreelancerIdAsync(freelancerId);

            var logDtos = logs.Select(l => new LogWithDetailsDto
            {
                Id = l.Id,
                FreelancerId = l.FreelancerId,
                TaskId = l.TaskId,
                TaskName = l.Task?.Title,
                ProjectId = l.ProjectId,
                ProjectName = l.Project?.ProjectTitle,
                StartTime = l.StartTime,
                EndTime = l.EndTime
            });
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(logDtos);
            return response;

        }








    }
}
