using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System.Net;

namespace ProjectLaunchpad.Functions
{
    public class TimeSheetFunctions
    {
        private readonly IUnitOfWork _unitOfWork;

        public TimeSheetFunctions(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [Function("CreateTimeSheet")]
        public async Task<HttpResponseData> CreateTimeSheet(
     [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "timesheets")] HttpRequestData req,
     FunctionContext executionContext)
        {
            var logger = executionContext.GetLogger("CreateTimeSheet");
            logger.LogInformation("➡️ CreateTimeSheet called");

            try
            {
                var dto = await req.ReadFromJsonAsync<TimeSheetCreateDTO>();
                if (dto == null)
                {
                    logger.LogWarning("❌ Invalid request body — DTO is null");
                    var badReq = req.CreateResponse(HttpStatusCode.BadRequest);
                    await badReq.WriteStringAsync("Invalid or missing body.");
                    return badReq;
                }

                logger.LogInformation("✅ DTO successfully read from request");

                var timesheet = new TimeSheet
                {
                    ProjectName = dto.ProjectName,
                    FreelancerName = dto.FreelancerName,
                    DateOfWork = dto.DateOfWork,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    WorkDescription = dto.WorkDescription,
                    HourlyRate = dto.HourlyRate,
                    ApprovalStatus = "Pending"
                };

                logger.LogInformation("📤 Saving timesheet to database...");

                await _unitOfWork.TimeSheet.AddTimeSheetAsync(timesheet);
                await _unitOfWork.SaveAsync();

                logger.LogInformation("✅ Timesheet saved successfully");

                var response = req.CreateResponse(HttpStatusCode.Created);
                await response.WriteAsJsonAsync(timesheet);
                return response;
            }
            catch (Exception ex)
            {
                logger.LogError($"❌ Exception occurred: {ex.Message}");
                var response = req.CreateResponse(HttpStatusCode.InternalServerError);
                await response.WriteStringAsync("Server error: " + ex.Message);
                return response;
            }
        }


        [Function("GetAllTimeSheets")]
        public async Task<HttpResponseData> GetAllTimeSheets(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "timesheets")] HttpRequestData req)
        {
            var timesheets = await _unitOfWork.TimeSheet.GetAllTimeSheetsAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(timesheets);
            return response;
        }

        [Function("GetTimeSheetById")]
        public async Task<HttpResponseData> GetTimeSheetById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "timesheets/{id:int}")] HttpRequestData req, int id)
        {
            var timeSheet = await _unitOfWork.TimeSheet.GetTimeSheetByIdAsync(id);
            if (timeSheet == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(timeSheet);
            return response;
        }

        [Function("GetTimeSheetsByFreelancer")]
        public async Task<HttpResponseData> GetTimeSheetsByFreelancer(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "timesheets/freelancer/{name}")] HttpRequestData req, string name)
        {
            var timesheets = await _unitOfWork.TimeSheet.GetTimeSheetsByFreelancerAsync(name);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(timesheets);
            return response;
        }

        [Function("ApproveTimeSheet")]
        public async Task<HttpResponseData> ApproveTimeSheet(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "timesheets/{id:int}/approve")] HttpRequestData req, int id)
        {
            var payload = await req.ReadFromJsonAsync<Dictionary<string, string>>();
            string comments = payload != null && payload.TryGetValue("reviewerComments", out var value) ? value : "";

            await _unitOfWork.TimeSheet.ApproveTimeSheetAsync(id, comments);
            await _unitOfWork.SaveAsync();

            return req.CreateResponse(HttpStatusCode.OK);
        }

        [Function("RejectTimeSheet")]
        public async Task<HttpResponseData> RejectTimeSheet(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "timesheets/{id:int}/reject")] HttpRequestData req, int id)
        {
            var payload = await req.ReadFromJsonAsync<Dictionary<string, string>>();
            string comments = payload != null && payload.TryGetValue("reviewerComments", out var value) ? value : "";

            await _unitOfWork.TimeSheet.RejectTimeSheetAsync(id, comments);
            await _unitOfWork.SaveAsync();

            return req.CreateResponse(HttpStatusCode.OK);
        }
    }
}
