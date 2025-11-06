# Arquitectura Técnica y Guía de Replicación

Este documento describe los pasos y requisitos técnicos para replicar el proyecto `servicio_busqueda`.

> **✅ IMPLEMENTACIÓN COMPLETADA:** Todas las funcionalidades descritas en este documento han sido implementadas. Consulta el archivo `README.md` para instrucciones detalladas de uso.

## 1. Requisitos del entorno

- Node.js >= 14.x
- npm >= 6.x
- MySQL (o compatible)

## 2. Instalación de dependencias

Ejecuta en la raíz del proyecto:

```bash
npm install
```

## 3. Variables de entorno necesarias

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido (ajusta los valores según tu entorno):

```
mysql_host=localhost
mysql_port=3306
mysql_user=usuario
mysql_password=contraseña
mysql_database=nombre_db
service_port_api=3000
cors_origin=http://localhost:3000
# Nombre de la tabla y campos para autocompletado
# Ejemplo:
table_name=palabras
table_text_f=texto
table_id_f=id
```



## 4. Estructura y funcionamiento

### Uso de Typesense

El sistema utiliza [Typesense](https://typesense.org/) como motor de búsqueda full-text para mejorar la velocidad y relevancia de las búsquedas y sugerencias de autocompletado. Typesense se integra como un servicio adicional, indexando los datos de la base de datos y permitiendo consultas rápidas y tolerantes a errores tipográficos.

- **Ventajas:**
	- Búsqueda en tiempo real y autocompletado eficiente.
	- Soporte para tolerancia a errores (fuzzy search).
	- Fácil integración con Node.js mediante SDK oficial.
- **Consideraciones:**
	- Es necesario tener un servidor Typesense corriendo y accesible desde el backend.
	- Los datos deben sincronizarse entre MySQL y Typesense (por ejemplo, al crear o actualizar registros).

La lógica de los endpoints `/autocomplete` y `/search` puede consultar primero Typesense para obtener resultados relevantes y, si es necesario, complementar con la base de datos MySQL.

El servidor está implementado en `server.js` usando Express.
Se conecta a una base de datos MySQL usando Knex y a un clúster Typesense para búsquedas rápidas.
Expone dos endpoints principales:
	- `/autocomplete`: sugiere posibles términos de búsqueda (autocompletado) usando Typesense.
	- `/search`: devuelve todos los registros que coinciden con el término de búsqueda, priorizando resultados de Typesense.
Al iniciar, el servidor puede sincronizar los datos de la tabla configurada con Typesense y generar una estructura en memoria para autocompletado si es necesario.

### Endpoint de sugerencias de autocompletado

- **Ruta:** `/autocomplete`
- **Método:** GET
- **Parámetros:**
	- `q` (query param, obligatorio): término parcial para sugerencias (urlencoded)

#### Ejemplo de request

```
GET http://localhost:3000/autocomplete?q=ejem
```

#### Ejemplo de response

```json
{
	"items": [
		"ejemplo",
		"ejemplo2"
	]
}
```

- El endpoint retorna un array de strings con posibles términos de búsqueda que contienen el texto ingresado y que entregarían al menos un resultado.
- Si no hay coincidencias, retorna un array vacío en `items`.

### Endpoint de búsqueda

- **Ruta:** `/search`
- **Método:** GET
- **Parámetros:**
	- `q` (query param, obligatorio): término de búsqueda (urlencoded)

#### Ejemplo de request

```
GET http://localhost:3000/search?q=ejemplo
```

#### Ejemplo de response

```json
{
	"items": [
		{
			"id": 1,
			"texto": "ejemplo"
		},
		...
	]
}
```

- El endpoint retorna un array de objetos que contienen los resultados coincidentes con el término de búsqueda.
- Si no hay coincidencias, retorna un array vacío en `items`.
## 5. Ejecución del servidor

Para desarrollo (con recarga automática usando nodemon):

```bash
npm start
```

O para producción:

```bash
node server.js
```

El servidor escuchará en el puerto definido por `service_port_api`.

## 6. Notas adicionales

- Asegúrate de que la base de datos y la tabla estén creadas y pobladas antes de iniciar el servidor.
- Las dependencias principales están en `package.json`.
- El endpoint `/autocomplete` puede ser extendido para retornar sugerencias basadas en la consulta recibida.
