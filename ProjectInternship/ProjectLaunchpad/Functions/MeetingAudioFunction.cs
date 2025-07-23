using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
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
                var form = await req.ReadFormAsync();
                var userId = int.Parse(form["userId"]);
                var file = req.Form.Files["audio"];

                if (file == null || file.Length == 0)
                    return new BadRequestObjectResult("No audio file uploaded.");

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
                var audioUrl = $"/AudioRecordings/{fileName}"; // Or your storage URL

                // Save to DB
                var recording = new MeetingAudioRecording
                {
                    MeetingId = meetingId,
                    UserId = userId,
                    AudioUrl = audioUrl,
                    UploadedAt = DateTime.UtcNow
                };
                await _unitOfWork.MeetingAudioRecording.AddAsync(recording);
                await _unitOfWork.SaveAsync();

                return new OkObjectResult(new { message = "Audio uploaded", audioUrl });
            }
            catch (Exception ex)
            {
                return new ObjectResult($"Error uploading audio: {ex.Message}") { StatusCode = 500 };
            }
        }
    }
}
