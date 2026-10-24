"use client";

import { useEffect, useState } from "react";
import { SafeSanitizer } from "@/lib/email/sanitizer";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ShieldCheck, Image as ImageIcon } from "lucide-react";

interface SafeEmailPreviewProps {
    html: string;
}

export function SafeEmailPreview({ html }: SafeEmailPreviewProps) {
    const [allowImages, setAllowImages] = useState(false);
    const [sanitizedHtml, setSanitizedHtml] = useState("");


    useEffect(() => {
        // Sanitize content whenever html or image preference changes
        const safe = SafeSanitizer.sanitize(html, {
            blockImages: !allowImages,
            disableLinks: true
        });
        setSanitizedHtml(safe);
    }, [html, allowImages]);



    return (
        <div className="flex flex-col h-full bg-background border rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs font-bold border border-green-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Safe View
                    </div>
                    {/* Image Blocker Status */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${allowImages ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-muted text-muted-foreground border-transparent'}`}>
                        {allowImages ? (
                            <>
                                <Eye className="w-3.5 h-3.5" />
                                Images Loaded (Tracking Risk)
                            </>
                        ) : (
                            <>
                                <EyeOff className="w-3.5 h-3.5" />
                                Images Blocked (Private)
                            </>
                        )}
                    </div>
                </div>

                <Button
                    variant={allowImages ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => setAllowImages(!allowImages)}
                    className="h-8 gap-2 text-xs"
                >
                    {allowImages ? (
                        <>Hide Images</>
                    ) : (
                        <>
                            <ImageIcon className="w-3.5 h-3.5" /> Show Images
                        </>
                    )}
                </Button>
            </div>

            {/* Warning Banner if JS/Forms removed (Optional, sanitizer handles silently usually) */}

            {/* Sandboxed Iframe */}
            <div className="flex-1 relative bg-white">
                {/* Bg white because emails are usually designed for white paper */}
                <iframe
                    title="Safe Email Preview"
                    sandbox="allow-popups" // NO allow-scripts!
                    className="absolute inset-0 w-full h-full border-0"
                    srcDoc={`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <style>
                                body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; margin: 0; padding: 16px; color: #333; word-wrap: break-word; }
                                img[data-original-src] { cursor: pointer; opacity: 0.5; }
                                /* Scrollbar styling to match app a bit */
                                ::-webkit-scrollbar { width: 8px; height: 8px; }
                                ::-webkit-scrollbar-track { background: #f1f1f1; }
                                ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
                            </style>
                        </head>
                        <body>
                            ${sanitizedHtml}
                        </body>
                        </html>
                    `}
                />
            </div>
        </div>
    );
}
