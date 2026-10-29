import type { ReactNode } from "react";
import "../src/style.css";
export const metadata = { title: "EstudaMente Studio 6.9", description: "Seu estudo, sua comunidade." };
export default function Layout({children}:{children:ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
