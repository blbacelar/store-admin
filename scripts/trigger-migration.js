async function triggerMigration() {
    try {
        console.log('Triggering migration on http://localhost:3000/api/migrate-products...');
        const response = await fetch('http://localhost:3000/api/migrate-products', {
            method: 'POST'
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Failed to trigger migration:', error);
    }
}

triggerMigration();
