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

import com.adm.ms_security.Models.Profile;
import com.adm.ms_security.Services.ProfileService;

@CrossOrigin
@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    @Autowired
    private ProfileService theProfileService;

    @GetMapping("")
    public List<Profile> find() {
        return this.theProfileService.find();
    }

    @GetMapping("{id}")
    public Profile findById(@PathVariable String id) {
        return this.theProfileService.findById(id);
    }

    @PostMapping
    public Profile create(@RequestBody Profile newProfile) {
        return this.theProfileService.create(newProfile);
    }

    @PutMapping("{id}")
    public Profile update(@PathVariable String id, @RequestBody Profile newProfile) {
        return this.theProfileService.update(id, newProfile);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.theProfileService.delete(id);
    }

}
