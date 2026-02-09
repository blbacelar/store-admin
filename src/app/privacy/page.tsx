import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="mb-4">Last updated: {newDxxe().toLocaleDateString()}</p>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
                <p>Welcome to My Dashboard. We respect your privacy and are committed to protecting your personal data.</p>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">2. Data We Collect</h2>
                <p>We may collect personal identification information (Name, email address) when you use our service.</p>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">3. How We Use Your Data</h2>
                <p>We use your data to provide and improve the Service. We do not sell your data to third parties.</p>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">4. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us.</p>
            </section>
        </div>
    );
}

function newDxxe() {
    return new Date();
}
