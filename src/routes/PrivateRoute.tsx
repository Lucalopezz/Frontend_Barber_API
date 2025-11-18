import { useUser } from "@/hooks/useUser";
import { showToast } from "@/utils/toast";
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
    showToast("Você não está autenticado! Por favor, faça login.", "error");
    return <Navigate to="/login" replace />;
  }

  return children;
};
