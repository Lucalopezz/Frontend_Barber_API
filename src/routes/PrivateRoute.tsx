import { useUser } from "@/hooks/useUser";
import { Navigate, useLocation } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactNode;
}
export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const location = useLocation();
  const { authenticated, loading, sessionError, retrySession } = useUser();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (sessionError) return <div role="alert">{sessionError} <button onClick={() => void retrySession()}>Tentar recuperar sessão</button></div>;

  if (!authenticated) {
    return <Navigate to="/login" replace state={{from: location.pathname}} />;
  }

  return children;
};
