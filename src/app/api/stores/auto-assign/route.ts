import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID || "6984f69469a68016b608074b";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!DEFAULT_STORE_ID) {
            console.error('DEFAULT_STORE_ID environment variable not set');
            return new NextResponse("Configuration error", { status: 500 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if default store exists
        const defaultStore = await prisma.store.findUnique({
            where: { id: DEFAULT_STORE_ID }
        });

        if (!defaultStore) {
            return new NextResponse("Default store not found", { status: 404 });
        }

        // Check if user already has access to this store
        const existingStore = await prisma.store.findFirst({
            where: {
                id: DEFAULT_STORE_ID,
                userId: user.id
            }
        });

        if (existingStore) {
            return NextResponse.json({ message: "User already has access", store: existingStore });
        }

        // Update the store to assign it to this user
        // Note: This assumes one user per store. If multiple users need access,
        // you'll need a many-to-many relationship table
        const updatedStore = await prisma.store.update({
            where: { id: DEFAULT_STORE_ID },
            data: { userId: user.id }
        });

        return NextResponse.json({ message: "User assigned to store", store: updatedStore });
    } catch (error) {
        console.error("AUTO_ASSIGN_STORE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
