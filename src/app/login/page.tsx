"use client";

import { Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { USAFlag } from "@/app/components/Flags"; // Using existing USA flag as Google placeholder or just a simple icon

function LoginForm() {
    const { t } = useTranslation();
    const session = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const errorParam = searchParams.get("error");
        if (errorParam === "AccessDenied") {
            setError("Access Denied: You do not have permission to sign in.");
        }
    }, [searchParams]);

    useEffect(() => {
        console.log('Session status:', session?.status);
        console.log('Session data:', session?.data);

        if (session?.status === "authenticated") {
            console.log('User authenticated, redirecting to dashboard...');
            router.push("/");
            router.refresh();
        }
    }, [session?.status, session?.data, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const callback = await signIn("credentials", {
                email,
                password,
                redirect: false
            });

            if (callback?.error) {
                setError("Invalid email or password");
            } else if (callback?.ok) {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        setIsLoading(true);
        signIn("google", {
            callbackUrl: "/"
        });
    };

    return (
        <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-3xl font-bold tracking-tight text-primary">
                    {mounted ? t('login_title') : 'My Dashboard'}
                </CardTitle>
                <CardDescription>
                    {mounted ? t('login_sub') : 'Sign in to your account to continue'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    variant="outline"
                    className="w-full h-11 border-primary/20 hover:bg-primary/5 transition-all duration-300"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <div className="mr-2 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px]">G</div>}
                    {mounted ? t('continue_google') : 'Continue with Google'}
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                            {mounted ? t('or_continue_with') : 'Or continue with'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="email"
                            placeholder={mounted ? t('email_placeholder') : 'Email'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="h-11 bg-background/50"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder={mounted ? t('password_placeholder') : 'Password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="h-11 bg-background/50"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                    <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (mounted ? t('sign_in') : 'Sign In')}
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-muted-foreground">
                        {mounted ? t('no_account') : "Don't have an account?"}{" "}
                        <button
                            onClick={() => router.push("/register")}
                            className="text-primary hover:underline font-medium"
                        >
                            {mounted ? t('register_here') : 'Register here'}
                        </button>
                    </p>
                </div>
            </CardContent>
            <div className="mt-6 text-center text-xs text-muted-foreground space-y-2">
                <p>Private Project - Authorized Access Only</p>
                <div className="flex justify-center space-x-4">
                    <a href="/privacy" className="hover:underline hover:text-primary">Privacy Policy</a>
                    <span>•</span>
                    <a href="/terms" className="hover:underline hover:text-primary">Terms of Service</a>
                </div>
            </div>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
            <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
