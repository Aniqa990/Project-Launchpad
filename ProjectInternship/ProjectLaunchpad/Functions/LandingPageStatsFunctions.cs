using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Net;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class LandingPageStatsFunctions
    {
        private readonly IUnitOfWork _unitOfWork;

        public LandingPageStatsFunctions(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [Function("GetLandingPageStats")]
        public async Task<HttpResponseData> GetLandingPageStatsAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "landing-page/stats")] HttpRequestData req)
        {
            try
            {
                // Get total users count
                var totalUsers = await _unitOfWork.Users.GetTotalUsersCountAsync();
                
                // Get completed projects count
                var completedProjects = await _unitOfWork.ProjectRepository.GetCompletedProjectsCountAsync();

                var stats = new
                {
                    totalUsers,
                    completedProjects
                };

                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteAsJsonAsync(stats);
                return response;
            }
            catch (Exception ex)
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                await errorResponse.WriteStringAsync($"Error fetching landing page stats: {ex.Message}");
                return errorResponse;
            }
        }
    }
}
