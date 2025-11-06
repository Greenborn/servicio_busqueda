# 🚀 Guía Rápida de Inicio

Esta es una guía condensada para poner en marcha el servicio rápidamente.

## ⚡ Inicio Rápido (5 minutos)

### 1. Instalar Typesense con Docker

```bash
docker run -d -p 8108:8108 \
  -v/tmp/typesense-data:/data \
  typesense/typesense:0.25.1 \
  --data-dir /data \
  --api-key=xyz \
  --enable-cors
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
nano .env  # Edita con tus credenciales de MySQL
```

**Variables mínimas requeridas:**
```env
mysql_host=localhost
mysql_user=tu_usuario
mysql_password=tu_password
mysql_database=tu_database
table_name=tu_tabla
table_text_f=campo_texto
table_id_f=campo_id
typesense_api_key=xyz
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Iniciar el Servidor

```bash
npm start
```

## 🧪 Probar los Endpoints

### Autocompletado
```bash
curl "http://localhost:3000/autocomplete?q=test"
```

### Búsqueda
```bash
curl "http://localhost:3000/search?q=test"
```

## ✅ Verificación

Si ves estos mensajes, todo está funcionando:
```
Servidor escuchando en: 3000
Colección de Typesense creada: search_items
Sincronizados X de X registros en Typesense
Sistema de búsqueda inicializado correctamente
```

## 📚 Documentación Completa

Para más detalles, consulta el archivo `README.md`

## ❓ Problemas Comunes

### Typesense no conecta
```bash
# Verifica que esté corriendo
curl http://localhost:8108/health
```

### MySQL no conecta
```bash
# Prueba la conexión
mysql -u tu_usuario -p -h localhost
```

### Puerto 3000 ocupado
Cambia `service_port_api` en `.env` a otro puerto (ej: 3001)

## 🎯 Próximos Pasos

1. Revisa la documentación completa en `README.md`
2. Personaliza la configuración según tus necesidades
3. Integra los endpoints en tu aplicación frontend
4. Considera configurar HTTPS para producción

---

**¡Listo para buscar! 🔍**
