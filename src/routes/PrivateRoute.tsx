import { useUser } from "@/hooks/useUser";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactNode;
}
export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { authenticated, loading } = useUser();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
