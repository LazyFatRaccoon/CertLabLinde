import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function useAuthRedirect(trigger) {
  const navigate = useNavigate();

  useEffect(() => {
    if (trigger) {
      navigate("/login");
    }
  }, [trigger, navigate]);
}
