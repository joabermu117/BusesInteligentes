package com.adm.ms_security.Models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class Profile {
    @Id
    private String id;

    private String phone;
    private String photo;

    // En el diagrama de entidades la flecha sale de Perfil (débil) y apunta a Usuario (fuerte), por eso este es el que referencia a Usuario
    // Relación 1 a 1
    @DBRef
    private User user;

    public Profile(){

    }

    public Profile( String phone, String photo) {
        this.phone = phone;
        this.photo = photo;
    }
}
