import { notFound } from "next/navigation";

export default function AnalysisResultPage(): never {
    // Never synthesize a verdict from a caller-controlled URL identifier.
    notFound();
}
