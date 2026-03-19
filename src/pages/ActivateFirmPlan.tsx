import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Redirect to the unified payment page with firm plan pre-selected
export default function ActivateFirmPlanPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/payment?plan=firm", { replace: true });
  }, [navigate]);
  return null;
}