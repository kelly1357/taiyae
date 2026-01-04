// const fetch = require('node-fetch'); // Use built-in fetch
const fs = require('fs');
const path = require('path');

async function testUpload() {
    try {
        // Create a dummy image file
        const dummyPath = path.join(__dirname, 'test-image.txt');
        fs.writeFileSync(dummyPath, 'This is a test image content');

        const fileContent = fs.readFileSync(dummyPath);
        
        console.log('Uploading test file...');
        const response = await fetch('http://localhost:7071/api/upload?filename=test-image.txt', {
            method: 'POST',
            body: fileContent
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Upload successful:', data);
        } else {
            const text = await response.text();
            console.error('Upload failed:', response.status, text);
        }

        // Cleanup
        fs.unlinkSync(dummyPath);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testUpload();
