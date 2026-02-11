import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { logger } from "@/app/lib/logger";

export const dynamic = "force-dynamic";

logger.debug("NextAuth API Route hit");
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
