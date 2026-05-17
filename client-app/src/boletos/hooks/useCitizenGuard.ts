import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCitizenId } from "../../shared/utils/boarding";
import { getAuthUserId } from "../../config/httpClient";

/**
 * Hook que provee el citizenId desde localStorage
 * y redirige a login si no existe.
 */
export const useCitizenGuard = () => {
  const navigate = useNavigate();
  const [citizenId] = useState(getCitizenId);
  const jwtUserId = getAuthUserId();

  useEffect(() => {
    if (!citizenId) {
      navigate("/login", { replace: true });
      return;
    }

    if (!localStorage.getItem("citizenId") && jwtUserId) {
      localStorage.setItem("citizenId", jwtUserId);
    }
  }, [citizenId, jwtUserId, navigate]);

  return citizenId;
};
