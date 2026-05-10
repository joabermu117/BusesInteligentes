package com.adm.ms_security.Dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthTokenResponse {
    private String token;
    private List<String> roles;

    public AuthTokenResponse(String token) {
        this.token = token;
        this.roles = List.of();
    }
}