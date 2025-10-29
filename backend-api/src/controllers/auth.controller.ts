import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // À remplacer par une variable d'environnement forte

// Schémas de validation Zod pour chaque type d'utilisateur
const patientRegisterSchema = z.object({
  role: z.literal('PATIENT'),
  name: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const medecinRegisterSchema = z.object({
  role: z.literal('MEDECIN'),
  name: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères"),
  speciality: z.string().min(2, "La fonction/spécialité est requise"),
  facilityId: z.number().int().positive("Vous devez sélectionner un établissement"),
  location: z.string().min(2, "La résidence est requise"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const adminRegisterSchema = z.object({
  role: z.literal('ADMIN'),
  // Informations de la structure
  facilityName: z.string().min(2, "Le nom de la structure est requis"),
  facilityType: z.string().min(2, "Le type de structure est requis"),
  facilityCity: z.string().min(2, "La localité de la structure est requise"),
  facilityPhone: z.string().min(8, "Le contact de la structure est requis"),
  documentUrl: z.string().optional().nullable(), // URL base64 ou lien vers le document (optionnel)
  documentType: z.string().optional(),
  // Informations du responsable
  responsibleName: z.string().min(2, "Le nom complet du responsable est requis"),
  responsibleEmail: z.string().email("Email du responsable invalide"),
  responsiblePhone: z.string().min(8, "Le contact du responsable est requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

/**
 * Récupérer les structures de santé approuvées
 */
export const getApprovedFacilities = async (req: Request, res: Response) => {
  try {
    const facilities = await prisma.healthFacilityRequest.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        id: true,
        facilityName: true,
        facilityType: true,
        facilityCity: true,
      },
      orderBy: {
        facilityName: 'asc',
      },
    });

    return res.status(200).json({ facilities });
  } catch (error) {
    console.error('❌ Erreur récupération structures:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Inscription d'un nouvel utilisateur (Patient, Médecin ou Admin)
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;

    // Sélectionner le schéma de validation approprié
    let validatedData: any;
    
    if (role === 'PATIENT') {
      validatedData = patientRegisterSchema.parse(req.body);
    } else if (role === 'MEDECIN') {
      validatedData = medecinRegisterSchema.parse(req.body);
    } else if (role === 'ADMIN') {
      validatedData = adminRegisterSchema.parse(req.body);
    } else {
      return res.status(400).json({ error: 'Rôle invalide. Choisissez PATIENT, MEDECIN ou ADMIN.' });
    }

    // === INSCRIPTION PATIENT ===
    if (role === 'PATIENT') {
      const { name, email, phone, password } = validatedData;

      // Vérifier si l'email existe déjà
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà.' });
      }

      // Vérifier si le téléphone existe déjà
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé.' });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur patient (isVerified = true pour patient)
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: Role.PATIENT,
          isVerified: true, // Patient peut se connecter immédiatement
        },
      });

      // Créer le profil patient
      await prisma.patient.create({
        data: {
          userId: user.id,
        },
      });

      // Créer un token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Créer une session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json({
        message: 'Compte patient créé avec succès ! Vous pouvez compléter votre profil dans les paramètres.',
        user: userWithoutPassword,
        token,
      });
    }

    // === INSCRIPTION MÉDECIN ===
    if (role === 'MEDECIN') {
      const { name, email, phone, password, speciality, facilityId, location } = validatedData;

      // Vérifier si l'email existe déjà
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà.' });
      }

      // Vérifier si le téléphone existe déjà
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé.' });
      }

      // Vérifier que la structure existe et est approuvée
      const facility = await prisma.healthFacilityRequest.findUnique({
        where: { id: facilityId },
      });

      if (!facility) {
        return res.status(400).json({ error: 'Structure non trouvée.' });
      }

      if (facility.status !== 'APPROVED') {
        return res.status(400).json({ error: 'Cette structure n\'est pas encore approuvée.' });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur médecin (isVerified = false, doit être validé par admin)
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: Role.MEDECIN,
          isVerified: false, // Médecin doit être validé par un admin
        },
      });

      // Créer le profil médecin lié à la structure
      await prisma.doctor.create({
        data: {
          userId: user.id,
          speciality,
          facilityId,
          structure: facility.facilityName, // Garder aussi le nom en fallback
          location,
          phone,
        },
      });

      return res.status(201).json({
        message: `Votre demande d'inscription à ${facility.facilityName} a été soumise avec succès. Vous recevrez un email une fois votre compte validé par l'administrateur.`,
        requiresValidation: true,
        facilityName: facility.facilityName,
      });
    }

    // === INSCRIPTION ADMIN (Représentant de structure) ===
    if (role === 'ADMIN') {
      console.log('🏥 Début inscription Admin...');
      const {
        facilityName,
        facilityType,
        facilityCity,
        facilityPhone,
        documentUrl,
        documentType,
        responsibleName,
        responsibleEmail,
        responsiblePhone,
        password,
      } = validatedData;

      console.log(`📝 Données reçues - Structure: ${facilityName}, Responsable: ${responsibleName}`);

      // Vérifier si l'email du responsable existe déjà
      const existingEmail = await prisma.user.findUnique({ where: { email: responsibleEmail } });
      if (existingEmail) {
        return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà.' });
      }

      // Vérifier si le téléphone du responsable existe déjà
      const existingPhone = await prisma.user.findUnique({ where: { phone: responsiblePhone } });
      if (existingPhone) {
        return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé.' });
      }

      // Vérifier si l'email de la structure existe déjà
      const existingFacilityEmail = await prisma.healthFacilityRequest.findUnique({
        where: { facilityEmail: responsibleEmail },
      });
      if (existingFacilityEmail) {
        return res.status(400).json({ error: 'Cette structure a déjà soumis une demande.' });
      }

      try {
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Mot de passe hashé');

        // Créer l'utilisateur admin (isVerified = false, doit être validé par super admin)
        const user = await prisma.user.create({
          data: {
            name: responsibleName,
            email: responsibleEmail,
            phone: responsiblePhone,
            password: hashedPassword,
            role: Role.ADMIN,
            isVerified: false, // Admin doit être validé par un super admin
          },
        });
        console.log(`✅ Utilisateur admin créé - ID: ${user.id}`);

        // Créer la demande de structure de santé
        const facilityRequest = await prisma.healthFacilityRequest.create({
          data: {
            facilityName,
            facilityType,
            facilityAddress: `${facilityCity}`, // On utilise la ville comme adresse pour l'instant
            facilityCity,
            facilityPhone,
            facilityEmail: responsibleEmail, // Email de la structure = email du responsable
            responsibleName,
            responsiblePosition: 'Représentant', // Par défaut
            responsiblePhone,
            responsibleEmail,
            documentUrl: documentUrl || null,
            documentType: documentType || 'Document de validation',
            status: 'PENDING',
          },
        });
        console.log(`✅ Demande de structure créée - ID: ${facilityRequest.id}`);

        // Créer le profil admin lié à la demande
        const admin = await prisma.admin.create({
          data: {
            userId: user.id,
            facilityRequestId: facilityRequest.id,
          },
        });
        console.log(`✅ Profil admin créé et lié à la structure - Admin ID: ${admin.id}`);

        return res.status(201).json({
          message: 'Votre demande d\'inscription de structure a été soumise avec succès. Un Super Admin examinera votre demande et vous recevrez un email une fois validée.',
          requiresValidation: true,
          facilityRequestId: facilityRequest.id,
          userId: user.id,
        });
      } catch (error) {
        console.error('❌ Erreur détaillée lors de la création Admin/Structure:', error);
        
        // Si on a créé l'utilisateur mais pas la structure, on peut essayer de nettoyer
        // (optionnel, selon votre stratégie)
        
        throw error; // Relancer pour la gestion globale
      }
    }

    return res.status(400).json({ error: 'Rôle non reconnu.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: (error as any).errors.map((e: any) => ({ field: e.path.join('.'), message: e.message })) 
      });
    }
    console.error('❌ Erreur lors de l\'inscription:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.', details: (error as Error).message });
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

    // Vérifier si le compte est actif (vérifié)
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.' });
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
      return res.status(400).json({ error: 'Données invalides', details: (error as any).errors.map((e: any) => ({ field: e.path.join('.'), message: e.message })) });
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

