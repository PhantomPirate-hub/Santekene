import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

/**
 * Service de stockage de fichiers (MinIO/S3)
 * Gère l'upload, le download et la suppression de fichiers
 */
class FileStorageService {
  private minioClient: Minio.Client | null = null;
  private bucketName: string;
  private isConfigured = false;
  private localStoragePath: string;

  constructor() {
    this.bucketName = process.env.MINIO_BUCKET_NAME || 'santekene-documents';
    this.localStoragePath = process.env.LOCAL_STORAGE_PATH || './uploads';
    this.initializeMinIO();
  }

  /**
   * Initialise la connexion MinIO
   */
  private initializeMinIO(): void {
    const endpoint = process.env.MINIO_ENDPOINT;
    const port = parseInt(process.env.MINIO_PORT || '9000');
    const accessKey = process.env.MINIO_ACCESS_KEY;
    const secretKey = process.env.MINIO_SECRET_KEY;
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    if (!endpoint || !accessKey || !secretKey) {
      console.warn('⚠️  MinIO non configuré. Utilisation du stockage local de secours.');
      this.ensureLocalStorageDirectory();
      return;
    }

    try {
      this.minioClient = new Minio.Client({
        endPoint: endpoint,
        port,
        useSSL,
        accessKey,
        secretKey,
      });

      // Vérifier si le bucket existe, sinon le créer
      this.ensureBucket();
      this.isConfigured = true;

      console.log(`✅ MinIO configuré - Endpoint: ${endpoint}:${port}, Bucket: ${this.bucketName}`);
    } catch (error) {
      console.error('❌ Erreur lors de la configuration MinIO:', error);
      this.ensureLocalStorageDirectory();
    }
  }

  /**
   * Vérifie et crée le bucket si nécessaire
   */
  private async ensureBucket(): Promise<void> {
    if (!this.minioClient) return;

    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);

      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        console.log(`✅ Bucket ${this.bucketName} créé`);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification/création du bucket:', error);
    }
  }

  /**
   * Crée le dossier de stockage local si nécessaire
   */
  private ensureLocalStorageDirectory(): void {
    if (!fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
      console.log(`✅ Dossier de stockage local créé: ${this.localStoragePath}`);
    }
  }

  /**
   * Vérifie si MinIO est disponible
   */
  isAvailable(): boolean {
    return this.isConfigured && this.minioClient !== null;
  }

  /**
   * Génère un nom de fichier unique
   */
  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${random}${ext}`;
  }

  /**
   * Upload un fichier sur MinIO/S3
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType?: string,
    metadata?: Record<string, string>
  ): Promise<{ url: string; fileName: string; size: number }> {
    const fileName = this.generateFileName(originalName);

    // Tenter l'upload sur MinIO
    if (this.isAvailable()) {
      try {
        const metaData: Record<string, string> = {
          'Content-Type': mimeType || 'application/octet-stream',
          'Original-Name': originalName,
          ...metadata,
        };

        await this.minioClient!.putObject(
          this.bucketName,
          fileName,
          fileBuffer,
          fileBuffer.length,
          metaData
        );

        const url = `minio://${this.bucketName}/${fileName}`;
        console.log(`✅ Fichier uploadé sur MinIO: ${url}`);

        return {
          url,
          fileName,
          size: fileBuffer.length,
        };
      } catch (error) {
        console.error('❌ Erreur upload MinIO, fallback sur stockage local:', error);
        // Fallback sur stockage local en cas d'erreur
      }
    }

    // Fallback : Stockage local
    return this.uploadToLocal(fileBuffer, fileName);
  }

  /**
   * Upload un fichier en local (fallback)
   */
  private uploadToLocal(
    fileBuffer: Buffer,
    fileName: string
  ): { url: string; fileName: string; size: number } {
    this.ensureLocalStorageDirectory();
    const filePath = path.join(this.localStoragePath, fileName);

    fs.writeFileSync(filePath, fileBuffer);

    const url = `local://${fileName}`;
    console.log(`✅ Fichier uploadé en local: ${url}`);

    return {
      url,
      fileName,
      size: fileBuffer.length,
    };
  }

  /**
   * Télécharge un fichier depuis MinIO/S3
   */
  async downloadFile(fileUrl: string): Promise<Buffer> {
    // Déterminer le type de stockage depuis l'URL
    if (fileUrl.startsWith('minio://')) {
      return this.downloadFromMinIO(fileUrl);
    } else if (fileUrl.startsWith('local://')) {
      return this.downloadFromLocal(fileUrl);
    } else {
      throw new Error(`URL de fichier invalide: ${fileUrl}`);
    }
  }

  /**
   * Télécharge un fichier depuis MinIO
   */
  private async downloadFromMinIO(fileUrl: string): Promise<Buffer> {
    if (!this.isAvailable()) {
      throw new Error('MinIO non disponible');
    }

    try {
      // Extraire bucket et fileName de l'URL : minio://bucket/filename
      const urlParts = fileUrl.replace('minio://', '').split('/');
      const bucket = urlParts[0];
      const fileName = urlParts.slice(1).join('/');

      const chunks: Buffer[] = [];
      const stream = await this.minioClient!.getObject(bucket, fileName);

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement depuis MinIO:', error);
      throw new Error('Impossible de télécharger le fichier depuis MinIO');
    }
  }

  /**
   * Télécharge un fichier depuis le stockage local
   */
  private downloadFromLocal(fileUrl: string): Buffer {
    try {
      // Extraire fileName de l'URL : local://filename
      const fileName = fileUrl.replace('local://', '');
      const filePath = path.join(this.localStoragePath, fileName);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier non trouvé: ${filePath}`);
      }

      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('Erreur lors du téléchargement depuis le stockage local:', error);
      throw new Error('Impossible de télécharger le fichier depuis le stockage local');
    }
  }

  /**
   * Supprime un fichier
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (fileUrl.startsWith('minio://')) {
      await this.deleteFromMinIO(fileUrl);
    } else if (fileUrl.startsWith('local://')) {
      await this.deleteFromLocal(fileUrl);
    }
  }

  /**
   * Supprime un fichier de MinIO
   */
  private async deleteFromMinIO(fileUrl: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('MinIO non disponible');
    }

    try {
      const urlParts = fileUrl.replace('minio://', '').split('/');
      const bucket = urlParts[0];
      const fileName = urlParts.slice(1).join('/');

      await this.minioClient!.removeObject(bucket, fileName);
      console.log(`🗑️  Fichier supprimé de MinIO: ${fileUrl}`);
    } catch (error) {
      console.error('Erreur lors de la suppression depuis MinIO:', error);
      throw new Error('Impossible de supprimer le fichier de MinIO');
    }
  }

  /**
   * Supprime un fichier du stockage local
   */
  private async deleteFromLocal(fileUrl: string): Promise<void> {
    try {
      const fileName = fileUrl.replace('local://', '');
      const filePath = path.join(this.localStoragePath, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Fichier supprimé du stockage local: ${fileUrl}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression depuis le stockage local:', error);
      throw new Error('Impossible de supprimer le fichier du stockage local');
    }
  }

  /**
   * Obtient les métadonnées d'un fichier
   */
  async getFileMetadata(fileUrl: string): Promise<{ size: number; contentType: string }> {
    if (fileUrl.startsWith('minio://')) {
      return this.getMinIOFileMetadata(fileUrl);
    } else if (fileUrl.startsWith('local://')) {
      return this.getLocalFileMetadata(fileUrl);
    }

    throw new Error(`URL de fichier invalide: ${fileUrl}`);
  }

  /**
   * Obtient les métadonnées d'un fichier MinIO
   */
  private async getMinIOFileMetadata(fileUrl: string): Promise<{ size: number; contentType: string }> {
    if (!this.isAvailable()) {
      throw new Error('MinIO non disponible');
    }

    try {
      const urlParts = fileUrl.replace('minio://', '').split('/');
      const bucket = urlParts[0];
      const fileName = urlParts.slice(1).join('/');

      const stat = await this.minioClient!.statObject(bucket, fileName);

      return {
        size: stat.size,
        contentType: stat.metaData?.['content-type'] || 'application/octet-stream',
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées MinIO:', error);
      throw new Error('Impossible de récupérer les métadonnées du fichier');
    }
  }

  /**
   * Obtient les métadonnées d'un fichier local
   */
  private getLocalFileMetadata(fileUrl: string): { size: number; contentType: string } {
    try {
      const fileName = fileUrl.replace('local://', '');
      const filePath = path.join(this.localStoragePath, fileName);

      const stats = fs.statSync(filePath);

      return {
        size: stats.size,
        contentType: 'application/octet-stream', // Type générique pour fichiers locaux
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées locales:', error);
      throw new Error('Impossible de récupérer les métadonnées du fichier');
    }
  }

  /**
   * Liste tous les fichiers d'un bucket/dossier
   */
  async listFiles(prefix?: string): Promise<Array<{ name: string; size: number; url: string }>> {
    if (this.isAvailable()) {
      return this.listMinIOFiles(prefix);
    } else {
      return this.listLocalFiles(prefix);
    }
  }

  /**
   * Liste les fichiers MinIO
   */
  private async listMinIOFiles(prefix?: string): Promise<Array<{ name: string; size: number; url: string }>> {
    if (!this.isAvailable()) {
      throw new Error('MinIO non disponible');
    }

    try {
      const files: Array<{ name: string; size: number; url: string }> = [];
      const stream = this.minioClient!.listObjects(this.bucketName, prefix, true);

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) {
            files.push({
              name: obj.name,
              size: obj.size,
              url: `minio://${this.bucketName}/${obj.name}`,
            });
          }
        });
        stream.on('end', () => resolve(files));
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Erreur lors du listing des fichiers MinIO:', error);
      return [];
    }
  }

  /**
   * Liste les fichiers locaux
   */
  private listLocalFiles(prefix?: string): Array<{ name: string; size: number; url: string }> {
    try {
      this.ensureLocalStorageDirectory();
      const files = fs.readdirSync(this.localStoragePath);

      return files
        .filter((file) => !prefix || file.startsWith(prefix))
        .map((file) => {
          const filePath = path.join(this.localStoragePath, file);
          const stats = fs.statSync(filePath);

          return {
            name: file,
            size: stats.size,
            url: `local://${file}`,
          };
        });
    } catch (error) {
      console.error('Erreur lors du listing des fichiers locaux:', error);
      return [];
    }
  }

  /**
   * Obtient des statistiques sur le stockage
   */
  getStorageStats(): { type: string; available: boolean; bucket?: string } {
    return {
      type: this.isAvailable() ? 'MinIO/S3' : 'Local',
      available: this.isAvailable(),
      bucket: this.isAvailable() ? this.bucketName : undefined,
    };
  }
}

// Export singleton
export const fileStorageService = new FileStorageService();

