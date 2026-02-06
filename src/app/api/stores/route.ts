import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name) {
            return new NextResponse("Missing store name", { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const store = await prisma.store.create({
            data: {
                name,
                userId: user.id
            }
        });

        return NextResponse.json(store);
    } catch (error) {
        console.error("STORE_POST_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const stores = await prisma.store.findMany({
            where: {
                user: {
                    email: session.user.email
                }
            }
        });

        return NextResponse.json(stores);
    } catch (error) {
        console.error("STORES_GET_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
