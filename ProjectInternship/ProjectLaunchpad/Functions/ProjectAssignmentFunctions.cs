using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using ProjectLaunchpad.Utility;
using System.Security.Claims;

namespace ProjectLaunchpad.Functions
{
    public class ProjectAssignmentFunctions
    {
        private readonly IUnitOfWork _unit;
        private readonly TokenAuthorization _auth;

        public ProjectAssignmentFunctions(IUnitOfWork unit, TokenAuthorization auth)
        {
            _unit = unit;
            _auth = auth;
        }

        [Function("AssignFreelancersToProject")]
        public async Task<HttpResponseData> AssignFreelancersToProject(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "projects/assign")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "Client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var dto = await req.ReadFromJsonAsync<ProjectAssignmentDTO>();

            await _unit.ProjectFreelancers.AssignFreelancersAsync(dto.ProjectId, dto.FreelancerId);
            await _unit.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { message = "Freelancer assigned successfully." });
            return response;
        }

        [Function("GetFreelancersByProject")]
        public async Task<HttpResponseData> GetFreelancersByProject(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "projects/{projectId}/freelancers")] HttpRequestData req,
            int projectId)
        {
            var freelancers = await _unit.ProjectFreelancers.GetFreelancersByProjectAsync(projectId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(freelancers);
            return response;
        }

        [Function("GetProjectsByFreelancer")]
        public async Task<HttpResponseData> GetProjectsByFreelancer(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "freelancers/{freelancerId}/projects")] HttpRequestData req,
            int freelancerId)
        {
            var projects = await _unit.ProjectFreelancers.GetProjectsByFreelancerAsync(freelancerId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(projects);
            return response;
        }

        [Function("RemoveFreelancerFromProject")]
        public async Task<HttpResponseData> RemoveFreelancerFromProject(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "projects/{projectId}/freelancers/{freelancerId}")] HttpRequestData req,
            int projectId, int freelancerId)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "Client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            await _unit.ProjectFreelancers.RemoveFreelancerFromProjectAsync(projectId, freelancerId);
            await _unit.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { message = "Freelancer removed from project." });
            return response;
        }
    }

}
