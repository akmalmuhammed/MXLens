export default function GdprPage() {
    return (
        <div className="min-h-screen bg-background py-20">
            <div className="container mx-auto px-4 max-w-3xl prose prose-invert">
                <h1 className="text-4xl font-extrabold text-white mb-8">GDPR Compliance</h1>
                <p className="text-slate-400 mb-8">
                    MXLens is committed to compliance with the General Data Protection Regulation (GDPR).
                </p>

                <h2>Your Rights</h2>
                <p>As a user located in the EEA, you have the following rights:</p>
                <ul className="list-disc pl-6 text-slate-300 space-y-2">
                    <li><strong>Right to Access:</strong> You can request a copy of your personal data.</li>
                    <li><strong>Right to Erasure ('Right to be Forgotten'):</strong> You can request deletion of your account and data.</li>
                    <li><strong>Right to Rectification:</strong> You can correct inaccurate personal data.</li>
                </ul>

                <h2>Data Processing</h2>
                <p>We act as a Data Processor for the emails you analyze. We act as a Data Controller for your account information (email, password, billing details).</p>

                <h2>Subprocessors</h2>
                <p>We use the following third-party services:</p>
                <ul className="list-disc pl-6 text-slate-300 space-y-2">
                    <li>AWS (Hosting, US-East)</li>
                    <li>Stripe (Payments)</li>
                </ul>

                <h2>Contact DPO</h2>
                <p>For privacy-related inquiries, contact our Data Protection Officer at <span className="text-cyan-400">privacy@mxlens.com</span>.</p>
            </div>
        </div>
    );
}
