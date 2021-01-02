﻿using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    public class UsersController : BaseApiController
    {
        private readonly IUserRepository _userRepository;
        private readonly ILibraryRepository _libraryRepository;

        public UsersController(IUserRepository userRepository, ILibraryRepository libraryRepository)
        {
            _userRepository = userRepository;
            _libraryRepository = libraryRepository;
        }
        
        [Authorize(Policy = "RequireAdminRole")]
        [HttpPost("add-library")]
        public async Task<ActionResult> AddLibrary(CreateLibraryDto createLibraryDto)
        {
            // NOTE: I think we should move this into library controller because it gets added to all admins
            
            var user = await _userRepository.GetUserByUsernameAsync(User.GetUsername());

            if (user == null) return BadRequest("Could not validate user");
            
            
            if (await _libraryRepository.LibraryExists(createLibraryDto.Name))
            {
                return BadRequest("Library name already exists. Please choose a unique name to the server.");
            }
            
            var library = new Library
            {
                Name = createLibraryDto.Name.ToLower(),
                Type = createLibraryDto.Type,
                AppUsers = new List<AppUser>() { user }
            };

            library.Folders = createLibraryDto.Folders.Select(x => new FolderPath
            {
                Path = x,
                Library = library
            }).ToList();

            user.Libraries ??= new List<Library>(); // If user is null, then set it
            
            user.Libraries.Add(library);

            if (await _userRepository.SaveAllAsync())
            {
                return Ok();
            }
            
            return BadRequest("Not implemented");
        }
        
        [Authorize(Policy = "RequireAdminRole")]
        [HttpDelete("delete-user")]
        public async Task<ActionResult> DeleteUser(string username)
        {
            var user = await _userRepository.GetUserByUsernameAsync(username);
            _userRepository.Delete(user);

            if (await _userRepository.SaveAllAsync())
            {
                return Ok();
            }
            
            return BadRequest("Could not delete the user.");
        }
        
        [Authorize(Policy = "RequireAdminRole")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MemberDto>>> GetUsers()
        {
            return Ok(await _userRepository.GetMembersAsync());
        }

        [HttpGet("has-library-access")]
        public async Task<ActionResult<bool>> HasLibraryAccess(int libraryId)
        {
            var user = await _userRepository.GetUserByUsernameAsync(User.GetUsername());

            if (user == null) return BadRequest("Could not validate user");

            var libs = await _libraryRepository.GetLibrariesForUsernameAysnc(user.UserName);

            return Ok(libs.Any(x => x.Id == libraryId));
        }
    }
}