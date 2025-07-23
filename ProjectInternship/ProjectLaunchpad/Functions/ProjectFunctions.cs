using Azure;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Models.Models.DTOs.AuthenticationDTO;
using ProjectLaunchpad.Models.Models.DTOs.ProjectDTO;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using ProjectLaunchpad.Utility;
using System;
using System.Collections.Generic;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class ProjectPostingFunctions
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly TokenAuthorization _auth;

        public ProjectPostingFunctions(IUnitOfWork unitOfWork, TokenAuthorization auth)
        {
            _unitOfWork = unitOfWork;
            _auth = auth;
        }

        [Function("CreateProjectPosting")]
        public async Task<HttpResponseData> CreateProjectPosting(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "projects")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var project = await req.ReadFromJsonAsync<Project>();
            await _unitOfWork.ProjectRepository.AddProjectAsync(project);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(project);
            return response;
        }

        [Function("GetAllProjectPostings")]
        public async Task<HttpResponseData> GetAllProjectPostings(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "projects")] HttpRequestData req)
        {
            var projects = await _unitOfWork.ProjectRepository.GetAllProjectsAsync();

            var projectDTOs = projects.Select(p => new ProjectResponseDTO
            {
                Id = p.Id,
                Title = p.ProjectTitle,
                Description = p.Description,
                Status = p.Status ?? "active",
                Budget = p.Budget,
                Deadline = p.Deadline,
                ClientId = p.ClientId,
                Category = p.CategoryOrDomain,
                PaymentType = p.PaymentType,
                NumberOfFreelancers = p.NumberOfFreelancers,
                AttachedDocumentPath = p.AttachedDocumentPath,
                Client = p.Client != null && p.Client.User != null ? new UserRegisterDTO
                {
                    FirstName = p.Client.User.FirstName,
                    LastName = p.Client.User.LastName,
                    Email = p.Client.User.Email,
                    PhoneNo = p.Client.User.PhoneNo,
                    Role = p.Client.User.Role,
                    Gender = p.Client.User.Gender
                } : null,
                Skills = p.RequiredSkills?.Split(',').Select(s => s.Trim()).ToList() ?? new List<string>(),
                Team = p.AssignedFreelancers?.Select(af => af.Freelancer?.User != null ? new UserRegisterDTO
                {
                    FirstName = af.Freelancer.User.FirstName,
                    LastName = af.Freelancer.User.LastName,
                    Email = af.Freelancer.User.Email,
                    PhoneNo = af.Freelancer.User.PhoneNo,
                    Role = af.Freelancer.User.Role,
                    Gender = af.Freelancer.User.Gender
                } : null).Where(u => u != null).ToList() ?? new List<UserRegisterDTO>(),
                Progress = 0 // TODO: Calculate based on milestones if needed
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
            var project = await _unitOfWork.ProjectRepository.GetProjectByIdAsync(id);
            var response = req.CreateResponse(project != null ? HttpStatusCode.OK : HttpStatusCode.NotFound);
            await response.WriteAsJsonAsync(project);
            return response;
        }

        [Function("GetProjectsByFreelancerv2")]
        public async Task<HttpResponseData> GetProjectsByFreelancerv2(
    [HttpTrigger(AuthorizationLevel.Function, "get", Route = "freelancers/{freelancerId}/projects")] HttpRequestData req,
    int freelancerId)
        {
            var projects = await _unitOfWork.ProjectRepository.GetProjectsByFreelancerAsync(freelancerId);

            var projectDTOs = projects.Select(p => new ProjectResponseDTO
            {
                Id = p.Id,
                Title = p.ProjectTitle,
                Description = p.Description,
                Status = p.Status ?? "active",
                Budget = p.Budget,
                Deadline = p.Deadline,
                ClientId = p.ClientId,
                // Add these fields if your DTO and frontend expect them:
                Category = p.CategoryOrDomain,
                PaymentType = p.PaymentType,
                NumberOfFreelancers = p.NumberOfFreelancers,
                AttachedDocumentPath = p.AttachedDocumentPath,
                Client = p.Client != null && p.Client.User != null ? new UserRegisterDTO
                {
                    FirstName = p.Client.User.FirstName,
                    LastName = p.Client.User.LastName,
                    Email = p.Client.User.Email,
                    PhoneNo = p.Client.User.PhoneNo,
                    Role = p.Client.User.Role,
                    Gender = p.Client.User.Gender
                } : null,
                Skills = p.RequiredSkills?.Split(',').Select(s => s.Trim()).ToList() ?? new List<string>(),
                Team = p.AssignedFreelancers?.Select(af => af.Freelancer?.User != null ? new UserRegisterDTO
                {
                    FirstName = af.Freelancer.User.FirstName,
                    LastName = af.Freelancer.User.LastName,
                    Email = af.Freelancer.User.Email,
                    PhoneNo = af.Freelancer.User.PhoneNo,
                    Role = af.Freelancer.User.Role,
                    Gender = af.Freelancer.User.Gender
                } : null).Where(u => u != null).ToList() ?? new List<UserRegisterDTO>(),
                Progress = 0 // TODO: Calculate based on milestones if needed
            }).ToList();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projectDTOs);
            return response;
        }

        [Function("UpdateProjectPosting")]
        public async Task<HttpResponseData> UpdateProjectPosting(
        [HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "projects/{id:int}")] HttpRequestData req,
        int id)
            {
                (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "client");

                if (!isAuthorized)
                    return unauthorizedResponse!;

                var patchDto = await req.ReadFromJsonAsync<ProjectResponseDTO>();
                if (patchDto == null)
                {
                    var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
                    await badRequest.WriteStringAsync("Invalid request body.");
                    return badRequest;
                }

                // Fetch the existing project
                var existingProject = await _unitOfWork.ProjectRepository.GetProjectByIdAsync(id);
                if (existingProject == null)
                {
                    var notFound = req.CreateResponse(HttpStatusCode.NotFound);
                    await notFound.WriteStringAsync("Project not found.");
                    return notFound;
                }

                // Only update fields that are not null in the patchDto
                if (patchDto.Title != null) existingProject.ProjectTitle = patchDto.Title;
                if (patchDto.Description != null) existingProject.Description = patchDto.Description;
                if (patchDto.Status != null) existingProject.Status = patchDto.Status;
                if (patchDto.Budget != null) existingProject.Budget = patchDto.Budget.Value;
                if (patchDto.Deadline != null) existingProject.Deadline = patchDto.Deadline.Value;
                if (patchDto.ClientId != null) existingProject.ClientId = patchDto.ClientId.Value;
                if (patchDto.Category != null) existingProject.CategoryOrDomain = patchDto.Category;
                if (patchDto.PaymentType != null) existingProject.PaymentType = patchDto.PaymentType;
                if (patchDto.NumberOfFreelancers != null) existingProject.NumberOfFreelancers = patchDto.NumberOfFreelancers.Value;
                if (patchDto.AttachedDocumentPath != null) existingProject.AttachedDocumentPath = patchDto.AttachedDocumentPath;
                if (patchDto.Skills != null) existingProject.RequiredSkills = string.Join(",", patchDto.Skills);

            await _unitOfWork.ProjectRepository.UpdateProjectAsync(existingProject);
                await _unitOfWork.SaveAsync();

                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteAsJsonAsync(existingProject);
                return response;
            }

        [Function("DeleteProjectPosting")]
        public async Task<HttpResponseData> DeleteProjectPosting(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "projects/{id:int}")] HttpRequestData req,
            int id)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            await _unitOfWork.ProjectRepository.DeleteProjectAsync(id);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.NoContent);
            return response;
        }

        [Function("GetProjectPostingsByCategory")]
        public async Task<HttpResponseData> GetProjectPostingsByCategory(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "projects/category/{category}")] HttpRequestData req,
            string category)
        {
            var projects = await _unitOfWork.ProjectRepository.GetProjectsByCategoryAsync(category);
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

            var projects = await _unitOfWork.ProjectRepository.GetProjectsByDeadlineRangeAsync(start, end);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projects);
            return response;
        }

        [Function("GetProjectsWithPendingApproval")]
        public async Task<HttpResponseData> GetProjectsWithPendingApproval(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "platform/projects/pending")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "admin");
            if (!isAuthorized)
                return unauthorizedResponse!;

            var projects = await _unitOfWork.ProjectRepository.GetProjectsWithPendingApprovalAsync();

            var projectDTOs = projects.Select(p => new ProjectResponseDTO
            {
                Id = p.Id,
                Title = p.ProjectTitle,
                Description = p.Description,
                Status = p.Status ?? "active",
                Budget = p.Budget,
                Deadline = p.Deadline,
                ClientId = p.ClientId,
                Category = p.CategoryOrDomain,
                PaymentType = p.PaymentType,
                NumberOfFreelancers = p.NumberOfFreelancers,
                AttachedDocumentPath = p.AttachedDocumentPath,
                Client = p.Client != null && p.Client.User != null ? new UserRegisterDTO
                {
                    FirstName = p.Client.User.FirstName,
                    LastName = p.Client.User.LastName,
                    Email = p.Client.User.Email,
                    PhoneNo = p.Client.User.PhoneNo,
                    Role = p.Client.User.Role,
                    Gender = p.Client.User.Gender
                } : null,
                Skills = p.RequiredSkills?.Split(',').Select(s => s.Trim()).ToList() ?? new List<string>(),
                Team = p.AssignedFreelancers?.Select(af => af.Freelancer?.User != null ? new UserRegisterDTO
                {
                    FirstName = af.Freelancer.User.FirstName,
                    LastName = af.Freelancer.User.LastName,
                    Email = af.Freelancer.User.Email,
                    PhoneNo = af.Freelancer.User.PhoneNo,
                    Role = af.Freelancer.User.Role,
                    Gender = af.Freelancer.User.Gender
                } : null).Where(u => u != null).ToList() ?? new List<UserRegisterDTO>(),
                Progress = 0 // TODO: Calculate based on milestones if needed
            }).ToList();




            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projectDTOs);
            return response;
        }

        [Function("GetProjectCountWithPendingApprovalStatus")]
        public async Task<HttpResponseData> GetProjectCountWithPendingApprovalStatus(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "platform/pending-projects")] HttpRequestData req)
        {
            var count = await _unitOfWork.ProjectRepository.GetProjectCountWithPendingApprovalStatus();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(count);
            return response;
        }

        [Function("UpdateProjectApprovalStatus")]
        public async Task<HttpResponseData> UpdateProjectApprovalStatus(
        [HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "platform/projects/{id:int}")] HttpRequestData req,
        int id)
                {
                    (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "admin");

                    if (!isAuthorized)
                        return unauthorizedResponse!;

                    var dto = await req.ReadFromJsonAsync<ProjectApprovalDTO>();
                    if (dto == null)
                    {
                        var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
                        await badRequest.WriteStringAsync("Invalid request body.");
                        return badRequest;
                    }

                    // Fetch the existing project
                    var existingProject = await _unitOfWork.ProjectRepository.GetProjectByIdAsync(id);
                    if (existingProject == null)
                    {
                        var notFound = req.CreateResponse(HttpStatusCode.NotFound);
                        await notFound.WriteStringAsync("Project not found.");
                        return notFound;
                    }

                    // Only update fields that are not null
                    if (dto.ApprovalStatus != null) existingProject.ApprovalStatus = dto.ApprovalStatus;
                    if (dto.RejectionReason != null) existingProject.RejectionReason = dto.RejectionReason;

                    await _unitOfWork.ProjectRepository.UpdateProjectAsync(existingProject);
                    await _unitOfWork.SaveAsync();

                    var response = req.CreateResponse(HttpStatusCode.OK);
                    await response.WriteAsJsonAsync(existingProject);
                    return response;
                }
    }
}