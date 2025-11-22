# Configuración de AWS S3 para Subida de Imágenes

Para que la subida de imágenes funcione correctamente en producción (y no se pierdan al reiniciar el servidor), hemos integrado AWS S3. Sigue estos pasos para configurarlo:

## Step 1: Crear Cuenta en AWS
Si no tienes una cuenta, regístrate en [aws.amazon.com](https://aws.amazon.com/). Te pedirán una tarjeta de crédito, pero S3 tiene una capa gratuita generosa.

## Step 2: Crear un Bucket S3
1. Ve a la consola de **S3**
2. Haz clic en **Create bucket**
3. **Bucket name**: `imagenes-tienda-silicon-trail` (o el nombre que prefieras)
4. **Region**: `sa-east-1` (São Paulo - la más cercana a Chile)
5. Haz clic en **Create bucket**

## Step 3: Configurar IAM User y Access Keys
1. Ve a **IAM** (Identity and Access Management)
2. En el menú lateral, haz clic en **Users**
3. Haz clic en **Create user**
4. Nombre: `s3-uploader` (o el que prefieras)
5. En "Set permissions", selecciona **Attach policies directly**
6. Busca y selecciona la política `AmazonS3FullAccess`
7. Haz clic en **Create user**
8. Una vez creado, haz clic en el usuario
9. Ve a la pestaña **Security credentials**
10. Bajo **Access keys**, haz clic en **Create access key**
11. Selecciona **Application running outside AWS**
12. Click **Next** y luego **Create access key**
13. **IMPORTANTE**: Guarda el **Access Key ID** y **Secret Access Key** (no podrás verlo de nuevo)

## Step 4: Configurar Bucket Policy para Acceso Público

Para que las imágenes sean públicamente accesibles, necesitas configurar una política de bucket:

1. Ve a tu bucket S3 (`imagenes-tienda-silicon-trail`)
2. Click en la pestaña **"Permissions"**
3. Bajo **"Block public access (bucket settings)"**, haz clic en **"Edit"**
4. **Desmarca** "Block all public access"
5. Haz clic en **"Save changes"**
6. Confirma escribiendo "confirm"
7. Baja a **"Bucket policy"** y haz clic en **"Edit"**
8. Pega la siguiente política (reemplaza `imagenes-tienda-silicon-trail` con tu nombre de bucket si es diferente):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::imagenes-tienda-silicon-trail/*"
    }
  ]
}
```

9. Haz clic en **"Save changes"**

## Step 5: Configurar Variables de Entorno

Abre tu archivo `.env` en la raíz del proyecto y agrega/verifica las siguientes líneas:

```env
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY_ID_AQUI
AWS_SECRET_ACCESS_KEY=TU_SECRET_ACCESS_KEY_AQUI
AWS_REGION=sa-east-1
AWS_BUCKET_NAME=imagenes-tienda-silicon-trail
```

## Step 6: Reiniciar el Servidor

Una vez guardado el archivo `.env`, reinicia tu servidor:
```bash
# Detener el servidor actual (Ctrl+C)
# Luego ejecutar:
npm run dev:all
```

## Troubleshooting

### Error: "No se pudo subir la imagen"

Si ves este error, revisa los logs del servidor para más detalles. Los errores comunes son:

1. **AccessDenied**: Tu IAM user no tiene permisos. Verifica que tenga la política `AmazonS3FullAccess`.
2. **AccessControlListNotSupported**: El bucket tiene ACLs bloqueados. Esto ya está resuelto en el código (no usamos ACLs).
3. **NoSuchBucket**: El nombre del bucket en `.env` no coincide con el bucket real.
4. **InvalidAccessKeyId**: Las credenciales en `.env` no son correctas.

### Verificar que funciona

Después de reiniciar el servidor:
1. Abre la consola del navegador (F12)
2. Ve al seller dashboard y crea/edita un producto
3. Intenta subir una imagen
4. En la consola del servidor deberías ver mensajes como:
   ```
   [S3 Upload] Starting upload to S3...
   [S3 Upload] Bucket: imagenes-tienda-silicon-trail
   [S3 Upload] Region: sa-east-1
   [S3 Upload] File name: xxxxx-imagen.jpg
   [S3 Upload] Upload successful
   [S3 Upload] Image URL: https://...
   ```

¡Listo! Ahora las imágenes que subas se guardarán en Amazon S3 y estarán disponibles públicamente.
