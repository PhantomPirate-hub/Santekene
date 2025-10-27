import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // À remplacer par une variable d'environnement forte

// Schémas de validation Zod
const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(['PATIENT', 'MEDECIN', 'ADMIN']).optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

/**
 * Inscription d'un nouvel utilisateur
 */
export const register = async (req: Request, res: Response) => {
  try {
    // Validation des données
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password, role, phone } = validatedData;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: (role as Role) || Role.PATIENT,
        phone,
        isVerified: false,
      },
    });

    // Créer automatiquement le profil associé selon le rôle
    if (user.role === Role.PATIENT) {
      await prisma.patient.create({
        data: {
          userId: user.id,
        },
      });
    } else if (user.role === Role.MEDECIN) {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          speciality: 'Médecine générale', // Par défaut, à modifier plus tard
        },
      });
    } else if (user.role === Role.ADMIN) {
      await prisma.admin.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Créer une session dans la base de données
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Retourner l'utilisateur (sans le mot de passe) et le token
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    console.error('Erreur lors de l\'inscription:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
  }
};

/**
 * Connexion d'un utilisateur
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Validation des données
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Créer une session dans la base de données
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        userId: user.id,
        details: `Utilisateur ${user.email} s'est connecté`,
      },
    });

    // Retourner l'utilisateur (sans le mot de passe) et le token
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({
      message: 'Connexion réussie',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: error.errors });
    }
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
};

/**
 * Déconnexion d'un utilisateur
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // Récupérer le token depuis les headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant.' });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier et décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
    } catch (err) {
      return res.status(401).json({ error: 'Token invalide.' });
    }

    // Supprimer la session de la base de données
    await prisma.session.deleteMany({
      where: {
        token: token,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'LOGOUT',
        userId: decoded.userId,
        details: `Utilisateur ${decoded.email} s'est déconnecté`,
      },
    });

    return res.status(200).json({
      message: 'Déconnexion réussie',
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la déconnexion.' });
  }
};

/**
 * Mettre à jour le profil utilisateur
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { name, email, phone, bloodGroup, height, birthDate, location } = req.body;

    // Validation basique
    if (!name || !email) {
      return res.status(400).json({ error: 'Le nom et l\'email sont requis' });
    }

    // Récupérer l'utilisateur actuel depuis la DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'email est déjà utilisé par un AUTRE utilisateur
    const emailChanged = email !== user.email;
    
    if (emailChanged) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte' });
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone: phone || null,
      },
    });

    // Mettre à jour les données du patient si c'est un patient
    if (updatedUser.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId: userId },
      });

      if (patient) {
        await prisma.patient.update({
          where: { id: patient.id },
          data: {
            bloodGroup: bloodGroup || null,
            height: height ? parseFloat(height) : null,
            birthDate: birthDate ? new Date(birthDate) : null,
            location: location || null,
          },
        });
      }
    }

    // Si l'email a été modifié, invalider toutes les sessions existantes
    if (emailChanged) {
      await prisma.session.deleteMany({
        where: { userId: userId },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_PROFILE',
        userId: userId,
        details: `Utilisateur ${updatedUser.email} a mis à jour son profil`,
      },
    });

    // Retourner l'utilisateur mis à jour (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: userWithoutPassword,
      emailChanged: emailChanged, // Indiquer si l'email a changé
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du profil' });
  }
};

/**
 * Mettre à jour le mot de passe
 */
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_PASSWORD',
        userId: userId,
        details: `Utilisateur ${user.email} a modifié son mot de passe`,
      },
    });

    return res.status(200).json({
      message: 'Mot de passe modifié avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la modification du mot de passe:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la modification du mot de passe' });
  }
};

