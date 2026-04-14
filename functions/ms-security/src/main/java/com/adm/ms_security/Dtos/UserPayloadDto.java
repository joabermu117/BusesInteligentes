package com.adm.ms_security.Dtos;

import lombok.Data;

import java.util.List;

@Data
public class UserPayloadDto {
    private String name;
    private String email;
    private String password;
    private List<String> roleIds;
}
