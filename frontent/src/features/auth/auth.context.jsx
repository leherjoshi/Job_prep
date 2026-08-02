import { createContext, useState,useEffect } from "react";
import { getme } from "./services/auth.api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const getAndSendUser=async() =>
    {
      try {
        const data = await getme()
        setUser(data.user)
      } catch (error) {
        // User is not authenticated, that's okay
        console.log("User not authenticated")
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    getAndSendUser();
  },[])

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, setLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};