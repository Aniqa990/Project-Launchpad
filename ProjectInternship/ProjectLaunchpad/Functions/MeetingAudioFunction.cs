using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class MeetingAudioFunction
    {
        private readonly IUnitOfWork _unitOfWork;

        public MeetingAudioFunction(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [Function("UploadMeetingAudioRecording")]
        public async Task<IActionResult> UploadMeetingAudioRecording(
    [HttpTrigger(AuthorizationLevel.Function, "post", Route = "meetings/{meetingId:int}/upload-audio")] HttpRequest req,
    int meetingId)
        {
            try
            {
                // Try to read as form data (for both file and url)
                var form = await req.ReadFormAsync();
                var userIdStr = form["userId"];
                if (string.IsNullOrEmpty(userIdStr))
                    return new BadRequestObjectResult("Missing userId.");

                var userId = int.Parse(userIdStr);

                // 1. Check for audioUrl (Cloudinary link)
                var audioUrl = form["audioUrl"];
                if (!string.IsNullOrEmpty(audioUrl))
                {
                    // Save Cloudinary URL to DB
                    var recording = new MeetingAudioRecording
                    {
                        MeetingId = meetingId,
                        UserId = userId,
                        AudioUrl = audioUrl,
                        UploadedAt = DateTime.UtcNow
                    };
                    await _unitOfWork.MeetingAudioRecording.AddAsync(recording);
                    await _unitOfWork.SaveAsync();

                    return new OkObjectResult(new { message = "Transcript URL uploaded", audioUrl });
                }

                // 2. Otherwise, check for file upload
                var file = req.Form.Files["audio"];
                if (file == null || file.Length == 0)
                    return new BadRequestObjectResult("No audio file uploaded or transcript URL provided.");

                // Save file to disk or cloud storage, get the URL/path
                var fileName = $"meeting-{meetingId}-user-{userId}-{DateTime.UtcNow.Ticks}.webm";
                var folder = Path.Combine(Directory.GetCurrentDirectory(), "AudioRecordings");
                if (!Directory.Exists(folder))
                    Directory.CreateDirectory(folder);
                var filePath = Path.Combine(folder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
                var localAudioUrl = $"/AudioRecordings/{fileName}"; // Or your storage URL

                // Save to DB
                var fileRecording = new MeetingAudioRecording
                {
                    MeetingId = meetingId,
                    UserId = userId,
                    AudioUrl = localAudioUrl,
                    UploadedAt = DateTime.UtcNow
                };
                await _unitOfWork.MeetingAudioRecording.AddAsync(fileRecording);
                await _unitOfWork.SaveAsync();

                return new OkObjectResult(new { message = "Audio file uploaded", audioUrl = localAudioUrl });
            }
            catch (Exception ex)
            {
                return new ObjectResult($"Error uploading audio: {ex.Message}") { StatusCode = 500 };
            }
        }

        [Function("GetAllAudioRecordings")]
        public async Task<HttpResponseData> GetAllLogs(
     [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "audio")] HttpRequestData req)
        {
            var logs = await _unitOfWork.MeetingAudioRecording.getAll();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(logs);
            return response;
        }
    }
}
