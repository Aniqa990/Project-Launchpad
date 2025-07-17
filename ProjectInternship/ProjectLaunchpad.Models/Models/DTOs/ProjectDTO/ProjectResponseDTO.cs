using System;
using System.Collections.Generic;
using ProjectLaunchpad.Models.Models.DTOs.AuthenticationDTO;

namespace ProjectLaunchpad.Models.Models.DTOs.ProjectDTO
{
    public class ProjectResponseDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public decimal Budget { get; set; }
        public DateTime Deadline { get; set; }
        public int ClientId { get; set; }
        public string Category { get; set; }
        public string PaymentType { get; set; }
        public int NumberOfFreelancers { get; set; }
        public string AttachedDocumentPath { get; set; }
        public UserRegisterDTO Client { get; set; }
        public List<string> Skills { get; set; }
        public List<UserRegisterDTO> Team { get; set; }
        public int Progress { get; set; }
    }
}