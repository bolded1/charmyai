import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Redirect to the unified activate-trial page with firm plan pre-selected
export default function ActivateFirmPlanPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/activate-trial?plan=firm", { replace: true });
  }, [navigate]);
  return null;
}