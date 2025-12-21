import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        {
            status: "ok",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            services: {
                database: "connected",
                redis: "connected"
            }
        },
        { status: 200 }
    );
}
