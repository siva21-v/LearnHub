import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js';
import educatorRouter from './routes/educatorRoutes.js';
import courseRouter from './routes/courseRoute.js';
import http from 'http'; // Import http module
import { Server } from 'socket.io'; // Import socket.io

// Initialize Express
const app = express();

// Create an HTTP server for Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Allow all origins (adjust for production)
});

// Middlewares
app.use(cors());
app.use(express.json()); // Global JSON middleware
app.use(clerkMiddleware());

// Initialize database & cloudinary
const initializeApp = async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }

  try {
    await connectCloudinary();
    console.log('✅ Cloudinary connected');
  } catch (error) {
    console.warn('⚠️ Cloudinary Connection Failed:', error.message);
  }
};

// Start initialization
initializeApp();

// Routes
app.get('/', (req, res) => res.send('API Working'));
app.post('/clerk', clerkWebhooks);
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);
app.use('/api/educator', educatorRouter);
app.use('/api/course', courseRouter);
app.use('/api/user', userRouter);

// 🔹 SOCKET.IO SETUP
const onlineUsersNamespace = io.of("/online.users");

onlineUsersNamespace.on("connection", (socket) => {
  console.log("✅ User connected to /online.users namespace");

  socket.on("disconnect", () => {
    console.log("❌ User disconnected from /online.users");
  });
});

// Start Server on the HTTP server (not app.listen)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
