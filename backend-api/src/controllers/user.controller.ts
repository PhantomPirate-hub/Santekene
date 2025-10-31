
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class UserController {
  async registerDeviceToken(req: Request, res: Response) {
    const { deviceToken } = req.body;
    // @ts-ignore
    const userId = req.user.id; // Assuming userId is available from auth middleware

    if (!deviceToken) {
      return res.status(400).json({ message: 'Device token is required' });
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { deviceToken },
      });
      res.status(200).json({ message: 'Device token registered successfully' });
    } catch (error) {
      console.error('Error registering device token:', error);
      res.status(500).json({ message: 'Failed to register device token' });
    }
  }
}

export default new UserController();
