package com.adm.ms_security.Controllers;

import java.util.Map;
import java.util.List;

import com.adm.ms_security.Models.RolePermission;
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

import com.adm.ms_security.Services.RolePermissionService;

@CrossOrigin
@RestController
@RequestMapping("/api/role-permission")
/**
 * API para gestionar asignaciones rol-permiso.
 * Define que endpoints/metodos puede ejecutar cada rol.
 */
public class RolePermissionController {
    @Autowired
    private RolePermissionService theRolePermissionService;

    // Lista permisos asignados a un rol.
    @GetMapping("role/{roleId}")
    public List<RolePermission> getPermissionsByRole(@PathVariable String roleId) {
        return this.theRolePermissionService.getPermissionsByRole(roleId);
    }

    // Asigna permiso a rol.
    @PostMapping("role/{roleId}/permission/{permissionId}")
    public ResponseEntity<Map<String, String>> addRolePermission(
            @PathVariable String roleId,
            @PathVariable String permissionId) {

        boolean response = this.theRolePermissionService.addRolePermission(roleId, permissionId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Role or Permission not found"));
        }
    }

    // Remueve asignacion rol-permiso por id de la relacion.
    @DeleteMapping("{rolePermissionId}")
    public ResponseEntity<Map<String, String>> removeRolePermission(
            @PathVariable String rolePermissionId) {

        boolean response = this.theRolePermissionService.removeRolePermission(rolePermissionId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "RolePermission not found"));
        }
    }
}
