# Personal Management Dashboard

A comprehensive personal management system built with Node.js, Express, MySQL, and vanilla JavaScript. This application helps students manage their academic and personal life including modules, exams, marks, appointments, finances, and more.

## Features

- **User Authentication**: Secure login system with session management
- **Dashboard Overview**: Real-time statistics and recent activities
- **Module Management**: Register and track university modules
- **Exam Timetable**: Schedule and manage exam dates and venues
- **CA Marks Recording**: Track continuous assessment marks
- **Money Circle**: Manage money lending and weekly savings
- **Appointment Management**: Schedule appointments with notifications
- **Journey Tracker**: Plan and track travel with cost analysis
- **Skills Analysis**: Visual representation of skill levels

## Project Structure

```
Personal/
├── personal_management_backend/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── dashboardController.js
│   │   ├── timetableController.js
│   │   ├── modulesController.js
│   │   ├── marksController.js
│   │   ├── moneyController.js
│   │   ├── appointmentsController.js
│   │   ├── journeysController.js
│   │   └── activitiesController.js
│   ├── database/
│   │   └── schema.sql           # Database schema
│   ├── routes/
│   │   └── api.js              # API routes
│   ├── .env                    # Environment variables
│   ├── package.json
│   └── server.js               # Main server file
├── personal_management_frontend/
│   ├── css/
│   │   └── style.css           # Stylesheets
│   ├── js/
│   │   └── app.js              # Frontend JavaScript
│   └── index.html              # Main HTML file
└── README.md
```

## Prerequisites

1. **XAMPP** - For Apache and MySQL servers
2. **Node.js** (v14 or higher)
3. **npm** (comes with Node.js)

## Installation & Setup

### 1. Database Setup (XAMPP)

1. Start XAMPP and launch Apache and MySQL services
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create a new database named `personal_management`
4. Import the database schema:
   - Navigate to `personal_management_backend/database/schema.sql`
   - Copy the SQL content and execute it in phpMyAdmin

### 2. Backend Setup

1. Open terminal/command prompt
2. Navigate to the backend directory:
   ```bash
   cd personal_management_backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Verify `.env` file contains correct database settings:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=personal_management
   PORT=3000
   ```

### 3. Start the Application

1. From the backend directory, run:
   ```bash
   npm start
   ```
2. The server will start on port 3000
3. Open your browser and navigate to: `http://localhost:3000`

## Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

Alternative user:
- **Username**: `user`
- **Password**: `user123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/status` - Check authentication status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Modules
- `GET /api/modules` - Get all modules
- `POST /api/modules` - Add new module
- `DELETE /api/modules/:id` - Delete module

### Timetable
- `GET /api/timetable` - Get all exams
- `POST /api/timetable` - Add new exam
- `DELETE /api/timetable/:id` - Delete exam

### Marks
- `GET /api/marks` - Get all marks
- `POST /api/marks` - Add new marks
- `DELETE /api/marks/:id` - Delete marks

### Money Management
- `GET /api/money` - Get money records
- `POST /api/money` - Add money record
- `PUT /api/money/:id/return` - Mark as returned
- `DELETE /api/money/:id` - Delete money record
- `GET /api/savings` - Get savings
- `POST /api/savings` - Add savings
- `DELETE /api/savings/:id` - Delete savings

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Add new appointment
- `PUT /api/appointments/:id/complete` - Mark as completed
- `DELETE /api/appointments/:id` - Delete appointment

### Journeys
- `GET /api/journeys` - Get all journeys
- `POST /api/journeys` - Add new journey
- `PUT /api/journeys/:id/complete` - Mark as completed
- `DELETE /api/journeys/:id` - Delete journey

### Activities
- `GET /api/activities` - Get recent activities

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL (via XAMPP)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Session Management**: express-session
- **Database Driver**: mysql2

## Security Notes

- In production, change the session secret in `server.js`
- Use HTTPS in production (set `secure: true` in session config)
- Implement proper password hashing (bcrypt)
- Add input validation and sanitization
- Implement rate limiting for API endpoints

## Troubleshooting

### Database Connection Issues
1. Ensure XAMPP MySQL service is running
2. Check database credentials in `.env` file
3. Verify database name matches `personal_management`

### Port Already in Use
1. Change the PORT in `.env` file
2. Or kill the process using port 3000:
   ```bash
   # On Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # On Mac/Linux
   lsof -ti:3000 | xargs kill -9
   ```

### CORS Issues
The server includes CORS middleware. If you encounter CORS issues, ensure the frontend is making requests to the correct port.

## Development

To add new features:

1. Create controller in `controllers/` directory
2. Add routes in `routes/api.js`
3. Update frontend JavaScript in `js/app.js`
4. Update database schema if needed

## License

This project is for educational purposes. Feel free to modify and use it for your personal needs.
