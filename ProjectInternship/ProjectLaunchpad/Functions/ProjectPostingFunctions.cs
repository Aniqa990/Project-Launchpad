using Azure;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class ProjectPostingFunctions
    {
        private readonly IUnitOfWork _unitOfWork;

        public ProjectPostingFunctions(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [Function("CreateProjectPosting")]
        public async Task<HttpResponseData> CreateProjectPosting(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "projects")] HttpRequestData req)
        {
            var project = await req.ReadFromJsonAsync<ProjectPosting>();
            await _unitOfWork.Posting.AddProjectPostingAsync(project);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(project);
            return response;
        }

        [Function("GetAllProjectPostings")]
        public async Task<HttpResponseData> GetAllProjectPostings(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "projects")] HttpRequestData req)
        {
            //var projects = await _unitOfWork.Posting.GetAllProjectPostingsAsync();

            //var response = req.CreateResponse(HttpStatusCode.OK);
            //await response.WriteAsJsonAsync(projects);
            var projects = await _unitOfWork.Posting.GetAllProjectPostingsAsync();

            var projectDTOs = projects.Select(p => new ProjectPostingDTO
            {
                Id = p.Id,
                ProjectTitle = p.ProjectTitle,
                Description = p.Description,
                PaymentType = p.PaymentType,
                CategoryOrDomain = p.CategoryOrDomain,
                Deadline = p.Deadline,
                RequiredSkills = p.RequiredSkills,
                Budget = p.Budget,
                NumberOfFreelancers = p.NumberOfFreelancers,
                Milestones = p.Milestones,
                AttachedDocumentPath = p.AttachedDocumentPath
            }).ToList();


            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projectDTOs);
            return response;
        }

        [Function("GetProjectPostingById")]
        public async Task<HttpResponseData> GetProjectPostingById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "projects/{id:int}")] HttpRequestData req,
            int id)
        {
            var project = await _unitOfWork.Posting.GetProjectPostingByIdAsync(id);
            var response = req.CreateResponse(project != null ? HttpStatusCode.OK : HttpStatusCode.NotFound);
            await response.WriteAsJsonAsync(project);
            return response;
        }

        [Function("UpdateProjectPosting")]
        public async Task<HttpResponseData> UpdateProjectPosting(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "projects/{id:int}")] HttpRequestData req,
            int id)
        {
            var updatedProject = await req.ReadFromJsonAsync<ProjectPosting>();
            updatedProject.Id = id;
            await _unitOfWork.Posting.UpdateProjectPostingAsync(updatedProject);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(updatedProject);
            return response;
        }

        [Function("DeleteProjectPosting")]
        public async Task<HttpResponseData> DeleteProjectPosting(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "projects/{id:int}")] HttpRequestData req,
            int id)
        {
            await _unitOfWork.Posting.DeleteProjectPostingAsync(id);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.NoContent);
            return response;
        }

        [Function("GetProjectPostingsByCategory")]
        public async Task<HttpResponseData> GetProjectPostingsByCategory(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "projects/category/{category}")] HttpRequestData req,
            string category)
        {
            var projects = await _unitOfWork.Posting.GetProjectPostingsByCategoryAsync(category);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projects);
            return response;
        }

        [Function("GetProjectPostingsByDeadlineRange")]
        public async Task<HttpResponseData> GetProjectPostingsByDeadlineRange(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "projects/deadline")] HttpRequestData req)
        {
            var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
            DateTime.TryParse(query["start"], out var start);
            DateTime.TryParse(query["end"], out var end);

            var projects = await _unitOfWork.Posting.GetProjectPostingsByDeadlineRangeAsync(start, end);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projects);
            return response;
        }
    }
}
