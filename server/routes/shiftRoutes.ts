import { Router } from 'express';
import { createShift, getShifts, updateShift, deleteShift } from '../controllers/shiftController';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/', auth, createShift);
router.get('/', auth, getShifts);
router.put('/:id', auth, updateShift);
router.delete('/:id', auth, deleteShift);

export default router;