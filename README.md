# Horizon

Horizon is an online, forum-based writing community focused around characters based on real-world wolves who can interact with one another through turn-based posting.

## History

The project originated as **Taiyae** in the early 2000s on AvidGamers before eventually becoming an independent site existing in a valley called Horizon.

## Technologies Used

### Frontend
- **React 19**: UI Library
- **Vite**: Build tool and development server
- **TypeScript**: Static typing
- **Tailwind CSS**: Utility-first CSS framework
- **Tiptap**: Headless rich text editor for thread posts

### Backend
- **Azure Functions**: Serverless compute (Node.js v4)
- **Azure SQL Database**: Relational database (MSSQL)

### Infrastructure
- **Azure Static Web Apps**: Hosting and CI/CD

## Testing
- Create new terminal with `ctrl + shift + `  `` `` 
- type `npm start` and hit enter
- Static Web Application: https://blue-desert-0f2890b1e.6.azurestaticapps.net/

## To Do

### kelly1357

- Update CSS styling in /client/src/index.css
- Define + author feature set

### MBenson415

High Priority:

- User registration / approval flow, OAuth implementation
- Character creation and editing
- Region creation and editing
- Thread and posts core interaction
- Character list with sorting, grouping, and search

Low Priority:

- Moderator actions (approving new users, updating user data)
- Achievements management
- Hierarchy management
- Discord integration
- "Online Now" status indicator
- Notifications
- User DMing`