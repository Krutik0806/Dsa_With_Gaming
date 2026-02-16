# 🎮 DSA with Gaming

A gamified learning platform for Data Structures & Algorithms built with the MERN stack.

## 📋 Project Overview

DSA with Gaming is an interactive web-based platform that teaches Data Structures and Algorithms through visual animations, step-by-step pseudo-code, and hands-on practice. The platform transforms abstract DSA concepts into engaging, game-like learning experiences.

## ✨ Features

- 🎨 **Visual Learning**: Beautiful animations showing how algorithms work
- 🎯 **Interactive Practice**: Hands-on exercises with drag-and-drop interactions
- 📝 **Pseudo-Code Integration**: Synchronized code explanations with visualizations
- 🎮 **Game-Like Levels**: Progressive learning through structured levels
- 📊 **Progress Tracking**: Save and track your learning journey
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## 🛠️ Technology Stack

### Frontend
- **React.js** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

## 📁 Project Structure

```
dsa-with-gaming/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── common/    # Navbar, Footer, etc.
│   │   │   └── visualizations/  # DSA visualizations
│   │   ├── pages/         # Page components
│   │   ├── data/          # Static data (JSON)
│   │   ├── utils/         # Helper functions
│   │   └── App.jsx        # Main app component
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── controllers/      # Route controllers
│   ├── server.js         # Entry point
│   └── package.json
│
├── .gitignore
├── package.json          # Root package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (local or Atlas) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

### Installation

1. **Clone the repository** (or navigate to project folder)
```bash
cd "C:\Users\Krutik\OneDrive\Desktop\Dsa With Gaming"
```

2. **Install all dependencies** (root, client, and server)
```bash
npm run install-all
```

Or install manually:
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. **Set up environment variables**

Create a `.env` file in the `server` directory:
```bash
cd server
copy .env.example .env
```

Edit `.env` and update with your MongoDB URI:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dsa-gaming
```

For **MongoDB Atlas** (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dsa-gaming
```

### Running the Application

#### Option 1: Run Both (Recommended)
```bash
# From root directory
npm run dev
```
This runs both frontend and backend concurrently.

#### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd server
npm start
```
Server runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Frontend runs on: http://localhost:3000

### Verify Installation

1. Open http://localhost:3000 in your browser
2. You should see the DSA with Gaming homepage
3. Check http://localhost:5000/api/health to verify backend is running

## 📚 Learning Modules

### Current Modules

1. **🔄 Sorting Algorithms**
   - Bubble Sort visualization
   - Selection Sort practice
   - Interactive sorting challenges

2. **📚 Stack & Queue**
   - LIFO (Stack) operations
   - FIFO (Queue) operations
   - Overflow/underflow handling

3. **🌳 Tree Basics**
   - Binary tree structure
   - Node insertion
   - Tree traversal (in-order, pre-order, post-order)

## 👥 Team Collaboration

### Git Workflow

1. **Create a new branch for features:**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and commit:**
```bash
git add .
git commit -m "Description of changes"
```

3. **Push to repository:**
```bash
git push origin feature/your-feature-name
```

4. **Create Pull Request** for team review

### Folder Ownership (Suggested)

- **Frontend Components**: Team Member 1
- **Visualizations**: Team Member 2
- **Backend API**: Team Member 3
- **Database Models**: Team Member 4

## 🧪 Testing

```bash
# Test frontend
cd client
npm run build

# Test backend
cd server
npm start
```

## 📦 Building for Production

```bash
# Build frontend
cd client
npm run build

# The build folder will be in client/dist
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set build command: `cd client && npm run build`
4. Set publish directory: `client/dist`

### Backend (Render/Railway)
1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set start command: `cd server && npm start`
4. Add environment variables

### Database (MongoDB Atlas)
1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Update `.env` with Atlas URI

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Change port in vite.config.js or .env
```

### MongoDB Connection Error
- Ensure MongoDB is running locally, or
- Use MongoDB Atlas and update connection string
- Check firewall settings

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📖 Documentation

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Team

- Team Member 1 - Frontend Development
- Team Member 2 - Visualization Components
- Team Member 3 - Backend Development
- Team Member 4 - Database & API

## 🎯 Future Enhancements (Major Project)

- User authentication & profiles
- Advanced DSA topics (Graphs, DP)
- Coding editor integration
- Leaderboards & achievements
- AI-powered hints
- Multiplayer challenges

---

**Happy Learning! 🚀**

For questions or issues, contact your team members or create an issue in the repository.
