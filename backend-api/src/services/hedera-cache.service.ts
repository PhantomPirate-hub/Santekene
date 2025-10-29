import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Service de cache Redis pour Hedera
 * Permet d'éviter les doublons de transactions et de mettre en cache les résultats
 */
class HederaCacheService {
  private redis: Redis | null = null;
  private readonly defaultTTL = 3600; // 1 heure par défaut
  private isConnected = false;

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialise la connexion Redis
   */
  private initializeRedis(): void {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;

    try {
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connecté pour Hedera Cache Service');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        console.warn('⚠️  Redis error (Hedera Cache):', error.message);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        console.warn('⚠️  Redis connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      console.warn('⚠️  Impossible de se connecter à Redis. Le cache sera désactivé.');
      this.redis = null;
    }
  }

  /**
   * Vérifie si Redis est disponible
   */
  isAvailable(): boolean {
    return this.redis !== null && this.isConnected;
  }

  /**
   * Génère une clé de cache pour une transaction Hedera
   */
  private generateKey(prefix: string, identifier: string): string {
    return `hedera:${prefix}:${identifier}`;
  }

  /**
   * Stocke une transaction HCS dans le cache
   */
  async cacheHcsTransaction(entityType: string, entityId: number, txId: string, ttl?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const key = this.generateKey('hcs', `${entityType}:${entityId}`);
      await this.redis!.setex(key, ttl || this.defaultTTL, txId);
      return true;
    } catch (error) {
      console.error('Erreur lors du cache HCS:', error);
      return false;
    }
  }

  /**
   * Récupère une transaction HCS depuis le cache
   */
  async getHcsTransaction(entityType: string, entityId: number): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      const key = this.generateKey('hcs', `${entityType}:${entityId}`);
      return await this.redis!.get(key);
    } catch (error) {
      console.error('Erreur lors de la récupération du cache HCS:', error);
      return null;
    }
  }

  /**
   * Vérifie si une transaction HCS existe déjà dans le cache (éviter les doublons)
   */
  async hcsTransactionExists(entityType: string, entityId: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const key = this.generateKey('hcs', `${entityType}:${entityId}`);
      const exists = await this.redis!.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Erreur lors de la vérification du cache HCS:', error);
      return false;
    }
  }

  /**
   * Stocke un fichier HFS dans le cache
   */
  async cacheHfsFile(fileHash: string, fileId: string, ttl?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const key = this.generateKey('hfs', fileHash);
      await this.redis!.setex(key, ttl || this.defaultTTL, fileId);
      return true;
    } catch (error) {
      console.error('Erreur lors du cache HFS:', error);
      return false;
    }
  }

  /**
   * Récupère un fichier HFS depuis le cache
   */
  async getHfsFile(fileHash: string): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      const key = this.generateKey('hfs', fileHash);
      return await this.redis!.get(key);
    } catch (error) {
      console.error('Erreur lors de la récupération du cache HFS:', error);
      return null;
    }
  }

  /**
   * Vérifie si un fichier HFS existe déjà (éviter doublons)
   */
  async hfsFileExists(fileHash: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const key = this.generateKey('hfs', fileHash);
      const exists = await this.redis!.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Erreur lors de la vérification du cache HFS:', error);
      return false;
    }
  }

  /**
   * Cache un transfert HTS (KènèPoints)
   */
  async cacheHtsTransfer(userId: number, amount: number, reason: string, txId: string, ttl?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const key = this.generateKey('hts', `${userId}:${Date.now()}`);
      const data = JSON.stringify({ userId, amount, reason, txId, timestamp: Date.now() });
      await this.redis!.setex(key, ttl || this.defaultTTL, data);
      return true;
    } catch (error) {
      console.error('Erreur lors du cache HTS:', error);
      return false;
    }
  }

  /**
   * Récupère l'historique des transferts HTS pour un utilisateur
   */
  async getHtsTransfers(userId: number, limit: number = 10): Promise<any[]> {
    if (!this.isAvailable()) return [];

    try {
      const pattern = this.generateKey('hts', `${userId}:*`);
      const keys = await this.redis!.keys(pattern);
      const transfers = [];

      for (const key of keys.slice(0, limit)) {
        const data = await this.redis!.get(key);
        if (data) {
          transfers.push(JSON.parse(data));
        }
      }

      return transfers.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Erreur lors de la récupération des transferts HTS:', error);
      return [];
    }
  }

  /**
   * Stocke une valeur générique dans le cache
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      if (ttl) {
        await this.redis!.setex(key, ttl, value);
      } else {
        await this.redis!.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Erreur lors du set cache:', error);
      return false;
    }
  }

  /**
   * Récupère une valeur générique depuis le cache
   */
  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      return await this.redis!.get(key);
    } catch (error) {
      console.error('Erreur lors du get cache:', error);
      return null;
    }
  }

  /**
   * Supprime une clé du cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.redis!.del(key);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du cache:', error);
      return false;
    }
  }

  /**
   * Vide tout le cache Hedera (admin uniquement)
   */
  async flushHederaCache(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const keys = await this.redis!.keys('hedera:*');
      if (keys.length > 0) {
        await this.redis!.del(...keys);
        console.log(`🗑️  ${keys.length} clés Hedera supprimées du cache`);
      }
      return true;
    } catch (error) {
      console.error('Erreur lors du flush du cache Hedera:', error);
      return false;
    }
  }

  /**
   * Obtient des statistiques sur le cache
   */
  async getCacheStats(): Promise<{
    hcsKeys: number;
    hfsKeys: number;
    htsKeys: number;
    totalKeys: number;
    memoryUsed: string;
    isAvailable: boolean;
  }> {
    if (!this.isAvailable()) {
      return {
        hcsKeys: 0,
        hfsKeys: 0,
        htsKeys: 0,
        totalKeys: 0,
        memoryUsed: '0 MB',
        isAvailable: false,
      };
    }

    try {
      const hcsKeys = await this.redis!.keys('hedera:hcs:*');
      const hfsKeys = await this.redis!.keys('hedera:hfs:*');
      const htsKeys = await this.redis!.keys('hedera:hts:*');
      const info = await this.redis!.info('memory');
      
      // Extraire la mémoire utilisée
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsed = memoryMatch ? memoryMatch[1].trim() : '0 MB';

      return {
        hcsKeys: hcsKeys.length,
        hfsKeys: hfsKeys.length,
        htsKeys: htsKeys.length,
        totalKeys: hcsKeys.length + hfsKeys.length + htsKeys.length,
        memoryUsed,
        isAvailable: true,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats cache:', error);
      return {
        hcsKeys: 0,
        hfsKeys: 0,
        htsKeys: 0,
        totalKeys: 0,
        memoryUsed: '0 MB',
        isAvailable: false,
      };
    }
  }

  /**
   * Ferme la connexion Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
      console.log('🔌 Redis déconnecté (Hedera Cache)');
    }
  }
}

// Export singleton
export const hederaCacheService = new HederaCacheService();

