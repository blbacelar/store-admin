import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        buildTimestamp: process.env.BUILD_TIMESTAMP,
        gitSha: process.env.GIT_SHA,
        nodeEnv: process.env.NODE_ENV,
        deploymentType: process.env.DEPLOYMENT_TYPE
    });
}
