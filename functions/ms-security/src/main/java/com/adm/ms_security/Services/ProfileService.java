package com.adm.ms_security.Services;

import com.adm.ms_security.Models.Profile;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Repositories.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
/**
 * Administra el perfil extendido del usuario (foto, telefono, proveedores
 * sociales).
 * Se usa desde controladores de perfil y desde flujos de autenticacion.
 */
public class ProfileService {
    private static final String GOOGLE_PROVIDER = "google";
    private static final String GITHUB_PROVIDER = "github";
    private static final String MICROSOFT_PROVIDER = "microsoft";

    @Autowired
    private ProfileRepository theProfileRepository;

    public List<Profile> find() {
        return this.theProfileRepository.findAll();
    }

    public Profile findById(String id) {
        Profile theProfile = this.theProfileRepository.findById(id).orElse(null);
        return theProfile;
    }

    public Profile findByUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }

        return this.theProfileRepository.findByUserId(userId).orElse(null);
    }

    public Profile findByGithubUsername(String githubUsername) {
        if (githubUsername == null || githubUsername.isBlank()) {
            return null;
        }

        return this.theProfileRepository.findByGithubUsernameIgnoreCase(githubUsername.trim()).orElse(null);
    }

    public Profile create(Profile newProfile) {
        return this.theProfileRepository.save(newProfile);
    }

    // Garantiza que cada usuario tenga un perfil; si no existe, lo crea.
    public Profile ensureProfileForUser(User user) {
        if (user == null || user.getId() == null || user.getId().isBlank()) {
            return null;
        }

        Profile existingProfile = this.theProfileRepository.findByUserId(user.getId()).orElse(null);
        if (existingProfile != null) {
            if (existingProfile.getUser() == null) {
                existingProfile.setUser(user);
                return this.theProfileRepository.save(existingProfile);
            }

            return existingProfile;
        }

        Profile profile = new Profile();
        profile.setUser(user);
        return this.theProfileRepository.save(profile);
    }

    // Variante para login social: asegura perfil y sincroniza datos del proveedor.
    public Profile ensureProfileForUserWithSocialData(
            User user,
            String provider,
            String photoUrl,
            String githubUsername) {
        Profile profile = ensureProfileForUser(user);
        if (profile == null) {
            return null;
        }

        boolean changed = false;
        String normalizedProvider = normalizeProvider(provider);

        if (photoUrl != null && !photoUrl.isBlank() && !photoUrl.equals(profile.getPhoto())) {
            profile.setPhoto(photoUrl);
            changed = true;
        }

        if (GITHUB_PROVIDER.equals(normalizedProvider)
                && githubUsername != null
                && !githubUsername.isBlank()
                && !githubUsername.equals(profile.getGithubUsername())) {
            profile.setGithubUsername(githubUsername);
            changed = true;
        }

        if (GOOGLE_PROVIDER.equals(normalizedProvider) && !profile.isGoogleLinked()) {
            profile.setGoogleLinked(true);
            changed = true;
        }

        if (GITHUB_PROVIDER.equals(normalizedProvider) && !profile.isGithubLinked()) {
            profile.setGithubLinked(true);
            changed = true;
        }

        if (MICROSOFT_PROVIDER.equals(normalizedProvider) && !profile.isMicrosoftLinked()) {
            profile.setMicrosoftLinked(true);
            changed = true;
        }

        if (!changed) {
            return profile;
        }

        return this.theProfileRepository.save(profile);
    }

    public Profile update(String id, Profile newProfile) {
        Profile actualProfile = this.theProfileRepository.findById(id).orElse(null);

        if (actualProfile != null) {
            actualProfile.setPhone(newProfile.getPhone());
            actualProfile.setPhoto(newProfile.getPhoto());
            actualProfile.setGithubUsername(newProfile.getGithubUsername());
            actualProfile.setGoogleLinked(newProfile.isGoogleLinked());
            actualProfile.setGithubLinked(newProfile.isGithubLinked());
            actualProfile.setMicrosoftLinked(newProfile.isMicrosoftLinked());
            this.theProfileRepository.save(actualProfile);
            return actualProfile;
        } else {
            return null;
        }
    }

    // Desvincula proveedor social y limpia campos derivados cuando aplica.
    public Profile unlinkProvider(String userId, String provider) {
        if (userId == null || userId.isBlank()) {
            return null;
        }

        Profile profile = this.theProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            return null;
        }

        String normalizedProvider = normalizeProvider(provider);
        boolean changed = false;

        if (GOOGLE_PROVIDER.equals(normalizedProvider) && profile.isGoogleLinked()) {
            profile.setGoogleLinked(false);
            changed = true;
        }

        if (GITHUB_PROVIDER.equals(normalizedProvider) && profile.isGithubLinked()) {
            profile.setGithubLinked(false);
            profile.setGithubUsername(null);
            changed = true;
        }

        if (MICROSOFT_PROVIDER.equals(normalizedProvider) && profile.isMicrosoftLinked()) {
            profile.setMicrosoftLinked(false);
            changed = true;
        }

        if (!profile.isGoogleLinked() && !profile.isGithubLinked() && !profile.isMicrosoftLinked()) {
            profile.setPhoto(null);
            changed = true;
        }

        if (!changed) {
            return profile;
        }

        return this.theProfileRepository.save(profile);
    }

    public void delete(String id) {
        Profile theProfile = this.theProfileRepository.findById(id).orElse(null);
        if (theProfile != null) {
            this.theProfileRepository.delete(theProfile);
        }
    }

    private String normalizeProvider(String provider) {
        if (provider == null || provider.isBlank()) {
            return "";
        }

        String normalized = provider.trim().toLowerCase();
        if (normalized.contains("google")) {
            return GOOGLE_PROVIDER;
        }

        if (normalized.contains("github")) {
            return GITHUB_PROVIDER;
        }

        if (normalized.contains("microsoft")) {
            return MICROSOFT_PROVIDER;
        }

        return normalized;
    }

    // Verifica si el perfil del ciudadano está incompleto (sin dirección o teléfono)
    public boolean isProfileIncomplete(String userId) {
        Profile profile = findByUserId(userId);
        if (profile == null) return true;
        boolean missingPhone = profile.getPhone() == null || profile.getPhone().isBlank();
        boolean missingAddress = profile.getAddress() == null || profile.getAddress().isBlank();
        return missingPhone || missingAddress;
    }

    // Completa los datos obligatorios del perfil ciudadano
    public Profile completeProfile(String userId, String phone, String address) {
        Profile profile = findByUserId(userId);
        if (profile == null) return null;

        if (phone != null && !phone.isBlank()) profile.setPhone(phone.trim());
        if (address != null && !address.isBlank()) profile.setAddress(address.trim());
        return this.theProfileRepository.save(profile);
    }
}
