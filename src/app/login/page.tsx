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

import { Label } from "@/components/ui/label";

function LoginForm() {
    const { t } = useTranslation();
    const session = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);

    useEffect(() => {
        setMounted(true);
        const errorParam = searchParams.get("error");
        if (errorParam === "AccessDenied") {
            setError("Invalid email or password");
        }
    }, [searchParams]);

    useEffect(() => {
        if (session.status === "authenticated") {
            router.replace("/");
            router.refresh();
        }
    }, [session.status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || isSigningIn) {
            return;
        }

        setIsLoading(true);
        setIsSigningIn(false);
        setError("");

        try {
            const callback = await signIn("credentials", {
                email,
                password,
                rememberMe: rememberMe.toString(),
                redirect: false
            });

            if (callback?.error) {
                setError("Invalid email or password");
            } else if (callback?.ok) {
                setIsSigningIn(true);
            } else {
                setError("Something went wrong");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            if (!isSigningIn) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        if (session.status === "unauthenticated" && isSigningIn) {
            setIsSigningIn(false);
            setIsLoading(false);
            setError("Something went wrong");
        }

        if (session.status === "authenticated" && isSigningIn) {
            setIsLoading(false);
            setIsSigningIn(false);
        }
    }, [isSigningIn, session.status]);

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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{mounted ? t('email_label') : 'Email'}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder={mounted ? t('email_placeholder') : 'Email'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="h-11 bg-background/50"
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{mounted ? t('password_label') : 'Password'}</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder={mounted ? t('password_placeholder') : 'Password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="h-11 bg-background/50"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            id="rememberMe"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={isLoading}
                            className="h-4 w-4 rounded border-primary/30 accent-primary cursor-pointer"
                        />
                        <Label htmlFor="rememberMe" className="cursor-pointer font-normal">
                            Remember me
                        </Label>
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
            <div className="mt-6 text-center text-xs text-muted-foreground space-y-2 pb-6">
                <p>Private Project - Authorized Access Only</p>
                <div className="flex justify-center space-x-4">
                    <a href="/privacy" className="hover:underline hover:text-primary transition-colors">Privacy Policy</a>
                    <span>•</span>
                    <a href="/terms" className="hover:underline hover:text-primary transition-colors">Terms of Service</a>
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
