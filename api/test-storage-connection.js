const { BlobServiceClient } = require("@azure/storage-blob");

const connectionString = process.env.AzureWebJobsStorage || "UseDevelopmentStorage=true";

async function testConnection() {
    console.log("Testing Azure Blob Storage connection...");
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        
        // Try to list containers to verify connection and permissions
        console.log("Attempting to list containers...");
        let i = 1;
        for await (const container of blobServiceClient.listContainers()) {
            console.log(`Container ${i++}: ${container.name}`);
        }
        
        console.log("Successfully connected to Azure Blob Storage!");
        
        // Also check if 'avatars' container exists, as used in the app
        const containerName = "avatars";
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const exists = await containerClient.exists();
        console.log(`Container '${containerName}' exists: ${exists}`);

    } catch (error) {
        console.error("Connection failed:", error.message);
    }
}

testConnection();
