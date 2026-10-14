export default function AcceptableUsePage() {
    return (
        <div className="min-h-screen bg-background py-20">
            <div className="container mx-auto px-4 max-w-3xl prose prose-invert">
                <h1 className="text-4xl font-extrabold text-white mb-8">Acceptable Use Policy</h1>
                <p className="text-slate-400 mb-8">
                    MXLens is a tool for defense. Misuse of our platform for offensive purposes is strictly prohibited.
                </p>

                <h2>Prohibited Activities</h2>
                <ul className="list-disc pl-6 text-slate-300 space-y-2">
                    <li>Uploading malware samples without authorization (except for analysis purposes in isolated environments)</li>
                    <li>Using the API to facilitate spam campaigns or harvest active email addresses</li>
                    <li>attempting to reverse engineer the analysis engine</li>
                    <li>Reselling MXLens data without a partner agreement</li>
                </ul>

                <h2>Enforcement</h2>
                <p>We monitor API usage patterns for signs of abuse. Accounts found violating this policy will be terminated immediately without refund.</p>
            </div>
        </div>
    );
}
