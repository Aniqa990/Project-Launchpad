using System;
using System.Collections.Generic;
using ProjectLaunchpad.Models.Models.DTOs.AuthenticationDTO;

namespace ProjectLaunchpad.Models.Models.DTOs.ProjectDTO
{
    public class ProjectResponseDTO
    {
        public int Id { get; set; }
        public string? ProjectTitle { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public decimal? Budget { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? Deadline { get; set; }
        public int? ClientId { get; set; }
        public string? CategoryOrDomain { get; set; }
        public string? PaymentType { get; set; }
        public int? NumberOfFreelancers { get; set; }
        public string? AttachedDocumentPath { get; set; }
        public UserDTO? Client { get; set; }
        public string? RequiredSkills { get; set; }
        public List<UserDTO>? Team { get; set; }
        public int? Progress { get; set; }
        public string? ApprovalStatus { get; set; }
        public string? RejectionReason { get; set; }
    }
}