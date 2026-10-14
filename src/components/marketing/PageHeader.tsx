import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  badge?: string;
  action?: {
    label: string;
    href: string;
  };
}

export function PageHeader({ title, description, badge, action }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden py-24 border-b border-border/50 bg-black">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-700/20 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 text-center z-10">
        {badge && (
          <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 mb-6 backdrop-blur-sm">
            {badge}
          </div>
        )}
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          {title}
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          {description}
        </p>

        {action && (
          <div className="flex justify-center">
            <Link href={action.href}>
              <Button size="lg" className="rounded-full px-8 text-base shadow-lg shadow-cyan-500/20">
                {action.label} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
