package com.adm.ms_security.Controllers;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
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

import com.adm.ms_security.Models.User;
import com.adm.ms_security.Services.UserService;

@CrossOrigin
@RestController
@RequestMapping("/api/users")
/**
 * API de usuarios para administracion.
 * Expone CRUD y asociaciones de usuario con perfil/sesion.
 */
public class UserController {

    @Autowired
    private UserService theUserService;

    // Lista todos los usuarios registrados.
    @GetMapping("")
    public List<User> find() {
        return this.theUserService.find();
    }

    // Consulta detalle de un usuario por id.
    @GetMapping("{id}")
    public User findById(@PathVariable String id) {
        return this.theUserService.findById(id);
    }

    // Crea usuario nuevo (normaliza email y asegura perfil en capa service).
    @PostMapping
    public User create(@Valid @RequestBody User newUser) {
        return this.theUserService.create(newUser);
    }

    // Actualiza datos base del usuario.
    @PutMapping("{id}")
    public User update(@PathVariable String id, @RequestBody User newUser) {
        return this.theUserService.update(id, newUser);
    }

    // Elimina usuario por id.
    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.theUserService.delete(id);
    }

    // Asocia un perfil existente a un usuario existente.
    @PostMapping("{userId}/profile/{profileId}")
    public ResponseEntity<Map<String, String>> addUserProfile(
            @PathVariable String userId,
            @PathVariable String profileId) {

        boolean response = this.theUserService.addProfile(userId, profileId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Profile not found"));
        }
    }

    // Desasocia perfil de usuario sin borrar el documento de perfil.
    @DeleteMapping("{userId}/profile/{profileId}")
    public ResponseEntity<Map<String, String>> deleteUserProfile(
            @PathVariable String userId,
            @PathVariable String profileId) {

        boolean response = this.theUserService.removeProfile(userId, profileId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Profile not found"));
        }
    }

    // Asocia una sesion existente a un usuario existente.
    @PostMapping("{userId}/session/{sessionId}")
    public ResponseEntity<Map<String, String>> addUserSession(
            @PathVariable String userId,
            @PathVariable String sessionId) {

        boolean response = this.theUserService.addSession(userId, sessionId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Session not found"));
        }
    }

    // Desasocia sesion de usuario.
    @DeleteMapping("{userId}/session/{sessionId}")
    public ResponseEntity<Map<String, String>> deleteUserSession(
            @PathVariable String userId,
            @PathVariable String sessionId) {

        boolean response = this.theUserService.removeSession(userId, sessionId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Session not found"));
        }
    }
}
