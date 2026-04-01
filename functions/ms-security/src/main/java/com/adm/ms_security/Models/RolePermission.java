package com.adm.ms_security.Models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class RolePermission {
    @Id
    private String id;

    // Entidad intermedia para representar la relación N a N entre Role y
    // Permission.
    @DBRef
    private Role role;
    @DBRef
    private Permission permission;

    public RolePermission() {
    }

    public RolePermission(Role role, Permission permission) {
        this.role = role;
        this.permission = permission;
    }
}
