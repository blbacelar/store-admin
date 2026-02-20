"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function RegisterPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    const handleGoogleSignUp = () => {
        setIsLoading(true);
        signIn("google");
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name, password }),
            });

            if (res.ok) {
                router.push("/login");
            } else {
                const data = await res.text();
                setError(data || "Registration failed");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
            <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight text-primary">
                        {mounted ? t('join_us') : 'Join Us'}
                    </CardTitle>
                    <CardDescription>
                        {mounted ? t('create_admin_account') : 'Create your admin account to manage products'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        variant="outline"
                        className="w-full h-11 border-primary/20 hover:bg-primary/5 transition-all duration-300"
                        onClick={handleGoogleSignUp}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <div className="mr-2 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px]">G</div>}
                        {mounted ? t('continue_google') : 'Continue with Google'}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center px-4">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card/50 px-2 text-muted-foreground backdrop-blur-sm">{mounted ? t('or_continue_with') : 'Or continue with'}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{mounted ? t('full_name') : 'Full Name'}</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder={mounted ? t('full_name') : 'Full Name'}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                className="h-11 bg-background/50"
                                required
                            />
                        </div>
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{mounted ? t('password_label') : 'Password'}</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={mounted ? t('create_password') : 'Create Password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="h-11 bg-background/50"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                        <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (mounted ? t('create_account') : 'Create Account')}
                        </Button>
                    </form>

                    <div className="text-center text-sm">
                        <p className="text-muted-foreground">
                            {mounted ? t('already_have_account') : 'Already have an account?'}{" "}
                            <button
                                onClick={() => router.push("/login")}
                                className="text-primary hover:underline font-medium"
                            >
                                {mounted ? t('back_to_login') : 'Back to Login'}
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
        </div>
    );
}
