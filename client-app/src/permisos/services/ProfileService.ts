import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { Profile } from "../models/Profile";

type ProfileApiShape = Partial<Profile> & {
  _id?: string;
  user?: { id?: string; _id?: string };
};

const PROFILES_API_URL = `${API_CONFIG.permisosBaseUrl}/profiles`;

const normalizeProfile = (profile: ProfileApiShape): Profile => ({
  id: profile.id ?? profile._id ?? "",
  userId: profile.userId ?? profile.user?.id ?? profile.user?._id ?? "",
  phone: profile.phone ?? "",
  photo: profile.photo ?? "",
  githubUsername: profile.githubUsername ?? "",
  googleLinked: Boolean(profile.googleLinked),
  githubLinked: Boolean(profile.githubLinked),
  microsoftLinked: Boolean(profile.microsoftLinked),
});

class ProfileServiceClass {
  async getProfileByUserId(userId: string): Promise<Profile | null> {
    try {
      const response = await httpClient.get<ProfileApiShape>(
        `${PROFILES_API_URL}/user/${userId}`,
      );
      if (!response.data) {
        return null;
      }

      return normalizeProfile(response.data);
    } catch {
      return null;
    }
  }

  async unlinkProvider(
    userId: string,
    provider: "google" | "github" | "microsoft",
    password: string,
    confirmPassword: string,
  ): Promise<void> {
    await httpClient.delete(
      `${PROFILES_API_URL}/user/${userId}/providers/${provider}`,
      {
        data: {
          password,
          confirmPassword,
        },
      },
    );
  }
}

export const ProfileService = new ProfileServiceClass();
