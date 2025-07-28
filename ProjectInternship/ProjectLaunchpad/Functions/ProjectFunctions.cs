using Azure;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using MySqlX.XDevAPI;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Models.Models.DTOs.AuthenticationDTO;
using ProjectLaunchpad.Models.Models.DTOs.MilestoneDTO;
using ProjectLaunchpad.Models.Models.DTOs.ProjectDTO;
using ProjectLaunchpad.Models.Models.Enums;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using ProjectLaunchpad.Services;
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

        //[Function("CreateProjectPosting")]
        //public async Task<HttpResponseData> CreateProjectPosting(
        //    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "projects")] HttpRequestData req)
        //{
        //    (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "client");

        //    if (!isAuthorized)
        //        return unauthorizedResponse!;

        //    var project = await req.ReadFromJsonAsync<Project>();

        //    await _unitOfWork.ProjectRepository.AddProjectAsync(project);
        //    await _unitOfWork.SaveAsync();

        //    var response = req.CreateResponse(HttpStatusCode.Created);
        //    await response.WriteAsJsonAsync(project);
        //    return response;
        //}

        [Function("CreateProjectPosting")]
        public async Task<HttpResponseData> CreateProjectPosting(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "projects")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var projectDto = await req.ReadFromJsonAsync<ProjectPostingDTO>();

            var userIdClaim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                var unauthorized = req.CreateResponse(HttpStatusCode.Unauthorized);
                await unauthorized.WriteStringAsync("Unauthorized");
                return unauthorized;
            }

            int clientId = int.Parse(userIdClaim);

            // Map DTO to Project entity
            var project = new Project
            {
                ProjectTitle = projectDto.ProjectTitle,
                Description = projectDto.Description,
                CategoryOrDomain = projectDto.CategoryOrDomain,
                PaymentType = projectDto.PaymentType,
                Deadline = projectDto.Deadline,
                RequiredSkills = projectDto.RequiredSkills,
                Budget = projectDto.Budget,
                NumberOfFreelancers = projectDto.NumberOfFreelancers,
                Status = "open",
                AttachedDocumentPath = projectDto.AttachedDocumentPath,
                ClientId = clientId
            };

            // Save Project
            await _unitOfWork.ProjectRepository.AddProjectAsync(project);
            await _unitOfWork.SaveAsync();

            // Save Milestones if 'milestone' payment type
            if (projectDto.PaymentType.ToLower() == "milestone" && projectDto.Milestones != null)
            {
                foreach (var m in projectDto.Milestones)
                {
                    var milestone = new Milestone
                    {
                        Title = m.Title,
                        Description = m.Description,
                        DueDate = m.DueDate,
                        Amount = m.Amount,
                        Status = MilestoneStatus.InProgress,
                        ProjectId = project.Id
                    };

                    await _unitOfWork.MilestoneRepository.AddMilestoneAsync(milestone);
                }

                await _unitOfWork.SaveAsync();
            }

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(new { message = "Project created successfully", projectId = project.Id });
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
                ProjectTitle = p.ProjectTitle,
                Description = p.Description,
                Status = p.Status ?? "active",
                Budget = p.Budget,
                Deadline = p.Deadline,
                ClientId = p.ClientId,
                CategoryOrDomain = p.CategoryOrDomain,
                PaymentType = p.PaymentType,
                NumberOfFreelancers = p.NumberOfFreelancers,
                AttachedDocumentPath = p.AttachedDocumentPath,
                Client = p.Client != null && p.Client.User != null ? new UserDTO
                {
                    Id = p.Client.Id,
                    FirstName = p.Client.User.FirstName,
                    LastName = p.Client.User.LastName,
                    Email = p.Client.User.Email,
                    PhoneNo = p.Client.User.PhoneNo,
                    Role = p.Client.User.Role,
                    Gender = p.Client.User.Gender
                } : null,
                RequiredSkills = p.RequiredSkills,
                Team = p.AssignedFreelancers?.Select(af => af.Freelancer?.User != null ? new UserDTO
                {
                    Id = af.Freelancer.User.Id,
                    FirstName = af.Freelancer.User.FirstName,
                    LastName = af.Freelancer.User.LastName,
                    Email = af.Freelancer.User.Email,
                    PhoneNo = af.Freelancer.User.PhoneNo,
                    Role = af.Freelancer.User.Role,
                    Gender = af.Freelancer.User.Gender
                } : null).Where(u => u != null).ToList() ?? new List<UserDTO>(),
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

            if (project == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var projectDto = new ProjectPostingDTO
            {
                Id = project.Id,
                ProjectTitle = project.ProjectTitle,
                Description = project.Description,
                PaymentType = project.PaymentType,
                CategoryOrDomain = project.CategoryOrDomain,
                Deadline = project.Deadline,
                RequiredSkills = project.RequiredSkills,
                Budget = project.Budget,
                NumberOfFreelancers = project.NumberOfFreelancers,
                Status = project.Status,
                AttachedDocumentPath = project.AttachedDocumentPath,
                Milestones = project.Milestones?.Select(m => new CreateMilestoneDto
                {
                    // Map milestone fields here, e.g.:
                    // Title = m.Title,
                    // Description = m.Description,
                    // Amount = m.Amount,
                    // DueDate = m.DueDate
                }).ToList()
            };

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projectDto);
            return response;
        }

        //[Function("GetProjectPostingById")]
        //public async Task<HttpResponseData> GetProjectPostingById(
        //    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "projects/{id:int}")] HttpRequestData req,
        //    int id)
        //{
        //    var project = await _unitOfWork.ProjectRepository.GetProjectByIdAsync(id);
        //    var response = req.CreateResponse(project != null ? HttpStatusCode.OK : HttpStatusCode.NotFound);
        //    await response.WriteAsJsonAsync(project);
        //    return response;
        //}
        [Function("GetProjectsByClient")]
        public async Task<HttpResponseData> GetProjectsByClient(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "clients/{clientId}/projects")] HttpRequestData req,
            int clientId)
        {
            var projects = await _unitOfWork.ProjectRepository.GetProjectsByClientIdAsync(clientId);

            var projectDTOs = projects.Select(p => new ProjectResponseDTO
            {
                Id = p.Id,
                ProjectTitle = p.ProjectTitle,
                Description = p.Description,
                Status = p.Status ?? "active",
                Budget = p.Budget,
                Deadline = p.Deadline,
                ClientId = p.ClientId,
                // Add these fields if your DTO and frontend expect them:
                CategoryOrDomain = p.CategoryOrDomain,
                PaymentType = p.PaymentType,
                NumberOfFreelancers = p.NumberOfFreelancers,
                AttachedDocumentPath = p.AttachedDocumentPath,
                Client = p.Client != null && p.Client.User != null ? new UserDTO
                {
                    Id = p.Client.User.Id,
                    FirstName = p.Client.User.FirstName,
                    LastName = p.Client.User.LastName,
                    Email = p.Client.User.Email,
                    PhoneNo = p.Client.User.PhoneNo,
                    Role = p.Client.User.Role,
                    Gender = p.Client.User.Gender
                } : null,
                RequiredSkills = p.RequiredSkills,
                Team = p.AssignedFreelancers?.Select(af => af.Freelancer?.User != null ? new UserDTO
                {
                    Id = af.Freelancer.User.Id,
                    FirstName = af.Freelancer.User.FirstName,
                    LastName = af.Freelancer.User.LastName,
                    Email = af.Freelancer.User.Email,
                    PhoneNo = af.Freelancer.User.PhoneNo,
                    Role = af.Freelancer.User.Role,
                    Gender = af.Freelancer.User.Gender
                } : null).Where(u => u != null).ToList() ?? new List<UserDTO>(),
                Progress = 0 // TODO: Calculate based on milestones if needed
            }).ToList();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projectDTOs);
            return response;
        }



        [Function("GetProjectsByFreelancer")]
        public async Task<HttpResponseData> GetProjectsByFreelancer(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "freelancers/{freelancerId}/projects")] HttpRequestData req,
            int freelancerId)
        {
            var projects = await _unitOfWork.ProjectRepository.GetProjectsByFreelancerAsync(freelancerId);

            var projectDTOs = projects.Select(p => new ProjectResponseDTO
            {
                Id = p.Id,
                ProjectTitle = p.ProjectTitle,
                Description = p.Description,
                Status = p.Status ?? "active",
                Budget = p.Budget,
                Deadline = p.Deadline,
                ClientId = p.ClientId,
                // Add these fields if your DTO and frontend expect them:
                CategoryOrDomain = p.CategoryOrDomain,
                PaymentType = p.PaymentType,
                NumberOfFreelancers = p.NumberOfFreelancers,
                AttachedDocumentPath = p.AttachedDocumentPath,
                Client = p.Client != null && p.Client.User != null ? new UserDTO
                {
                    Id = p.Client.User.Id,
                    FirstName = p.Client.User.FirstName,
                    LastName = p.Client.User.LastName,
                    Email = p.Client.User.Email,
                    PhoneNo = p.Client.User.PhoneNo,
                    Role = p.Client.User.Role,
                    Gender = p.Client.User.Gender
                } : null,
                RequiredSkills = p.RequiredSkills,
                Team = p.AssignedFreelancers?.Select(af => af.Freelancer?.User != null ? new UserDTO
                {
                    Id = af.Freelancer.User.Id,
                    FirstName = af.Freelancer.User.FirstName,
                    LastName = af.Freelancer.User.LastName,
                    Email = af.Freelancer.User.Email,
                    PhoneNo = af.Freelancer.User.PhoneNo,
                    Role = af.Freelancer.User.Role,
                    Gender = af.Freelancer.User.Gender
                } : null).Where(u => u != null).ToList() ?? new List<UserDTO>(),
                Progress = 0 // TODO: Calculate based on milestones if needed
            }).ToList();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projectDTOs);
            return response;
        }

        [Function("UpdateProjectPosting")]
        public async Task<HttpResponseData> UpdateProjectPosting(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "projects/{id:int}")] HttpRequestData req,
            int id)
        {

            var updatedProject = await req.ReadFromJsonAsync<Project>();
            updatedProject.Id = id;
            await _unitOfWork.ProjectRepository.UpdateProjectAsync(updatedProject);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            Console.WriteLine();
            await response.WriteAsJsonAsync(updatedProject);
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
            var projects = await _unitOfWork.ProjectRepository.GetProjectsWithPendingApprovalAsync();

            var projectDTOs = projects.Select(p => new ProjectResponseDTO
            {
                Id = p.Id,
                ProjectTitle = p.ProjectTitle,
                Description = p.Description,
                Status = p.Status ?? "completed",
                Budget = p.Budget,
                Deadline = p.Deadline,
                ClientId = p.ClientId,
                CategoryOrDomain = p.CategoryOrDomain,
                PaymentType = p.PaymentType,
                NumberOfFreelancers = p.NumberOfFreelancers,
                AttachedDocumentPath = p.AttachedDocumentPath,
            }).ToList();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projectDTOs);
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

            var project = await _unitOfWork.ProjectRepository.GetProjectByIdAsync(id);
            if (project == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var approvalDto = await req.ReadFromJsonAsync<ProjectApprovalDTO>();
            if (approvalDto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            // Update approval status
            project.ApprovalStatus = approvalDto.ApprovalStatus ?? project.ApprovalStatus;
            project.RejectionReason = approvalDto.RejectionReason ?? project.RejectionReason;

            await _unitOfWork.ProjectRepository.UpdateProjectAsync(project);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { message = "Project approval status updated successfully" });
            return response;
        }
    }
}