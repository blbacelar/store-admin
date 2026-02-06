import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

console.log("NextAuth API Route hit");
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
