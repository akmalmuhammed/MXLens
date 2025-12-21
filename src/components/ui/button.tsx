import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/cn"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--glow-sm)] hover:shadow-[var(--glow-md)]",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                outline: "border border-primary text-primary hover:bg-primary/10",
                ghost: "text-primary hover:bg-primary/10",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                link: "text-primary underline-offset-4 hover:underline",
                // Backward compatibility mapping
                default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--glow-sm)]",
            },
            size: {
                xs: "px-4 py-2 text-xs h-6",
                sm: "px-6 py-3 text-sm h-8",
                md: "px-8 py-4 text-base h-10",
                lg: "px-12 py-6 text-lg h-12",
                xl: "px-16 py-8 text-xl h-14",
                icon: "h-10 w-10",
                // Backward compatibility
                default: "px-8 py-4 text-base h-10",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
