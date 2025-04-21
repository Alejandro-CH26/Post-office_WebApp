  #  Post Office Web Application

  This is a full-stack Post Office Management System that allows **customers** to track packages and order inventory, **employees** to manage deliveries and inventory, and **administrators** to oversee operations across multiple post office locations.

  **Hosted Web App:** [https://post-office-web-app.vercel.app](https://post-office-web-app.vercel.app)

  ---

  ##  Features

  - Customer registration/login, order inventory, and view tracking history
  - Package creation by employees with route assignment and delivery
  - Driver dashboard for delivery status updates and shift tracking
  - Admin dashboard with full control over:
    - Employees
    - Post office locations
    - Delivery vehicles
    - Reports (sales, inventory, packages, employee hours)
  - Semantic database triggers for notifications and vehicle limits

  ---

  ##  Technologies Used

  - **Frontend**: React
  - **Backend**: Node.js
  - **Database**: MySQL
  - **Deployment**: Vercel (frontend), Render (backend)

  ---

  ##  Folder Structure

```
post-office-app/ 
├── client/ # React frontend │ 
  └── ... # build
  └── ... # public
  └── ... # src
    └── ... # components (Navbar.js/css and HeroSection.js/css)
    └── ... # images
    └── ... # pages (all frontend JavaScript pages/CSS Styling)
    └── ... # various App.js/css files
  └── ... # .env/.gitignore files
├── server/ # Node.js backend │ 
  └── ... # various routes and db/server.js file for backend
  └── ... # DigiCertGlobalRootCA.crt.pem
  └── ... # .env file
├── README.md # Project instructions and setup
```


---

## Environment Variables

Create a `.env` file in the `client/` directory with the following:

```.env
REACT_APP_API_BASE_URL="put your localhost link (example: http://localhost:5001)"
```

Create a `.env.production` file in the `client/` directory with the following:
```.env
REACT_APP_API_BASE_URL="put your backend deployment link (example: render)"
```

Create a `.env` file in the `server/` directory with the following:

```.env
DB_HOST="hostname"
DB_USER="username"
DB_PASSWORD="password"
DB_NAME="name of db"
SSL_CA="file path of ssl certificate"
JWT_SECRET="jwt_secret"
```

## Installation & Setup
1. Clone the Repo
```bash
git clone https://github.com/Alejandro-CH26/Post-office_WebApp.git
cd post-office-app
```
3. Install Dependencies

Client
```bash
cd client
npm install
```

Server
```bash
cd server
npm install
```

This will install dependencies including:

mysql2

cors

dotenv

nodemailer

etc...

3. Start the App

Backend
```bash
cd server
node server.js
```

Frontend
```bash
cd client
npm start
```






