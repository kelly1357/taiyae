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
- In case of errors, rebuild the api with: New terminal, `cd api && npm run build`

## To Do

### kelly1357

- Update CSS styling in /client/src/index.css
- Define + author feature set

### From kelly1357 to MBenson415

[] Editable character fields to include: Avatar update, 5 photo uploads, dropdown Height (Petite, Small, Average, Large, Very Large), dropdown Build (Lean, Average, Stocky, Muscular), birthplace (HTML), Father (HTML), Mother (HTML), Siblings (HTML), Pups (HTML), Spirit Symbol (can only be chosen at character creation)

[] Place to edit profile fields

[] Editable user fields to include: Biography (HTML), Social Media Links (HTML?)

[] Place to edit user fields

[] Skill Points

[] Weather update system (manual or somehow automated based on season?)

[] Create subareas within regions

### MBenson415

High Priority:

[x] User registration / approval flow, OAuth implementation

[x] Character creation and editing

[X] Region creation and editing

[X] Thread and posts core interaction

[X] Character list with 

[X] Add sorting, grouping, and search to characters list

Low Priority:

[] Moderator actions (approving new users, updating user data, delete threads and posts, move threads)

[] Achievements management

[] Hierarchy management

[] Discord integration

[] "Online Now" status indicator

[] Notifications

[] User DMing