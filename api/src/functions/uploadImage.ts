import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";

export async function uploadImage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Upload image request received');
    try {
        const connectionString = process.env.BlobStorageConnectionString || process.env.AzureWebJobsStorage;
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

        const filename = request.query.get('filename') || `avatar-${Date.now()}.png`;
        context.log(`Uploading file: ${filename}`);
        
        const blockBlobClient = containerClient.getBlockBlobClient(filename);

        // Get body as ArrayBuffer or Stream
        const body = await request.arrayBuffer();
        context.log(`File size: ${body.byteLength} bytes`);
        
        await blockBlobClient.upload(body, body.byteLength);
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
