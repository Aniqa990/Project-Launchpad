using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addMeetingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_deliverables_projects_ProjectId",
                table: "deliverables");

            migrationBuilder.RenameColumn(
                name: "ProjectId",
                table: "deliverables",
                newName: "projectId");

            migrationBuilder.RenameIndex(
                name: "IX_deliverables_ProjectId",
                table: "deliverables",
                newName: "IX_deliverables_projectId");

            migrationBuilder.AlterColumn<int>(
                name: "projectId",
                table: "deliverables",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "Meetings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    MeetingRoomId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecordingUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Meetings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MeetingParticipants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MeetingId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LeftAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeetingParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MeetingParticipants_Meetings_MeetingId",
                        column: x => x.MeetingId,
                        principalTable: "Meetings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MeetingParticipants_MeetingId",
                table: "MeetingParticipants",
                column: "MeetingId");

            migrationBuilder.AddForeignKey(
                name: "FK_deliverables_projects_projectId",
                table: "deliverables",
                column: "projectId",
                principalTable: "projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_deliverables_projects_projectId",
                table: "deliverables");

            migrationBuilder.DropTable(
                name: "MeetingParticipants");

            migrationBuilder.DropTable(
                name: "Meetings");

            migrationBuilder.RenameColumn(
                name: "projectId",
                table: "deliverables",
                newName: "ProjectId");

            migrationBuilder.RenameIndex(
                name: "IX_deliverables_projectId",
                table: "deliverables",
                newName: "IX_deliverables_ProjectId");

            migrationBuilder.AlterColumn<int>(
                name: "ProjectId",
                table: "deliverables",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_deliverables_projects_ProjectId",
                table: "deliverables",
                column: "ProjectId",
                principalTable: "projects",
                principalColumn: "Id");
        }
    }
}
