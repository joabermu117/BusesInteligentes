package com.adm.ms_security.Controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.adm.ms_security.Models.Permission;
import com.adm.ms_security.Services.PermissionService;

@CrossOrigin
@RestController
@RequestMapping("/api/permissions")
/**
 * API CRUD de permisos (recurso + metodo HTTP).
 * Estos permisos se enlazan a roles para autorizacion.
 */
public class PermissionController {

    @Autowired
    private PermissionService thePermissionService;

    // Lista permisos.
    @GetMapping("")
    public List<Permission> find() {
        return this.thePermissionService.find();
    }

    // Consulta permiso por id.
    @GetMapping("{id}")
    public Permission findById(@PathVariable String id) {
        return this.thePermissionService.findById(id);
    }

    // Crea permiso; la capa service evita duplicados.
    @PostMapping
    public Permission create(@RequestBody Permission newPermission) {
        return this.thePermissionService.create(newPermission);
    }

    // Actualiza datos del permiso.
    @PutMapping("{id}")
    public Permission update(@PathVariable String id, @RequestBody Permission newPermission) {
        return this.thePermissionService.update(id, newPermission);
    }

    // Elimina permiso (si no tiene roles asociados).
    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.thePermissionService.delete(id);
    }

}
