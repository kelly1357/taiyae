# Horizon

Horizon is an online, forum-based writing community focused around characters based on real-world wolves who can interact with one another through turn-based posting.

## History

The project originated as **Taiyae** in the early 2000s on AvidGamers before eventually becoming an independent site existing in a valley called Horizon.

## Technologies Used

### 🔥 Frontend
- **React 19**: UI Library
- **Vite**: Build tool and development server
- **TypeScript**: Static typing
- **Tailwind CSS**: Utility-first CSS framework
- **Tiptap**: Headless rich text editor for thread posts
- **Google Auth**: OAuth v2 implementation for user registration and login

### 🏭 Backend
- **Azure Functions**: Serverless compute (Node.js v4)
- **Azure SQL Database**: Relational database (MSSQL)
- **Azure Blob Storage**: Containerized file hosting for images and videos
- **SignalR**: Real-time messaging using a server-first approach

### Infrastructure
- **Azure Static Web Apps**: Hosting and CI/CD

## Local development

### local-settings file
- Add a `local-settings.json` file which contains API keys for local development to `/api`.
- Make sure local-settings values match the Azure App Settings (https://portal.azure.com/#@sweettexanbabeyyahoo.onmicrosoft.com/resource/subscriptions/2b584cf2-c394-4453-83b6-b64223f06aa4/resourceGroups/taiyae/providers/Microsoft.Web/staticSites/taiyae/environmentVariables) 

### Common terminal commands
- Create new terminal with ``ctrl + shift + ` ``
- Start the api: `cd api && func start`
- Create another new terminal and `cd client && npm run dev` to start the application
- Go to localhost to view the app in testing/development
- Or, type `npm start` which combines those commands
- (In case of api-related errors, rebuild the api with: New terminal, `cd api && npm run build`)

### Locations
- Localhost on http://localhost:5173/
- Hosted Static Web Application: https://blue-desert-0f2890b1e.6.azurestaticapps.net/

### Recommended toolset
- VS Code for IDE
- VS Code extensions: mssql, Azure Functions, GitHub Actions, GitHub Copilot Chat, npm intellisense

## To Do

### Frontend updates

✅  Update CSS styling in /client/src/index.css

✅  Define + author feature set

✅  Place to edit character fields

✅  Editable character fields

✅ Display online characters on sidebar

✅  Avatar upload option for Player Accounts

✅ Place to edit user fields

✅ Editable user fields to include: Biography (HTML), Social Media Links (HTML?)

### Backend updates

✅ User Status: Active, Joining, Banned

[ ] Create subareas within regions

✅ Moderator actions (approving new users)

✅ Admin actions: account banning

[ ] Hierarchy management

[ ] Pack management/function / creating packs

[ ] Discord integration

✅ Skill Points

✅ Add header image upload to Region Directory Page

✅ Character Status: Active, Inactive, Dead (cannot post)

✅  Weather update system (manual or somehow automated based on season?)

✅ Automated calendar system that ages wolves by a month and changes the season every 28 days

✅  User registration / approval flow, OAuth implementation

✅  Character creation and editing

✅  Region creation and editing

✅  Thread and posts core interaction

✅  Character list sorting, grouping, and search to characters list

✅  Achievements management

✅ "Online Now" status indicator

✅  Notifications

✅  User DMing

✅  Implement SignalR for real-time messaging

## Authors

🤓 Marshall - **Backend and infrastructure engineering**

🙋🏼‍♀️ Kelly - **Frontend design and feature definition** 

🐺 Chelsie - **Developer TBD**

🦾 Claude Opus 4.5 - **Code architect and implementation**