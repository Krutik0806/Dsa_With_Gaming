# 🚀 Quick Start Guide

## Step 1: Install Dependencies

Open PowerShell/Terminal in the project root directory and run:

```powershell
npm run install-all
```

This will install dependencies for:
- Root project
- Client (React frontend)
- Server (Node.js backend)

## Step 2: Set Up Environment Variables

1. Navigate to the `server` folder
2. Copy `.env.example` to `.env`:
```powershell
cd server
copy .env.example .env
```

3. Edit `.env` file and update MongoDB URI if needed

**For local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/dsa-gaming
```

**For MongoDB Atlas (cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dsa-gaming
```

## Step 3: Run the Application

### Option A: Run Both Frontend & Backend Together (Recommended)

From the root directory:
```powershell
npm run dev
```

### Option B: Run Separately

**Terminal 1 - Backend:**
```powershell
cd server
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd client
npm run dev
```

## Step 4: Open in Browser

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## 🎯 What You Should See

1. Beautiful homepage with gradient background
2. Navigation bar with "Home", "Modules", "About"
3. Three learning modules: Sorting, Stack & Queue, Trees
4. Click on any module to see the learning level interface

## 🛠️ Team Workflow

### Each Team Member Should:

1. **Clone/Pull latest code**
```powershell
git pull origin main
```

2. **Create a feature branch**
```powershell
git checkout -b feature/your-name-feature
```

3. **Make changes and test locally**

4. **Commit and push**
```powershell
git add .
git commit -m "Description of changes"
git push origin feature/your-name-feature
```

5. **Create Pull Request** for team review

## 📁 Who Works on What?

Suggested division:

- **Member 1**: Frontend components (`client/src/components/`)
- **Member 2**: Visualizations (`client/src/components/visualizations/`)
- **Member 3**: Backend API (`server/routes/`, `server/controllers/`)
- **Member 4**: Database & Models (`server/models/`)

## 🐛 Common Issues

### Port Already in Use
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### MongoDB Not Running
- Install MongoDB locally, OR
- Use MongoDB Atlas (free cloud database)

### Module Not Found
```powershell
# Delete node_modules and reinstall
rm -r node_modules
npm install
```

## 📞 Need Help?

Check the main `README.md` for detailed documentation!

---

**Happy Coding! 🎮**
