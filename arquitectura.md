# Arquitectura Técnica y Guía de Replicación

Este documento describe los pasos y requisitos técnicos para replicar el proyecto `servicio_busqueda`.

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

- El servidor está implementado en `server.js` usando Express.
- Se conecta a una base de datos MySQL usando Knex.
- Expone dos endpoints principales:
	- `/autocomplete`: sugiere posibles términos de búsqueda (autocompletado).
	- `/search`: devuelve todos los registros que coinciden con el término de búsqueda.
- Al iniciar, el servidor consulta la tabla configurada y genera una estructura en memoria para autocompletado.

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
