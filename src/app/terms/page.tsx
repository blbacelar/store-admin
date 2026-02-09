import React from 'react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <p className="mb-4">Last updated: {newDxxe().toLocaleDateString()}</p>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
                <p>By accessing or using My Dashboard, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">2. Accounts</h2>
                <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.</p>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">3. Intellectual Property</h2>
                <p>The Service and its original content, features, and functionality are and will remain the exclusive property of My Dashboard and its licensors.</p>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">4. Termination</h2>
                <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever.</p>
            </section>
        </div>
    );
}

function newDxxe() {
    return new Date();
}
