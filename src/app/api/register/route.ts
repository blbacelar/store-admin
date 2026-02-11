import bcrypt from "bcryptjs";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { isEmailAllowed } from "@/app/lib/security";

function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, password } = body;

        if (!email || !name || !password) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return new NextResponse("Invalid email format", { status: 400 });
        }

        // Validate password strength
        if (password.length < 8) {
            return new NextResponse("Password must be at least 8 characters", { status: 400 });
        }

        // Check if email is allowed
        if (!isEmailAllowed(email)) {
            return new NextResponse("Access denied. Please contact support to request access.", { status: 403 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return new NextResponse("User already exists", { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                hashedPassword,
            },
        });

        // Don't return sensitive data
        const { hashedPassword: _, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword);
    } catch (error: any) {
        console.error("REGISTRATION_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
