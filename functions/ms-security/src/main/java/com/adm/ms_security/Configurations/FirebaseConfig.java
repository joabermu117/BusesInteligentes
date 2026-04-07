package com.adm.ms_security.Configurations;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import java.io.IOException;
import java.io.InputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials.path}")
    private String credentialsPath;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        Resource resource = resolveResource(this.credentialsPath);
        try (InputStream inputStream = resource.getInputStream()) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(inputStream))
                    .build();
            return FirebaseApp.initializeApp(options);
        }
    }

    private Resource resolveResource(String path) {
        if (path.startsWith("classpath:")) {
            return new ClassPathResource(path.substring("classpath:".length()));
        }

        if (path.startsWith("file:")) {
            return new FileSystemResource(path.substring("file:".length()));
        }

        return new FileSystemResource(path);
    }
}