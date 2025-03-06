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

// Initialize Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Global JSON middleware
app.use(clerkMiddleware());

// Function to initialize database & cloudinary
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

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
