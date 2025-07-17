using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addProjectAssignmentTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.CreateTable(
               name: "projectFreelancers",
               columns: table => new
               {
                   ProjectId = table.Column<int>(type: "int", nullable: false),
                   FreelancerId = table.Column<int>(type: "int", nullable: false),
                   AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
               },
               constraints: table =>
               {
                   table.PrimaryKey("PK_projectFreelancers", x => new { x.ProjectId, x.FreelancerId });
                   table.ForeignKey(
                       name: "FK_projectFreelancers_freelancerProfiles_FreelancerId",
                       column: x => x.FreelancerId,
                       principalTable: "freelancerProfiles",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Restrict);
                   table.ForeignKey(
                       name: "FK_projectFreelancers_projects_ProjectId",
                       column: x => x.ProjectId,
                       principalTable: "projects",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
               });

            migrationBuilder.CreateIndex(
               name: "IX_projectFreelancers_FreelancerId",
               table: "projectFreelancers",
               column: "FreelancerId");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
               name: "projectFreelancers");
        }
    }
}
