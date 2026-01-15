import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";

export async function uploadImage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Upload image request received');
    try {
        const connectionString = process.env.BlobStorageConnectionString || process.env.BlobStorageKey;
        if (!connectionString) {
            context.error('Storage connection string not configured');
            return { status: 500, body: "Storage connection string not configured" };
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerName = "web";
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        context.log(`Ensuring container '${containerName}' exists...`);
        await containerClient.createIfNotExists({
            access: 'blob' // Allow public read access for web container
        });

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file || typeof file === 'string') {
            return { status: 400, body: "No file uploaded" };
        }
        
        const fileBlob = file as unknown as { name?: string; type?: string; arrayBuffer(): Promise<ArrayBuffer> };
        const originalName = fileBlob.name || 'image.png';
        const extension = originalName.split('.').pop()?.toLowerCase() || 'png';
        const filename = `avatar-${Date.now()}.${extension}`;
        context.log(`Uploading file: ${filename} (original: ${originalName})`);
        
        const blockBlobClient = containerClient.getBlockBlobClient(filename);

        // Get file as ArrayBuffer
        const arrayBuffer = await fileBlob.arrayBuffer();
        context.log(`File size: ${arrayBuffer.byteLength} bytes`);
        
        // Determine content type
        let contentType = fileBlob.type || 'image/png';
        if (!contentType.startsWith('image/')) {
            contentType = 'image/png';
        }
        
        await blockBlobClient.upload(arrayBuffer, arrayBuffer.byteLength, {
            blobHTTPHeaders: { blobContentType: contentType }
        });
        context.log(`Upload successful: ${blockBlobClient.url}`);

        return {
            jsonBody: {
                url: blockBlobClient.url
            }
        };
    } catch (error) {
        context.error('Upload failed', error);
        return { status: 500, body: "Upload failed: " + error.message };
    }
}

app.http('uploadImage', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'upload',
    handler: uploadImage
});
