using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using ProjectLaunchpad.Utility;

namespace ProjectLaunchpad.Services
{
    public class AuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly JwtHelper _jwt;

        public AuthService(IUnitOfWork unitOfWork, JwtHelper jwt)
        {
            _unitOfWork = unitOfWork;
            _jwt = jwt;
        }

        public async Task<string> RegisterAsync(UserRegisterDTO dto)
        {
            // Validation: Password and ConfirmPassword should match
            if (dto.Password != dto.ConfirmPassword)
                throw new Exception("Password and Confirm Password do not match.");

            if (await _unitOfWork.Users.UserExistsAsync(dto.Email))
                throw new Exception("Email already in use");

            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PhoneNo = dto.PhoneNo,
                Password = PasswordHasher.Hash(dto.Password),
                Role = dto.Role,
                Gender = dto.Gender
            };

            await _unitOfWork.Users.AddUserAsync(user);
            await _unitOfWork.SaveAsync();

            return _jwt.GenerateToken(user.Id.ToString(), user.Email, user.Role);
        }

        public async Task<string> LoginAsync(UserLoginDTO dto)
        {
            var user = await _unitOfWork.Users.GetUserByEmailAsync(dto.Email);
            if (user == null || !PasswordHasher.Verify(dto.Password, user.Password))
                throw new Exception("Invalid email or password");

            return _jwt.GenerateToken(user.Id.ToString(), user.Email, user.Role);
        }
    }
}
