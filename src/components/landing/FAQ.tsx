import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
    return (
        <section className="py-24 bg-background">
            <div className="container max-w-3xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Is my email data stored on your servers?</AccordionTrigger>
                        <AccordionContent>
                            No. MXLens uses a strict <strong>Zero Data Retention</strong> policy.
                            All email parsing and analysis happens locally in your browser using WebAssembly.
                            No email content is ever sent to our cloud.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Is it free to use?</AccordionTrigger>
                        <AccordionContent>
                            Yes! You can analyze up to 3 emails per day for free as a guest.
                            Pro plans are available for high-volume SOC teams needing API access and history logs.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>What types of files can I upload?</AccordionTrigger>
                        <AccordionContent>
                            We support standard `.eml` and `.msg` email files. You can also paste raw email headers directly for analysis.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>Why is client-side analysis better?</AccordionTrigger>
                        <AccordionContent>
                            Speed and Privacy. Since we don't need to upload files to a server, analysis is instant.
                            And because data stays on your device, you avoid GDPR/HIPAA compliance risks associated with uploading confidential data.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>
    );
}
