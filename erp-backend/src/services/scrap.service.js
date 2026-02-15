// src/services/scrap.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createScrapInventory = async (scrapData) => {
  return await prisma.scrapInventory.create({
    data: scrapData,
    include: {
      blank: true,
      material: true,
      location: true
    }
  });
};

export const getAllScrapInventory = async (filters = {}) => {
  const { status, location_id, material_id, limit = 50, offset = 0 } = filters;
  
  const where = {};
  if (status) where.status = status;
  if (location_id) where.location_id = location_id;
  if (material_id) where.material_id = material_id;

  return await prisma.scrapInventory.findMany({
    where,
    include: {
      blank: true,
      material: true,
      location: true
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset
  });
};

export const getScrapById = async (scrapId) => {
  return await prisma.scrapInventory.findUnique({
    where: { scrap_id: scrapId },
    include: {
      blank: true,
      material: true,
      location: true,
      scrapTxns: {
        orderBy: { created_at: 'desc' }
      }
    }
  });
};

export const updateScrapStatus = async (scrapId, status, updatedBy) => {
  return await prisma.scrapInventory.update({
    where: { scrap_id: scrapId },
    data: { 
      status,
      updated_at: new Date()
    },
    include: {
      blank: true,
      material: true,
      location: true
    }
  });
};

export const recordScrapTransaction = async (transactionData) => {
  return await prisma.scrapTransaction.create({
    data: transactionData,
    include: {
      scrap: {
        include: {
          material: true,
          location: true
        }
      }
    }
  });
};

export const getScrapTransactions = async (filters = {}) => {
  const { scrap_id, txn_type, limit = 50, offset = 0 } = filters;
  
  const where = {};
  if (scrap_id) where.scrap_id = scrap_id;
  if (txn_type) where.txn_type = txn_type;

  return await prisma.scrapTransaction.findMany({
    where,
    include: {
      scrap: {
        include: {
          material: true,
          location: true
        }
      }
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset
  });
};

export const getScrapByLocation = async (locationId) => {
  return await prisma.scrapInventory.findMany({
    where: { 
      location_id: locationId,
      status: 'AVAILABLE'
    },
    include: {
      blank: true,
      material: true,
      location: true
    },
    orderBy: { created_at: 'desc' }
  });
};

export const getScrapByMaterial = async (materialId) => {
  return await prisma.scrapInventory.findMany({
    where: { 
      material_id: materialId,
      status: 'AVAILABLE'
    },
    include: {
      blank: true,
      material: true,
      location: true
    },
    orderBy: { created_at: 'desc' }
  });
};
