using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class NotificationFunction
    {
        private readonly IUnitOfWork _unitOfWork;

        public NotificationFunction(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }


        [Function("GetNotifications")]
        public async Task<IActionResult> GetNotifications(
    [HttpTrigger(AuthorizationLevel.Function, "get", Route = "notifications/{userId:int}")] HttpRequestData req,
    int userId)
        {
            var notifications = await _unitOfWork.NotificationRepository.GetByUserId(userId);
            return new OkObjectResult(notifications);
        }


        [Function("MarkNotificationRead")]
        public async Task<IActionResult> MarkNotificationRead(
    [HttpTrigger(AuthorizationLevel.Function, "put", Route = "notifications/{notificationId:int}/read")] HttpRequestData req,
    int notificationId)
        {
            var notification = await _unitOfWork.NotificationRepository.GetByIdAsync(notificationId);
            if (notification == null)
                return new NotFoundResult();

            notification.Read = true;
            await _unitOfWork.NotificationRepository.UpdateAsync(notification);
            await _unitOfWork.SaveAsync();

            return new OkResult();
        }
    }
}
