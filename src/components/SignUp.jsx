import { Navigate } from "react-router-dom";

export default function SignUp() {
  return <Navigate to="/auth?mode=signup" replace />;
}
