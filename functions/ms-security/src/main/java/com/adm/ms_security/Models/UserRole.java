package com.adm.ms_security.Models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class UserRole {
    @Id
    private String id;

    // En el diagrama de entidades la línea está entre Rol y Usuario, por eso se genera otra entidad llamada UsuarioRol que es el que referencia a ambas
    // Relación N (Usuario) a N (Sesiónn) = UsuarioRol
    @DBRef
    private User user;
    @DBRef
    private Role role;

    public UserRole(){
    }

    public UserRole(User user, Role role){
        this.user=user;
        this.role=role;
    }
}



