package com.adm.ms_security.Controllers;

import java.util.Map;
import java.util.List;

import com.adm.ms_security.Models.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.adm.ms_security.Services.UserRoleService;

@CrossOrigin
@RestController
@RequestMapping("/api/user-role")
/**
 * API para gestionar asignaciones usuario-rol.
 * Se usa para controlar que permisos hereda cada usuario.
 */
public class UserRoleController {
    @Autowired
    private UserRoleService theUserRoleService;

    // Lista roles asignados a un usuario.
    @GetMapping("user/{userId}")
    public List<UserRole> getRolesByUser(@PathVariable String userId) {
        return this.theUserRoleService.getRolesByUser(userId);
    }

    // Asigna un rol al usuario.
    @PostMapping("user/{userId}/role/{roleId}")
    public ResponseEntity<Map<String, String>> addUserRole(
            @PathVariable String userId,
            @PathVariable String roleId) {

        boolean response = this.theUserRoleService.addUserRole(userId, roleId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Role not found"));
        }
    }

    // Remueve una asignacion usuario-rol por id de la relacion.
    @DeleteMapping("{userRoleId}")
    public ResponseEntity<Map<String, String>> removeUserRole(
            @PathVariable String userRoleId) {

        boolean response = this.theUserRoleService.removeUserRole(userRoleId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Role not found"));
        }
    }
}
