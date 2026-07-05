import { CheckCircle, XCircle, MinusCircle, HelpCircle } from "lucide-react"

interface AuthStatus {
    status: string;
    details: string;
    explanation?: string;
}

interface AuthAlignmentProps {
    spf: AuthStatus;
    dkim: AuthStatus;
    dmarc: AuthStatus;
}

function StatusIcon({ status }: { status: string }) {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'pass') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (normalizedStatus === 'fail' || normalizedStatus === 'softfail') return <XCircle className="w-5 h-5 text-red-500" />;
    if (normalizedStatus === 'none') return <MinusCircle className="w-5 h-5 text-muted-foreground" />;
    return <HelpCircle className="w-5 h-5 text-amber-500" />;
}

function StatusCard({ title, data }: { title: string, data: AuthStatus }) {
    return (
        <div className="bg-card flex flex-col rounded-md border p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-semibold">{title}</span>
                <StatusIcon status={data.status} />
            </div>
            <div className="mb-1 text-lg font-bold uppercase tracking-tight">{data.status}</div>
            <div className="text-muted-foreground mt-1 break-all font-mono text-xs" title={data.details}>
                {data.details}
            </div>
            {data.explanation && (
                <div className="text-foreground/80 border-primary/20 mt-1.5 border-l-2 pl-2 text-xs italic">
                    {data.explanation}
                </div>
            )}
        </div>
    );
}

export function AuthAlignment({ spf, dkim, dmarc }: AuthAlignmentProps) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatusCard title="SPF (Sender Policy Framework)" data={spf} />
            <StatusCard title="DKIM (DomainKeys Identified Mail)" data={dkim} />
            <StatusCard title="DMARC (Domain-based Message Auth)" data={dmarc} />
        </div>
    );
}
