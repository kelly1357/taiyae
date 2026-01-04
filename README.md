# Azure Static Web Apps API

This folder should contain your Azure Functions.

To initialize an Azure Functions project here:

1.  Install the Azure Functions Core Tools.
2.  Run `func init --typescript` in this directory.
3.  Create functions for each endpoint (e.g., `func new --name GetRegions --template "HTTP trigger"`).
4.  Connect to your Azure SQL Database using a library like `mssql` or `typeorm`.

## Recommended Endpoints

-   `GET /api/regions` - List all regions
-   `GET /api/regions/{id}` - Get region details and subareas
-   `GET /api/threads?regionId={id}` - Get threads for a region
-   `GET /api/threads/{id}` - Get thread details and replies
-   `POST /api/threads` - Create a new thread
-   `POST /api/replies` - Post a reply
-   `GET /api/users/me` - Get current user info
