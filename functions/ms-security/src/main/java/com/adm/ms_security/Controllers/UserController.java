package com.adm.ms_security.Controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.adm.ms_security.Models.User;
import com.adm.ms_security.Services.UserService;

@CrossOrigin
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService theUserService;

    @GetMapping("")
    public List<User> find() {
        return this.theUserService.find();
    }

    @GetMapping("{id}")
    public User findById(@PathVariable String id) {
        return this.theUserService.findById(id);
    }

    @PostMapping
    public User create(@RequestBody User newUser) {
        return this.theUserService.create(newUser);
    }

    @PutMapping("{id}")
    public User update(@PathVariable String id, @RequestBody User newUser) {
        return this.theUserService.update(id, newUser);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        this.theUserService.delete(id);
    }

    // Al Usuario ser el fuerte la asociación debe realizarse aquí
    @PostMapping("{userId}/profile/{profileId}")
    public ResponseEntity<Map<String, String>> addUserProfile(
            @PathVariable String userId,
            @PathVariable String profileId) {

        boolean response = this.theUserService.addProfile(userId, profileId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Profile not found"));
        }
    }

    @DeleteMapping("{userId}/profile/{profileId}")
    public ResponseEntity<Map<String, String>> deleteUserProfile(
            @PathVariable String userId,
            @PathVariable String profileId) {

        boolean response = this.theUserService.removeProfile(userId, profileId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Profile not found"));
        }
    }

    // Al Usuario ser el fuerte la asociación debe realizarse aquí
    @PostMapping("{userId}/session/{sessionId}")
    public ResponseEntity<Map<String, String>> addUserSession(
            @PathVariable String userId,
            @PathVariable String sessionId) {

        boolean response = this.theUserService.addSession(userId, sessionId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Session not found"));
        }
    }
    @DeleteMapping("{userId}/session/{sessionId}")
    public ResponseEntity<Map<String, String>> deleteUserSession(
            @PathVariable String userId,
            @PathVariable String sessionId) {

        boolean response = this.theUserService.removeSession(userId, sessionId);
        if (response) {
            return ResponseEntity.ok(Map.of("message", "Success"));
        } else {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User or Session not found"));
        }
    }
}

