import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, role, roleRequired, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/" state={{ authError: true }} replace />;
  }
  return children;
};

export default ProtectedRoute;
