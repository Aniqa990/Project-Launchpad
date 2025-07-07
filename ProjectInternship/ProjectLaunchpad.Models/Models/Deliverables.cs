using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Models.Models
{
    public class Deliverables
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string uploadFiles { get; set; }

        //add fk-relation 
        public int projectId { get; set; }

        [Required]
        public string comment { get; set; }

        [Required]
        public string Status  { get; set; }
    }
}
