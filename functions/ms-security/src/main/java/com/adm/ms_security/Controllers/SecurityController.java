package com.adm.ms_security.Controllers;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.adm.ms_security.Dtos.AuthTokenResponse;
import com.adm.ms_security.Dtos.FirebaseLoginRequest;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Services.SecurityService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/api/public/security")
public class SecurityController {

    @Autowired
    private SecurityService theSecurityService;

    @PostMapping("login")
    public ResponseEntity<AuthTokenResponse> login(@RequestBody User theNewUser,
            final HttpServletResponse response) throws IOException {
        String token = this.theSecurityService.login(theNewUser);
        if (token == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(new AuthTokenResponse(token));
    }

    @PostMapping("firebase-login")
    public ResponseEntity<AuthTokenResponse> firebaseLogin(@Valid @RequestBody FirebaseLoginRequest request)
            throws IOException {
        FirebaseToken decodedToken;
        try {
            decodedToken = FirebaseAuth.getInstance().verifyIdToken(request.getIdToken().trim());
        } catch (FirebaseAuthException | IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = this.theSecurityService.findOrCreateFromFirebase(decodedToken);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(new AuthTokenResponse(this.theSecurityService.generateToken(user)));
    }

    @PostMapping("github-login")
    public ResponseEntity<AuthTokenResponse> githubLogin(@Valid @RequestBody FirebaseLoginRequest request)
            throws IOException {
        FirebaseToken decodedToken;
        try {
            decodedToken = FirebaseAuth.getInstance().verifyIdToken(request.getIdToken().trim());
        } catch (FirebaseAuthException | IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = this.theSecurityService.findOrCreateFromGithub(decodedToken);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(new AuthTokenResponse(this.theSecurityService.generateToken(user)));
    }
}
