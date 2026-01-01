export default function AdminAuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <style jsx global>{`
                /* Hide main app navigation on admin auth routes */
                nav.sticky.z-50:not(.admin-nav) {
                    display: none !important;
                }
            `}</style>
            {children}
        </>
    );
}
