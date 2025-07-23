using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addAudioTableToDB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "meetingAudioRecordings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MeetingId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    AudioUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meetingAudioRecordings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_meetingAudioRecordings_Meetings_MeetingId",
                        column: x => x.MeetingId,
                        principalTable: "Meetings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_meetingAudioRecordings_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_meetingAudioRecordings_MeetingId",
                table: "meetingAudioRecordings",
                column: "MeetingId");

            migrationBuilder.CreateIndex(
                name: "IX_meetingAudioRecordings_UserId",
                table: "meetingAudioRecordings",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "meetingAudioRecordings");
        }
    }
}
