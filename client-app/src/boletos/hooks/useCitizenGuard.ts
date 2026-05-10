import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCitizenId } from "../../shared/utils/boarding";

/**
 * Hook que provee el citizenId desde localStorage
 * y redirige a login si no existe.
 */
export const useCitizenGuard = () => {
  const navigate = useNavigate();
  const [citizenId] = useState(getCitizenId);

  useEffect(() => {
    if (!localStorage.getItem("citizenId")) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return citizenId;
};
