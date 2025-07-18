using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addPojectIdToLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
               name: "ProjectId",
               table: "logs",
               type: "int",
               nullable: true); // ✅ Nullable

            migrationBuilder.CreateIndex(
                name: "IX_logs_ProjectId",
                table: "logs",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_logs_projects_ProjectId",
                table: "logs",
                column: "ProjectId",
                principalTable: "projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_logs_projects_ProjectId",
                table: "logs");

            migrationBuilder.DropIndex(
                name: "IX_logs_ProjectId",
                table: "logs");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "logs");
        }
    }
}
