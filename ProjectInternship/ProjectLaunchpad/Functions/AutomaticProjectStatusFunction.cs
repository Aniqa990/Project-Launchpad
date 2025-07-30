using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class AutomaticProjectStatusFunction
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<AutomaticProjectStatusFunction> _logger;

        public AutomaticProjectStatusFunction(IUnitOfWork unitOfWork, ILogger<AutomaticProjectStatusFunction> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        /// <summary>
        /// Timer-triggered function that runs daily at 00:00 UTC to automatically manage project statuses
        /// </summary>
        [Function("AutomaticProjectStatusCheck")]
        public async Task AutomaticProjectStatusCheck(
            [TimerTrigger("0 0 0 * * *")] TimerInfo myTimer)
        {
            _logger.LogInformation($"Automatic project status check executed at: {DateTime.UtcNow}");

            try
            {
                var currentDate = DateTime.UtcNow;
                var projects = await _unitOfWork.ProjectRepository.GetAllProjectsAsync();
                var updatedCount = 0;

                foreach (var project in projects)
                {
                    var statusChanged = false;

                    // Auto-reject projects not approved before start date
                    if (project.ApprovalStatus == "pending" && project.StartDate <= currentDate)
                    {
                        project.ApprovalStatus = "rejected";
                        project.RejectionReason = "Project automatically rejected - not approved before start date";
                        project.Status = "closed";
                        statusChanged = true;
                        _logger.LogInformation($"Project {project.Id} auto-rejected - not approved before start date");
                    }
                    // Activate approved projects when start date is reached
                    else if (project.ApprovalStatus == "approved" &&
                             project.Status != "active" &&
                             project.Status != "closed" &&
                             project.StartDate <= currentDate)
                    {
                        project.Status = "active";
                        statusChanged = true;
                        _logger.LogInformation($"Project {project.Id} activated - start date reached");
                    }
                    // Close active projects when deadline is reached
                    else if (project.Status == "active" && project.Deadline <= currentDate)
                    {
                        project.Status = "closed";
                        statusChanged = true;
                        _logger.LogInformation($"Project {project.Id} closed - deadline reached");
                    }

                    if (statusChanged)
                    {
                        await _unitOfWork.ProjectRepository.UpdateProjectAsync(project);
                        updatedCount++;
                    }
                }

                if (updatedCount > 0)
                {
                    await _unitOfWork.SaveAsync();
                    _logger.LogInformation($"Updated {updatedCount} project statuses");
                }
                else
                {
                    _logger.LogInformation("No project status updates required");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in automatic project status check: {ex.Message}");
                throw;
            }
        }
    }
}