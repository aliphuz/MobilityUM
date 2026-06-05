import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const decoded = JSON.parse(jsonPayload);
    
    // Extract standard ASP.NET Core claims
    const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    const email = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
    const name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
    const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    return { userId, email, name, role };
  } catch (e) {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (token) {
      return decodeToken(token);
    }
    return null;
  });

  const login = (token) => {
    localStorage.setItem('token', token);
    const decodedUser = decodeToken(token);
    if (decodedUser) {
      localStorage.setItem('user', JSON.stringify(decodedUser));
      setUser(decodedUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);