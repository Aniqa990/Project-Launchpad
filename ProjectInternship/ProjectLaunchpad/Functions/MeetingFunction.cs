using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using System.Threading.Tasks;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using Microsoft.AspNetCore.Mvc;

namespace ProjectLaunchpad.Functions
{
    public class MeetingFunction
    {
        private readonly IUnitOfWork _unitOfWork;

        public MeetingFunction(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }


        [Function("StartMeeting")]
        public async Task<HttpResponseData> StartMeeting(
    [HttpTrigger(AuthorizationLevel.Function, "post", Route = "meetings/start")] HttpRequestData req)
        {
            try
            {
                var body = await req.ReadFromJsonAsync<CreateMeetingRequestDto>();
                if (body == null || body.ProjectId <= 0 || body.Participants == null || !body.Participants.Any())
                {
                    var badResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                    await badResponse.WriteStringAsync("Invalid meeting request.");
                    return badResponse;
                }

                // 1. Create Meeting
                var meeting = new Meeting
                {
                    ProjectId = body.ProjectId,
                    MeetingRoomId = $"project-{body.ProjectId}-meeting-{Guid.NewGuid().ToString().Substring(0, 6)}",
                    Title = body.Title,
                    Description = body.Description,
                    Agenda = body.Agenda,
                    ClientId = body.CreatedBy,
                    StartedAt = DateTime.UtcNow,
                    Status = "Scheduled",
                    RecordingUrl = ""
                };
                await _unitOfWork.Meeting.AddAsync(meeting);
                await _unitOfWork.SaveAsync();

                // 2. Add participants and notifications
                var participants = new List<MeetingParticipant>();
                foreach (var p in body.Participants)
                {
                    var participant = new MeetingParticipant
                    {
                        MeetingId = meeting.Id,
                        UserId = p.UserId,
                        UserName = p.UserName,
                        role = p.Role,
                        InviteSentAt = DateTime.UtcNow,
                        NotificationRead = p.Role == "client" // client already knows
                    };
                    participants.Add(participant);

                    // Only notify freelancers
                    if (p.Role == "freelancer")
                    {
                        var jitsiLink = $"https://8x8.vc/vpaas-magic-cookie-916ca21a710a40e0ac58af93b2f48abe/{meeting.MeetingRoomId}";
                        var notification = new Notification
                        {
                            UserId = p.UserId,
                            Type = "MeetingInvite",
                            Message = $"You are invited to a meeting: {meeting.Title}. Join here: https://8x8.vc/vpaas-magic-cookie-916ca21a710a40e0ac58af93b2f48abe/SampleAppFrightenedPresidentsInviteSeldom",
                            RelatedMeetingId = meeting.Id,
                            CreatedAt = DateTime.UtcNow,
                            Read = false
                        };
                        await _unitOfWork.NotificationRepository.AddAsync(notification);
                    }
                }

                await _unitOfWork.MeetingParticipant.AddRangeAsync(participants);
                await _unitOfWork.SaveAsync();

                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteAsJsonAsync(new
                {
                    meetingId = meeting.Id,
                    roomId = meeting.MeetingRoomId,
                    startedAt = meeting.StartedAt
                });

                return response;
            }
            catch (Exception ex)
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                await errorResponse.WriteStringAsync($"Error starting meeting: {ex.Message}");
                return errorResponse;
            }
        }


        [Function("JoinMeeting")]
        public async Task<IActionResult> JoinMeeting(
    [HttpTrigger(AuthorizationLevel.Function, "post", Route = "meetings/join")] HttpRequestData req)
        {
            var body = await req.ReadFromJsonAsync<JoinMeetingDto>();

            var participant = new MeetingParticipant
            {
                MeetingId = body.MeetingId,
                UserId = body.UserId,
                UserName = body.UserName,
                role = body.Role,
                JoinedAt = DateTime.UtcNow
            };

            await _unitOfWork.MeetingParticipant.AddAsync(participant);
            await _unitOfWork.SaveAsync();

            return new OkObjectResult("User joined the meeting.");
        }


        [Function("EndMeeting")]
        public async Task<IActionResult> EndMeeting(
    [HttpTrigger(AuthorizationLevel.Function, "put", Route = "meetings/end/{meetingId:int}")] HttpRequestData req,
    int meetingId)
        {
            var meeting = await _unitOfWork.Meeting.GetMeetingWithParticipantsAsync(meetingId);

            if (meeting == null)
                return new NotFoundResult();

            meeting.EndedAt = DateTime.UtcNow;
            await _unitOfWork.Meeting.UpdateAsync(meeting);
            await _unitOfWork.SaveAsync();

            return new OkObjectResult("Meeting ended.");
        }

        [Function("GetMeetingsByProjectId")]
        public async Task<IActionResult> GetMeetingsByProjectId(
    [HttpTrigger(AuthorizationLevel.Function, "get", Route = "projects/{projectId:int}/meetings")] HttpRequestData req,
    int projectId)
        {
            var meetings = await _unitOfWork.Meeting.GetMeetingsByProjectIdAsync(projectId);

            return new OkObjectResult(meetings);
        }

        [Function("GetMeetingDetails")]
        public async Task<IActionResult> GetMeetingDetails(
    [HttpTrigger(AuthorizationLevel.Function, "get", Route = "meetings/{meetingId:int}/details")] HttpRequestData req,
    int meetingId)
        {
            var meeting = await _unitOfWork.Meeting.GetMeetingWithParticipantsAsync(meetingId);
            if (meeting == null)
                return new NotFoundResult();

            var participants = await _unitOfWork.MeetingParticipant.GetParticipantsByMeetingIdAsync(meetingId);

            return new OkObjectResult(new
            {
                meeting.Id,
                meeting.ProjectId,
                meeting.MeetingRoomId,
                meeting.StartedAt,
                meeting.EndedAt,
                Participants = participants.Select(p => new
                {
                    p.UserId,
                    p.role,
                    p.JoinedAt
                })
            });
        }




    }
}
