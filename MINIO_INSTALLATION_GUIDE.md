# 🗄️ Guide d'Installation MinIO pour Santé Kènè

## 📋 Qu'est-ce que MinIO ?

**MinIO** est un serveur de stockage d'objets open-source, compatible avec l'API S3 d'Amazon. Il permet de :
- ✅ Stocker des fichiers de toute taille
- ✅ Accéder aux fichiers via une API REST
- ✅ Gérer les permissions et buckets
- ✅ Être 100% compatible avec AWS S3
- ✅ Fonctionner en local ou dans le cloud

---

## 🚀 Installation MinIO

### **Option 1 : Docker (Recommandé pour Développement)**

#### **1. Créer un docker-compose pour MinIO**

Créer `docker-compose.minio.yml` à la racine du projet :

```yaml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio-santekene
    ports:
      - "9000:9000"      # API MinIO
      - "9001:9001"      # Console Web MinIO
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - ./minio-data:/data
    command: server /data --console-address ":9001"
    restart: unless-stopped

  # Client pour créer le bucket automatiquement
  minio-create-buckets:
    image: minio/mc:latest
    container_name: minio-create-buckets
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 5;
      /usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin123;
      /usr/bin/mc mb myminio/santekene-documents --ignore-existing;
      /usr/bin/mc anonymous set download myminio/santekene-documents;
      exit 0;
      "
```

#### **2. Démarrer MinIO**

```bash
docker-compose -f docker-compose.minio.yml up -d
```

#### **3. Vérifier que MinIO fonctionne**

- **API MinIO** : http://localhost:9000
- **Console Web** : http://localhost:9001
  - User: `minioadmin`
  - Password: `minioadmin123`

#### **4. Créer le bucket `santekene-documents`**

Si le bucket n'a pas été créé automatiquement :

```bash
# Installer MinIO Client
docker exec -it minio-santekene mc alias set myminio http://localhost:9000 minioadmin minioadmin123

# Créer le bucket
docker exec -it minio-santekene mc mb myminio/santekene-documents

# Définir la politique (lecture publique pour vérification)
docker exec -it minio-santekene mc anonymous set download myminio/santekene-documents
```

---

### **Option 2 : Installation Locale (Windows)**

#### **1. Télécharger MinIO**

```powershell
# Télécharger MinIO Server
Invoke-WebRequest -Uri "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" -OutFile "C:\minio\minio.exe"
```

#### **2. Créer le dossier de données**

```powershell
New-Item -Path "C:\minio\data" -ItemType Directory -Force
```

#### **3. Démarrer MinIO**

```powershell
cd C:\minio
.\minio.exe server C:\minio\data --console-address ":9001"
```

#### **4. Accéder à la console**

- **Console Web** : http://localhost:9001
- **User** : Affiché dans le terminal (minioadmin par défaut)
- **Password** : Affiché dans le terminal

#### **5. Créer le bucket via la console**

1. Se connecter à http://localhost:9001
2. Aller dans "Buckets"
3. Cliquer "Create Bucket"
4. Nom : `santekene-documents`
5. Cliquer "Create"

---

### **Option 3 : Installation Linux**

#### **1. Télécharger MinIO**

```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/
```

#### **2. Créer utilisateur et dossier**

```bash
sudo useradd -r minio-user -s /sbin/nologin
sudo mkdir -p /mnt/minio-data
sudo chown minio-user:minio-user /mnt/minio-data
```

#### **3. Créer service systemd**

Créer `/etc/systemd/system/minio.service` :

```ini
[Unit]
Description=MinIO
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target

[Service]
User=minio-user
Group=minio-user
Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=minioadmin123"
ExecStart=/usr/local/bin/minio server /mnt/minio-data --console-address ":9001"
Restart=always
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

#### **4. Démarrer le service**

```bash
sudo systemctl daemon-reload
sudo systemctl enable minio
sudo systemctl start minio
sudo systemctl status minio
```

---

## ⚙️ Configuration Backend

### **Variables d'Environnement**

Ajouter dans `backend-api/.env` :

```bash
# ==================== MinIO Configuration ====================
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=santekene-documents

# Alternative : AWS S3 (Production)
# MINIO_ENDPOINT=s3.amazonaws.com
# MINIO_PORT=443
# MINIO_USE_SSL=true
# MINIO_ACCESS_KEY=YOUR_AWS_ACCESS_KEY
# MINIO_SECRET_KEY=YOUR_AWS_SECRET_KEY
# MINIO_BUCKET_NAME=santekene-prod-documents
# MINIO_REGION=eu-west-1

# Stockage local de secours (si MinIO indisponible)
LOCAL_STORAGE_PATH=./uploads
```

### **Installer le SDK MinIO**

```bash
cd backend-api
npm install minio
npm install --save-dev @types/minio
```

---

## 🧪 Tests de Vérification

### **Test 1 : MinIO est accessible**

```bash
curl http://localhost:9000/minio/health/live
```

**Réponse attendue** : HTTP 200

### **Test 2 : Console Web accessible**

Ouvrir http://localhost:9001 dans un navigateur

### **Test 3 : Bucket existe**

```bash
# Via Docker
docker exec -it minio-santekene mc ls myminio/

# Doit afficher : santekene-documents/
```

### **Test 4 : Upload un fichier de test**

```bash
# Créer un fichier de test
echo "Test MinIO" > test.txt

# Upload via MinIO Client
docker exec -i minio-santekene mc cp - myminio/santekene-documents/test.txt < test.txt

# Vérifier
docker exec -it minio-santekene mc ls myminio/santekene-documents/
```

---

## 🔒 Sécurité (Production)

### **1. Changer les credentials par défaut**

Dans `docker-compose.minio.yml` ou `.env` :

```yaml
environment:
  MINIO_ROOT_USER: your-secure-username
  MINIO_ROOT_PASSWORD: your-very-secure-password-min-8-chars
```

### **2. Activer HTTPS**

```bash
# Générer certificat SSL
minio server /data --certs-dir /path/to/certs
```

### **3. Configurer les politiques IAM**

```bash
# Créer un utilisateur dédié pour l'application
mc admin user add myminio santekene-app SecurePassword123!

# Créer une politique
cat > santekene-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::santekene-documents/*"
      ]
    }
  ]
}
EOF

# Appliquer la politique
mc admin policy create myminio santekene-policy santekene-policy.json
mc admin policy attach myminio santekene-policy --user santekene-app
```

---

## 📊 Monitoring

### **Logs MinIO**

```bash
# Voir les logs
docker logs -f minio-santekene

# Ou sur Linux
journalctl -u minio -f
```

### **Métriques**

MinIO expose des métriques Prometheus sur `/minio/v2/metrics/cluster`

```bash
curl http://localhost:9000/minio/v2/metrics/cluster
```

---

## 🔄 Backup & Restore

### **Backup**

```bash
# Backup du bucket complet
mc mirror myminio/santekene-documents /backup/minio/santekene-documents

# Ou avec rsync
rsync -av ./minio-data/ /backup/minio-data/
```

### **Restore**

```bash
# Restaurer depuis backup
mc mirror /backup/minio/santekene-documents myminio/santekene-documents
```

---

## 🚀 Passage en Production (AWS S3)

### **Avantages de AWS S3** :
- ✅ Haute disponibilité (99.99%)
- ✅ Scalabilité illimitée
- ✅ Coûts faibles (~$0.023/GB/mois)
- ✅ Backups automatiques
- ✅ CDN CloudFront intégré

### **Configuration AWS S3**

1. **Créer un bucket S3** sur AWS Console
2. **Créer un utilisateur IAM** avec accès S3
3. **Obtenir les credentials** (Access Key + Secret Key)
4. **Modifier `.env`** :

```bash
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=YOUR_AWS_ACCESS_KEY
MINIO_SECRET_KEY=YOUR_AWS_SECRET_KEY
MINIO_BUCKET_NAME=santekene-prod-documents
MINIO_REGION=eu-west-1
```

Le code reste **identique** car MinIO est compatible S3 !

---

## 📋 Checklist d'Installation

### Développement
- [ ] MinIO installé (Docker ou local)
- [ ] MinIO démarré sur port 9000
- [ ] Console accessible sur port 9001
- [ ] Bucket `santekene-documents` créé
- [ ] Variables `.env` configurées
- [ ] SDK `minio` installé

### Production
- [ ] Credentials sécurisés (pas minioadmin)
- [ ] HTTPS activé
- [ ] Politique IAM configurée
- [ ] Backup automatique configuré
- [ ] Monitoring activé
- [ ] AWS S3 considéré

---

**MinIO prêt pour l'intégration ! 🚀**

