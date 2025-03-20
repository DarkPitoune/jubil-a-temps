import { Router } from 'express';
import { register, login, getUserProfile } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getUserProfile);

export default router;