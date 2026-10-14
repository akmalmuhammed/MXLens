export default function SecurityPolicyPage() {
    return (
        <div className="min-h-screen bg-background py-20">
            <div className="container mx-auto px-4 max-w-3xl prose prose-invert">
                <h1 className="text-4xl font-extrabold text-white mb-8">Security Policy</h1>
                <p className="text-slate-400 mb-8">
                    At MXLens, security is our core product. We maintain rigorous standards to protect your data and ours.
                </p>

                <h2>Data Transmission</h2>
                <p>All data transmitted between your browser and our servers is encrypted using TLS 1.2 or higher. We employ HSTS to ensure browsers only connect via HTTPS.</p>

                <h2>Data Storage (Zero Retention)</h2>
                <p>For unauthenticated users, analysis results are processed in-memory and discarded after the session ends. We do not persist uploaded emails or headers for free tier analyses unless explicitly opted-in for research.</p>

                <h2>Infrastructure Security</h2>
                <ul className="list-disc pl-6 text-slate-300 space-y-2">
                    <li>Hosted on AWS with VPC isolation</li>
                    <li>Regular penetration testing by third-party firms</li>
                    <li>Automated dependency scanning (SCA)</li>
                    <li>Role-based access control (RBAC) for all internal systems</li>
                </ul>

                <h2>Vulnerability Disclosure</h2>
                <p>If you discover a security vulnerability, please report it to <span className="text-cyan-400">security@mxlens.com</span>. We offer a bug bounty program for qualified reports.</p>
            </div>
        </div>
    );
}
