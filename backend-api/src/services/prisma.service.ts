
import { PrismaClient } from '@prisma/client';

// Exporte une instance unique de PrismaClient pour être utilisée dans toute l'application.
export const prisma = new PrismaClient();
