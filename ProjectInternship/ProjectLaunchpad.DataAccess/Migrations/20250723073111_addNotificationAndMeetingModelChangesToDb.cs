using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addNotificationAndMeetingModelChangesToDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Agenda",
                table: "Meetings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
    name: "ClientId",
    table: "Meetings",
    type: "int",
    nullable: true); // ✅ Nullable avoids FK conflicts


            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Meetings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Meetings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Meetings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<DateTime>(
                name: "JoinedAt",
                table: "MeetingParticipants",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<DateTime>(
                name: "InviteSentAt",
                table: "MeetingParticipants",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotificationRead",
                table: "MeetingParticipants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RelatedMeetingId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Read = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_notifications_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Meetings_ClientId",
                table: "Meetings",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_MeetingParticipants_UserId",
                table: "MeetingParticipants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_UserId",
                table: "notifications",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_MeetingParticipants_users_UserId",
                table: "MeetingParticipants",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Meetings_users_ClientId",
                table: "Meetings",
                column: "ClientId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MeetingParticipants_users_UserId",
                table: "MeetingParticipants");

            migrationBuilder.DropForeignKey(
                name: "FK_Meetings_users_ClientId",
                table: "Meetings");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropIndex(
                name: "IX_Meetings_ClientId",
                table: "Meetings");

            migrationBuilder.DropIndex(
                name: "IX_MeetingParticipants_UserId",
                table: "MeetingParticipants");

            migrationBuilder.DropColumn(
                name: "Agenda",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "InviteSentAt",
                table: "MeetingParticipants");

            migrationBuilder.DropColumn(
                name: "NotificationRead",
                table: "MeetingParticipants");

            migrationBuilder.AlterColumn<DateTime>(
                name: "JoinedAt",
                table: "MeetingParticipants",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);
        }
    }
}
