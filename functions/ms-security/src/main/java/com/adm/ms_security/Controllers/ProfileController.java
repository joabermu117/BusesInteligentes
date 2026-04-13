package com.adm.ms_security.Controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.adm.ms_security.Dtos.UnlinkProviderRequestDto;
import com.adm.ms_security.Models.Profile;
import com.adm.ms_security.Services.ProfileService;
import com.adm.ms_security.Services.UserService;

import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    @Autowired
    private ProfileService theProfileService;

    @Autowired
    private UserService theUserService;

    @GetMapping("")
    public List<Profile> find() {
        return this.theProfileService.find();
    }

    @GetMapping("{id}")
    public Profile findById(@PathVariable String id) {
        return this.theProfileService.findById(id);
    }

    @GetMapping("user/{userId}")
    public Profile findByUserId(@PathVariable String userId) {
        return this.theProfileService.findByUserId(userId);
    }

    @PostMapping
    public Profile create(@RequestBody Profile newProfile) {
        return this.theProfileService.create(newProfile);
    }

    @PutMapping("{id}")
    public Profile update(@PathVariable String id, @RequestBody Profile newProfile) {
        return this.theProfileService.update(id, newProfile);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.theProfileService.delete(id);
    }

    @DeleteMapping("user/{userId}/providers/{provider}")
    public ResponseEntity<Map<String, String>> unlinkProvider(
            @PathVariable String userId,
            @PathVariable String provider,
            @Valid @RequestBody UnlinkProviderRequestDto request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Las contraseñas no coinciden"));
        }

        boolean passwordUpdated = this.theUserService.updatePassword(userId, request.getPassword());
        if (!passwordUpdated) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "No fue posible actualizar la contraseña"));
        }

        Profile profile = this.theProfileService.unlinkProvider(userId, provider);

        if (profile == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User profile not found"));
        }

        return ResponseEntity.ok(Map.of("message", "Provider desvinculado"));
    }

}
