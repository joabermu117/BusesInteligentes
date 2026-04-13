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

import com.adm.ms_security.Models.Session;
import com.adm.ms_security.Services.SessionService;

@CrossOrigin
@RestController
@RequestMapping("/api/sessions")
/**
 * API CRUD de sesiones persistidas.
 * Util para administracion/inspeccion de sesiones activas historicas.
 */
public class SessionController {

    @Autowired
    private SessionService theSessionService;

    // Lista sesiones.
    @GetMapping("")
    public List<Session> find() {
        return this.theSessionService.find();
    }

    // Consulta sesion por id.
    @GetMapping("{id}")
    public Session findById(@PathVariable String id) {
        return this.theSessionService.findById(id);
    }

    // Crea sesion.
    @PostMapping
    public Session create(@RequestBody Session newSession) {
        return this.theSessionService.create(newSession);
    }

    // Actualiza token/expiracion/2FA de una sesion.
    @PutMapping("{id}")
    public Session update(@PathVariable String id, @RequestBody Session newSession) {
        return this.theSessionService.update(id, newSession);
    }

    // Elimina sesion por id.
    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.theSessionService.delete(id);
    }

}