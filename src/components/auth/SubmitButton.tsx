"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

export function SubmitButton({ children, className, disabled }: { children: React.ReactNode, className?: string, disabled?: boolean }) {
    const { pending } = useFormStatus();
    const isDisabled = pending || disabled;

    return (
        <Button type="submit" disabled={isDisabled} className={className}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                </>
            ) : (
                children
            )}
        </Button>
    );
}
