"use client";

import { usePathname } from "next/navigation";

export function NavbarUtils({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Hide global navbar on landing page (root path)
    if (pathname === "/") {
        return null;
    }

    return <>{children}</>;
}
