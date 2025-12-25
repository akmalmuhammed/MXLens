export default function DocumentsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Documents & Privacy</h1>
            <p className="text-muted-foreground">Manage your generated reports and privacy settings.</p>
            <div className="mt-8 p-8 border rounded-lg bg-card text-center text-muted-foreground border-dashed">
                No documents found. Generated reports will appear here.
            </div>
        </div>
    );
}
