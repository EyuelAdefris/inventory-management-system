import { ReactNode } from "react";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
