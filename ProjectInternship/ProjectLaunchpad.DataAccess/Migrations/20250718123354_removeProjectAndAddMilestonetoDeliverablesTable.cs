using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    public partial class removeProjectAndAddMilestonetoDeliverablesTable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop ProjectId if exists (check manually before running this)
            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "deliverables");

            // Add MilestoneId column
            migrationBuilder.AddColumn<int>(
                name: "MilestoneId",
                table: "deliverables",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // Add foreign key to milestones table
            migrationBuilder.CreateIndex(
                name: "IX_deliverables_MilestoneId",
                table: "deliverables",
                column: "MilestoneId");

            migrationBuilder.AddForeignKey(
                name: "FK_deliverables_milestones_MilestoneId",
                table: "deliverables",
                column: "MilestoneId",
                principalTable: "milestones",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop FK and column
            migrationBuilder.DropForeignKey(
                name: "FK_deliverables_milestones_MilestoneId",
                table: "deliverables");

            migrationBuilder.DropIndex(
                name: "IX_deliverables_MilestoneId",
                table: "deliverables");

            migrationBuilder.DropColumn(
                name: "MilestoneId",
                table: "deliverables");

            // Re-add ProjectId if needed
            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "deliverables",
                type: "int",
                nullable: true);
        }
    }
}
