// src/routes/location.routes.js
import express from 'express';
import {
  listLocations, getLocation, createLocation, updateLocation, deleteLocation
} from '../controllers/location.controller.js';

const router = express.Router();

router.get('/', listLocations);
router.get('/:id', getLocation);
router.post('/', createLocation);
router.patch('/:id', updateLocation);
router.delete('/:id', deleteLocation);

export default router;
