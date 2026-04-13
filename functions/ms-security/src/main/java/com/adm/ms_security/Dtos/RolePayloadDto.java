package com.adm.ms_security.Dtos;

import lombok.Data;

import java.util.List;

@Data
public class RolePayloadDto {
    private String name;
    private String description;
    private List<String> permissionIds;
}
