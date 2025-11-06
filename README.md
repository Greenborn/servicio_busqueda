# Servicio de Búsqueda con Typesense

Servicio de búsqueda y autocompletado de alto rendimiento que utiliza **Typesense** como motor de búsqueda full-text y **MySQL** como base de datos principal. Proporciona capacidades de búsqueda tolerante a errores tipográficos (fuzzy search) y autocompletado en tiempo real.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Ejemplos de Uso](#-ejemplos-de-uso)
- [Arquitectura](#-arquitectura)
- [Solución de Problemas](#-solución-de-problemas)

## 🚀 Características

- **Búsqueda Full-Text Ultra Rápida**: Utiliza Typesense para búsquedas en milisegundos
- **Búsqueda Tolerante a Errores**: Soporta errores tipográficos (fuzzy search)
- **Autocompletado en Tiempo Real**: Sugerencias instantáneas mientras el usuario escribe
- **Fallback Automático**: Si Typesense no está disponible, usa MySQL como respaldo
- **Sincronización Automática**: Los datos de MySQL se sincronizan automáticamente con Typesense
- **CORS Habilitado**: Listo para ser consumido desde aplicaciones frontend
- **Fácil Configuración**: Todo configurable mediante variables de entorno

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 14.x
- **npm** >= 6.x
- **MySQL** (versión 5.7 o superior, o MariaDB compatible)
- **Typesense Server** (versión 0.23.0 o superior)

### Instalación de Typesense

Hay varias formas de instalar Typesense:

#### Opción 1: Docker (Recomendado para desarrollo)

```bash
docker run -d -p 8108:8108 \
  -v/tmp/typesense-data:/data \
  typesense/typesense:0.25.1 \
  --data-dir /data \
  --api-key=xyz \
  --enable-cors
```

#### Opción 2: Docker Compose

Crea un archivo `docker-compose.yml`:

```yaml
version: '3.8'
services:
  typesense:
    image: typesense/typesense:0.25.1
    ports:
      - "8108:8108"
    volumes:
      - ./typesense-data:/data
    command: '--data-dir /data --api-key=xyz --enable-cors'
    restart: unless-stopped
```

Luego ejecuta:

```bash
docker-compose up -d
```

#### Opción 3: Instalación Nativa

Sigue la [guía oficial de instalación](https://typesense.org/docs/guide/install-typesense.html) para tu sistema operativo.

## 🔧 Instalación

1. **Clona el repositorio**:

```bash
git clone https://github.com/Greenborn/servicio_busqueda.git
cd servicio_busqueda
```

2. **Instala las dependencias**:

```bash
npm install
```

3. **Configura las variables de entorno** (ver siguiente sección)

4. **Prepara tu base de datos MySQL** con una tabla que contenga los datos a buscar.

## ⚙️ Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
# Configuración de MySQL
mysql_host=localhost
mysql_port=3306
mysql_user=tu_usuario
mysql_password=tu_contraseña
mysql_database=tu_base_datos

# Configuración del Servicio
service_port_api=3000
cors_origin=http://localhost:3000 http://localhost:5173

# Configuración de la Tabla de Búsqueda
table_name=palabras
table_text_f=texto
table_id_f=id

# Configuración de Typesense
typesense_host=localhost
typesense_port=8108
typesense_protocol=http
typesense_api_key=xyz
typesense_collection_name=search_items
```

### 2. Descripción de las Variables

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `mysql_host` | Host del servidor MySQL | `localhost` |
| `mysql_port` | Puerto de MySQL | `3306` |
| `mysql_user` | Usuario de MySQL | `root` |
| `mysql_password` | Contraseña de MySQL | `mipassword` |
| `mysql_database` | Nombre de la base de datos | `mi_base_datos` |
| `service_port_api` | Puerto donde correrá el servicio | `3000` |
| `cors_origin` | Orígenes permitidos para CORS (separados por espacio) | `http://localhost:3000` |
| `table_name` | Nombre de la tabla a buscar | `palabras` |
| `table_text_f` | Campo de texto en la tabla | `texto` |
| `table_id_f` | Campo ID en la tabla | `id` |
| `typesense_host` | Host del servidor Typesense | `localhost` |
| `typesense_port` | Puerto de Typesense | `8108` |
| `typesense_protocol` | Protocolo (http/https) | `http` |
| `typesense_api_key` | API Key de Typesense | `xyz` |
| `typesense_collection_name` | Nombre de la colección en Typesense | `search_items` |

### 3. Estructura de la Tabla MySQL

Tu tabla MySQL debe tener al menos dos campos:

```sql
CREATE TABLE palabras (
  id INT PRIMARY KEY AUTO_INCREMENT,
  texto VARCHAR(255) NOT NULL,
  -- Otros campos opcionales...
  INDEX idx_texto (texto)
);
```

Ejemplo de datos:

```sql
INSERT INTO palabras (texto) VALUES 
  ('ejemplo'),
  ('ejemplo de texto'),
  ('prueba'),
  ('prueba de concepto'),
  ('búsqueda rápida');
```

## 🎮 Uso

### Iniciar el Servidor

#### Modo Desarrollo (con auto-recarga):

```bash
npm start
```

#### Modo Producción:

```bash
node server.js
```

### Verificar que el Servidor está Corriendo

Deberías ver mensajes como:

```
Servidor escuchando en: 3000
Colección de Typesense creada: search_items
Sincronizando datos con Typesense...
Sincronizados 100 de 100 registros en Typesense
Sistema de búsqueda inicializado correctamente
```

## 📡 API Endpoints

### 1. Autocompletado

Obtiene sugerencias de búsqueda basadas en un término parcial.

**Endpoint:** `GET /autocomplete`

**Parámetros:**
- `q` (query parameter, requerido): Término parcial para autocompletar

**Características:**
- Búsqueda con prefijo
- Tolerante a 2 errores tipográficos
- Retorna máximo 10 sugerencias únicas
- Fallback automático a MySQL si Typesense falla

**Ejemplo de Request:**

```bash
curl "http://localhost:3000/autocomplete?q=ejem"
```

**Ejemplo de Response:**

```json
{
  "items": [
    "ejemplo",
    "ejemplo de texto"
  ]
}
```

### 2. Búsqueda

Realiza una búsqueda completa y retorna todos los registros coincidentes.

**Endpoint:** `GET /search`

**Parámetros:**
- `q` (query parameter, requerido): Término de búsqueda

**Características:**
- Búsqueda full-text
- Tolerante a 2 errores tipográficos
- Ordenado por relevancia
- Retorna hasta 250 resultados
- Fallback automático a MySQL si Typesense falla

**Ejemplo de Request:**

```bash
curl "http://localhost:3000/search?q=ejemplo"
```

**Ejemplo de Response:**

```json
{
  "items": [
    {
      "id": 1,
      "texto": "ejemplo"
    },
    {
      "id": 2,
      "texto": "ejemplo de texto"
    }
  ]
}
```

## 💡 Ejemplos de Uso

### Usando cURL

```bash
# Autocompletado
curl "http://localhost:3000/autocomplete?q=prue"

# Búsqueda
curl "http://localhost:3000/search?q=prueba"

# Con términos que contienen espacios (URL encoded)
curl "http://localhost:3000/search?q=prueba%20concepto"
```

### Usando JavaScript (Fetch API)

```javascript
// Autocompletado
async function autocomplete(term) {
  const response = await fetch(
    `http://localhost:3000/autocomplete?q=${encodeURIComponent(term)}`
  );
  const data = await response.json();
  return data.items;
}

// Búsqueda
async function search(query) {
  const response = await fetch(
    `http://localhost:3000/search?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  return data.items;
}

// Uso
autocomplete('ejem').then(suggestions => {
  console.log('Sugerencias:', suggestions);
});

search('ejemplo').then(results => {
  console.log('Resultados:', results);
});
```

### Usando Axios (Node.js o Browser)

```javascript
const axios = require('axios');

// Autocompletado
async function autocomplete(term) {
  try {
    const response = await axios.get('http://localhost:3000/autocomplete', {
      params: { q: term }
    });
    return response.data.items;
  } catch (error) {
    console.error('Error en autocompletado:', error);
    return [];
  }
}

// Búsqueda
async function search(query) {
  try {
    const response = await axios.get('http://localhost:3000/search', {
      params: { q: query }
    });
    return response.data.items;
  } catch (error) {
    console.error('Error en búsqueda:', error);
    return [];
  }
}
```

### Integración con React

```jsx
import React, { useState, useEffect } from 'react';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);

  // Autocompletado mientras el usuario escribe
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const response = await fetch(
        `http://localhost:3000/autocomplete?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSuggestions(data.items);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [query]);

  // Búsqueda al presionar Enter
  const handleSearch = async (e) => {
    e.preventDefault();
    const response = await fetch(
      `http://localhost:3000/search?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    setResults(data.items);
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar..."
        />
        <button type="submit">Buscar</button>
      </form>

      {/* Sugerencias de autocompletado */}
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((suggestion, index) => (
            <li 
              key={index}
              onClick={() => setQuery(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      {/* Resultados de búsqueda */}
      <div className="results">
        {results.map((result) => (
          <div key={result.id}>
            <p>{result.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchComponent;
```

## 🏗️ Arquitectura

### Flujo de Datos

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ HTTP Request
       │
┌──────▼──────────────────┐
│   Express Server        │
│  (Node.js + Express)    │
└──────┬──────────────────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
┌──────▼────┐  ┌──────▼────┐  ┌─────▼─────┐
│ Typesense │  │   MySQL   │  │   CORS    │
│  (Search) │  │  (Data)   │  │ Middleware│
└───────────┘  └───────────┘  └───────────┘
```

### Componentes

1. **Express Server**: Servidor HTTP que expone los endpoints de la API
2. **Typesense**: Motor de búsqueda full-text para consultas rápidas
3. **MySQL**: Base de datos principal que almacena los datos
4. **Knex.js**: Query builder para interactuar con MySQL
5. **CORS Middleware**: Permite peticiones desde diferentes orígenes

### Proceso de Inicialización

1. El servidor se conecta a MySQL
2. Se inicializa el cliente de Typesense
3. Se crea o verifica la colección en Typesense
4. Se sincronizan todos los datos de MySQL a Typesense
5. Se genera una estructura de autocompletado en memoria (backup)
6. El servidor queda listo para recibir peticiones

### Flujo de Búsqueda

1. Cliente envía petición a `/search` o `/autocomplete`
2. El servidor intenta buscar en Typesense
3. Si Typesense responde, se retornan los resultados
4. Si Typesense falla, se usa MySQL como fallback
5. Los resultados se retornan al cliente en formato JSON

## 🔍 Solución de Problemas

### El servidor no inicia

**Error:** `Error: connect ECONNREFUSED`

**Solución:** Verifica que MySQL y Typesense estén corriendo:

```bash
# Verificar MySQL
mysql -u tu_usuario -p

# Verificar Typesense (con Docker)
docker ps | grep typesense

# O verificar el puerto
curl http://localhost:8108/health
```

### Error de conexión a Typesense

**Error:** `Error al sincronizar datos con Typesense`

**Soluciones:**

1. Verifica que Typesense esté corriendo:
```bash
curl http://localhost:8108/health
```

2. Verifica la API key en el archivo `.env`

3. Verifica que el puerto sea el correcto (por defecto 8108)

### No se sincronizan los datos

**Problema:** La colección de Typesense está vacía

**Soluciones:**

1. Verifica que la tabla MySQL tenga datos:
```sql
SELECT COUNT(*) FROM tu_tabla;
```

2. Revisa los logs del servidor al iniciar

3. Elimina y recrea la colección:
```bash
# Usando cURL
curl -X DELETE "http://localhost:8108/collections/search_items?x-typesense-api-key=xyz"
```

4. Reinicia el servidor para que sincronice nuevamente

### Problemas de CORS

**Error:** `Access to fetch has been blocked by CORS policy`

**Solución:** Agrega el origen de tu aplicación frontend a `cors_origin` en `.env`:

```env
cors_origin=http://localhost:3000 http://localhost:5173 https://mi-dominio.com
```

### La búsqueda no encuentra resultados

**Problemas comunes:**

1. **Verifica que los datos estén en Typesense:**
```bash
curl "http://localhost:8108/collections/search_items/documents/search?q=*&x-typesense-api-key=xyz"
```

2. **Prueba con términos más simples**

3. **Verifica que los nombres de campos sean correctos** en `.env`

### Rendimiento lento

**Si las búsquedas son lentas:**

1. Verifica que Typesense esté usando los índices correctos
2. Limita el número de resultados con `per_page`
3. Considera aumentar los recursos del servidor Typesense
4. Revisa los logs de MySQL para consultas lentas

## 📚 Recursos Adicionales

- [Documentación de Typesense](https://typesense.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Knex.js Documentation](https://knexjs.org/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request en el repositorio.

## 📄 Licencia

ISC

## 👤 Autor

[Greenborn](https://github.com/Greenborn)

---

**¿Necesitas ayuda?** Abre un issue en el [repositorio](https://github.com/Greenborn/servicio_busqueda/issues)
