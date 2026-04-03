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
public class SessionController {

    @Autowired
    private SessionService theSessionService;

    @GetMapping("")
    public List<Session> find() {
        return this.theSessionService.find();
    }

    @GetMapping("{id}")
    public Session findById(@PathVariable String id) {
        return this.theSessionService.findById(id);
    }

    @PostMapping
    public Session create(@RequestBody Session newSession) {
        return this.theSessionService.create(newSession);
    }

    @PutMapping("{id}")
    public Session update(@PathVariable String id, @RequestBody Session newSession) {
        return this.theSessionService.update(id, newSession);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.theSessionService.delete(id);
    }

}