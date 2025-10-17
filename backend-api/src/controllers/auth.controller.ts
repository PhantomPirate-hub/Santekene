import pkg from 'express';
const { Request, Response } = pkg;
import { prisma } from '../services/prisma.service.ts';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // À remplacer par une variable d'environnement forte

export const register = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'PATIENT', // Défaut à PATIENT si non spécifié
      },
    });

    // Ne pas renvoyer le mot de passe haché
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'Utilisateur enregistré avec succès.', user: userWithoutPassword });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur interne.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  console.log('Tentative de connexion pour l\'email:', email);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('Utilisateur trouvé:', user ? user.email : 'aucun');

    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Mot de passe valide:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    // Ne pas renvoyer le mot de passe haché
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Erreur lors de la connexion de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur interne.' });
  }
};
