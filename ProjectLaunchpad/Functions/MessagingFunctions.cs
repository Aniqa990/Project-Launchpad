using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System.Net;

namespace ProjectLaunchpad.Functions
{
    public class MessagingFunctions
    {
        private readonly IUnitOfWork _unitOfWork;

        public MessagingFunctions(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [Function("SendMessage")]
        public async Task<HttpResponseData> SendMessage(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "messages")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<MessagingCreateDTO>();

            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            var message = new Messaging
            {
                SenderId = dto.SenderId,
                ReceiverId = dto.ReceiverId,
                MessageContent = dto.MessageContent,
                Upload = dto.Upload,
                Timestamp = DateTime.UtcNow,
                IsRead = false
            };

            await _unitOfWork.Messages.AddMessageAsync(message);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(message);
            return response;
        }

        [Function("GetMessagesBetweenUsers")]
        public async Task<HttpResponseData> GetMessagesBetweenUsers(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "messages/conversation/{user1:int}/{user2:int}")] HttpRequestData req,
            int user1, int user2)
        {
            var messages = await _unitOfWork.Messages.GetMessagesBetweenUsersAsync(user1, user2);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(messages);
            return response;
        }

        [Function("GetMessagesForUser")]
        public async Task<HttpResponseData> GetMessagesForUser(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "messages/user/{userId:int}")] HttpRequestData req,
            int userId)
        {
            var messages = await _unitOfWork.Messages.GetMessagesForUserAsync(userId);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(messages);
            return response;
        }

        [Function("MarkMessageAsRead")]
        public async Task<HttpResponseData> MarkMessageAsRead(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "messages/{id:int}/read")] HttpRequestData req,
            int id)
        {
            await _unitOfWork.Messages.UpdateMessageStatusAsync(id, true);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteStringAsync("Message marked as read.");
            return response;
        }

        [Function("DeleteMessage")]
        public async Task<HttpResponseData> DeleteMessage(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "messages/{id:int}")] HttpRequestData req,
            int id)
        {
            await _unitOfWork.Messages.DeleteMessageAsync(id);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteStringAsync("Message deleted.");
            return response;
        }
    }
}