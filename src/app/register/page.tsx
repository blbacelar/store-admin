"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";

export default function RegisterPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };
    const showPasswordHints = password.length > 0;

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
        } catch {
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
                            {showPasswordHints && (
                                <ul className="text-xs space-y-1 mt-1">
                                    <li className={passwordChecks.length ? "text-green-500" : "text-muted-foreground"}>
                                        {passwordChecks.length ? "✓" : "○"} At least 8 characters
                                    </li>
                                    <li className={passwordChecks.uppercase ? "text-green-500" : "text-muted-foreground"}>
                                        {passwordChecks.uppercase ? "✓" : "○"} One uppercase letter
                                    </li>
                                    <li className={passwordChecks.number ? "text-green-500" : "text-muted-foreground"}>
                                        {passwordChecks.number ? "✓" : "○"} One number
                                    </li>
                                    <li className={passwordChecks.special ? "text-green-500" : "text-muted-foreground"}>
                                        {passwordChecks.special ? "✓" : "○"} One special character
                                    </li>
                                </ul>
                            )}
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
