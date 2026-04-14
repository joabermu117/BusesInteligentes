package com.adm.ms_security.Models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document
public class Profile {
    @Id
    private String id;

    private String phone;
    private String address;
    private String photo;
    private String githubUsername;
    private boolean googleLinked;
    private boolean githubLinked;
    private boolean microsoftLinked;

    // En el diagrama de entidades la flecha sale de Perfil (débil) y apunta a
    // Usuario (fuerte), por eso este es el que referencia a Usuario
    // Relación 1 a 1
    @DBRef
    private User user;

    public Profile() {

    }

    public Profile(String phone, String address, String photo) {
        this.phone = phone;
        this.address = address;
        this.photo = photo;
        this.googleLinked = false;
        this.githubLinked = false;
        this.microsoftLinked = false;
    }
}
