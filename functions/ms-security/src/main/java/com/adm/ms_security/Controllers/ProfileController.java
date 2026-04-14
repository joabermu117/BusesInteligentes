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

import com.adm.ms_security.Dtos.CompleteProfileRequestDto;
import com.adm.ms_security.Dtos.UnlinkProviderRequestDto;
import com.adm.ms_security.Models.Profile;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Services.ValidatorService;
import com.adm.ms_security.Services.ProfileService;
import com.adm.ms_security.Services.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/api/profiles")
/**
 * API de perfiles extendidos del usuario.
 * Maneja CRUD de perfil y desvinculacion de proveedores sociales.
 */
public class ProfileController {

    @Autowired
    private ProfileService theProfileService;

    @Autowired
    private UserService theUserService;

    @Autowired
    private ValidatorService validatorService;

    // Lista perfiles del sistema.
    @GetMapping("")
    public List<Profile> find() {
        return this.theProfileService.find();
    }

    // Obtiene perfil por id de perfil.
    @GetMapping("{id}")
    public Profile findById(@PathVariable String id) {
        return this.theProfileService.findById(id);
    }

    // Obtiene perfil asociado a un usuario.
    @GetMapping("user/{userId}")
    public Profile findByUserId(@PathVariable String userId) {
        return this.theProfileService.findByUserId(userId);
    }

    // Crea perfil manualmente (caso administrativo).
    @PostMapping
    public Profile create(@RequestBody Profile newProfile) {
        return this.theProfileService.create(newProfile);
    }

    // Actualiza datos editables del perfil.
    @PutMapping("{id}")
    public Profile update(@PathVariable String id, @RequestBody Profile newProfile) {
        return this.theProfileService.update(id, newProfile);
    }

    // Elimina perfil por id.
    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.theProfileService.delete(id);
    }

    // Desvincula proveedor social y establece/actualiza contraseña local.
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

    // Completa datos obligatorios del perfil ciudadano tras primer login
    @PostMapping("complete")
    public ResponseEntity<Map<String, Object>> completeProfile(
            @Valid @RequestBody CompleteProfileRequestDto request,
            HttpServletRequest httpRequest) {
        User authenticatedUser = this.validatorService.getUser(httpRequest);
        if (authenticatedUser == null || authenticatedUser.getId() == null || authenticatedUser.getId().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "No fue posible identificar el usuario autenticado"));
        }

        if (request.getUserId() != null
            && !request.getUserId().isBlank()
            && !authenticatedUser.getId().equals(request.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "No puedes completar el perfil de otro usuario"));
        }

        Profile profile = this.theProfileService.completeProfile(
            authenticatedUser.getId(),
                request.getPhone(),
                request.getAddress());

        if (profile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Perfil no encontrado"));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Perfil completado",
                "profileComplete", true));
    }

    // Verifica si el perfil ciudadano está completo
    @GetMapping("user/{userId}/complete")
    public ResponseEntity<Map<String, Object>> checkProfileComplete(
            @PathVariable String userId,
            HttpServletRequest httpRequest) {
        User authenticatedUser = this.validatorService.getUser(httpRequest);
        if (authenticatedUser == null || authenticatedUser.getId() == null || authenticatedUser.getId().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "No fue posible identificar el usuario autenticado"));
        }

        if (!authenticatedUser.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "No puedes consultar el perfil de otro usuario"));
        }

        boolean incomplete = this.theProfileService.isProfileIncomplete(authenticatedUser.getId());
        return ResponseEntity.ok(Map.of("profileComplete", !incomplete));
    }
}
