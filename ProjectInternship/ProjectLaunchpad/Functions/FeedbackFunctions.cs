using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.FeedbackDTO;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System.Net;

namespace ProjectLaunchpad.Functions
{
    public class FeedbackFunctions
    {
        private readonly IUnitOfWork _unitOfWork;

        public FeedbackFunctions(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [Function("CreateFeedback")]
        public async Task<HttpResponseData> CreateFeedback(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "feedbacks")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<FeedbackCreateDTO>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            var feedback = new Feedback
            {
                ProjectId = dto.ProjectId,
                FreelancerId = dto.FreelancerId,
                Review = dto.Review,
                Rating = dto.Rating
            };

            await _unitOfWork.Feedbacks.AddFeedbackAsync(feedback);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(feedback);
            return response;
        }

        [Function("GetAllFeedbacks")]
        public async Task<HttpResponseData> GetAllFeedbacks(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "feedbacks")] HttpRequestData req)
        {
            var feedbacks = await _unitOfWork.Feedbacks.GetAllFeedbacksAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(feedbacks);
            return response;
        }

        [Function("GetFeedbacksByProject")]
        public async Task<HttpResponseData> GetFeedbacksByProject(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "feedbacks/project/{projectId:int}")] HttpRequestData req,
            int projectId)
        {
            var feedbacks = await _unitOfWork.Feedbacks.GetFeedbacksByProjectAsync(projectId);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(feedbacks);
            return response;
        }

        [Function("GetFeedbacksByFreelancer")]
        public async Task<HttpResponseData> GetFeedbacksByFreelancer(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "feedbacks/freelancer/{freelancerId:int}")] HttpRequestData req,
            int freelancerId)
        {
            var feedbacks = await _unitOfWork.Feedbacks.GetFeedbacksByFreelancerAsync(freelancerId);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(feedbacks);
            return response;
        }

        [Function("DeleteFeedback")]
        public async Task<HttpResponseData> DeleteFeedback(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "feedbacks/{id:int}")] HttpRequestData req,
            int id)
        {
            await _unitOfWork.Feedbacks.DeleteFeedbackAsync(id);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteStringAsync("Feedback deleted.");
            return response;
        }
    }
}