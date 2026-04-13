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

import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Services.RoleService;

@CrossOrigin
@RestController
@RequestMapping("/api/roles")
/**
 * API CRUD de roles.
 * Sirve para administrar catalogo de roles consumido por ACL.
 */
public class RoleController {

    @Autowired
    private RoleService theRoleService;

    // Lista roles.
    @GetMapping("")
    public List<Role> find() {
        return this.theRoleService.find();
    }

    // Consulta rol por id.
    @GetMapping("{id}")
    public Role findById(@PathVariable String id) {
        return this.theRoleService.findById(id);
    }

    // Crea rol nuevo.
    @PostMapping
    public Role create(@RequestBody Role newRole) {
        return this.theRoleService.create(newRole);
    }

    // Actualiza nombre/descripcion del rol.
    @PutMapping("{id}")
    public Role update(@PathVariable String id, @RequestBody Role newRole) {
        return this.theRoleService.update(id, newRole);
    }

    // Elimina rol (si no esta asignado a usuarios).
    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.theRoleService.delete(id);
    }
}