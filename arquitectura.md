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
- Expone un endpoint `/autocomplete` que responde a peticiones GET.
- Al iniciar, el servidor consulta la tabla configurada y genera una estructura en memoria para autocompletado.
- El endpoint `/autocomplete` espera un parámetro de consulta `q` y responde con sugerencias (actualmente vacío, requiere implementación).

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
