require("dotenv").config({ path: '.env' })

//conexion a base de datos
let conn_obj = {
    host: process.env.mysql_host,
    port: process.env.mysql_port,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    database: process.env.mysql_database,
    supportBigNumbers: true,
    bigNumberStrings: true,
    typeCast: function (field, next) {
        if (field.type == "NEWDECIMAL") {
            var value = field.string();
            return (value === null) ? null : Number(value);
        }
        return next();
    }

}

global.knex = require('knex')({
    client: 'mysql2',
    connection: conn_obj,
    pool: { min: 0, max: 1000, "propagateCreateError": false }
});

// Configuración de Typesense
const Typesense = require('typesense');
const typesenseClient = new Typesense.Client({
    'nodes': [{
        'host': process.env.typesense_host || 'localhost',
        'port': process.env.typesense_port || '8108',
        'protocol': process.env.typesense_protocol || 'http'
    }],
    'apiKey': process.env.typesense_api_key,
    'connectionTimeoutSeconds': 2
});

const COLLECTION_NAME = process.env.typesense_collection_name || 'search_items';

let app_API = require('express')();
let server_API = require('http').Server(app_API);

//CORS
let cors_origin = process.env.cors_origin.split(' ')
let cors = require('cors')
let corsOptions = {
    credentials: true,
    origin: cors_origin
}
app_API.use(cors(corsOptions))

//FORMATEO
let bodyParser = require("body-parser")
app_API.use(bodyParser.json())

server_API.listen(process.env.service_port_api)
console.log('Servidor escuchando en: ',process.env.service_port_api)

let struc_busca = []

// Función para crear o actualizar la colección de Typesense
async function setupTypesenseCollection() {
    const schema = {
        'name': COLLECTION_NAME,
        'fields': [
            { 'name': 'id', 'type': 'string' },
            { 'name': 'texto', 'type': 'string' },
            { 'name': 'texto_lower', 'type': 'string', 'facet': false }
        ]
        // No se define default_sorting_field
    };

    try {
        // Intentar obtener la colección existente
        await typesenseClient.collections(COLLECTION_NAME).retrieve();
        console.log('Colección de Typesense ya existe:', COLLECTION_NAME);
    } catch (error) {
        // Si no existe, crearla
        if (error.httpStatus === 404) {
            try {
                await typesenseClient.collections().create(schema);
                console.log('Colección de Typesense creada:', COLLECTION_NAME);
            } catch (createError) {
                console.error('Error al crear colección de Typesense:', createError);
            }
        } else {
            console.error('Error al verificar colección de Typesense:', error);
        }
    }
}

// Función para sincronizar datos de MySQL a Typesense
async function syncDataToTypesense() {
    const TABLE = process.env.table_name;
    const TEXT_F = process.env.table_text_f;
    const T_ID_F = process.env.table_id_f;

    try {
        console.log('Sincronizando datos con Typesense...');
        const elementos = await global.knex(TABLE).select();

        if (elementos && elementos.length > 0) {
            // Preparar documentos para Typesense
            const documents = elementos.map(elem => ({
                'id': String(elem[T_ID_F]),
                'texto': elem[TEXT_F],
                'texto_lower': elem[TEXT_F].toLowerCase()
            }));

            // Importar documentos en lote
            const importResults = await typesenseClient.collections(COLLECTION_NAME)
                .documents()
                .import(documents, { action: 'upsert' });

            const successCount = importResults.filter(r => r.success === true).length;
            console.log(`Sincronizados ${successCount} de ${elementos.length} registros en Typesense`);
        } else {
            console.log('No hay datos para sincronizar');
        }
    } catch (error) {
        console.error('Error al sincronizar datos con Typesense:', error);
    }
}


// Endpoint de autocompletado: sugiere posibles términos de búsqueda usando Typesense
app_API.get('/autocomplete', async (req, res) => {
    console.log('/autocomplete');
    const TERM = req.query.q || '';
    
    if (!TERM) {
        return res.status(200).send({ items: [] });
    }

    try {
        // Buscar en Typesense con soporte para fuzzy search
        const searchParameters = {
            'q': TERM,
            'query_by': 'texto,texto_lower',
            'prefix': 'true,true',
            'num_typos': 2,
            'per_page': 10,
            'typo_tokens_threshold': 1
        };

        const searchResults = await typesenseClient.collections(COLLECTION_NAME)
            .documents()
            .search(searchParameters);

        // Extraer sugerencias únicas
        const items = searchResults.hits ? 
            [...new Set(searchResults.hits.map(hit => hit.document.texto))] : [];

        res.status(200).send({ items });
    } catch (error) {
        console.error('Error en Typesense autocomplete, usando MySQL como fallback:', error.message);
        
        // Fallback a MySQL si Typesense falla
        const TABLE = process.env.table_name;
        const TEXT_F = process.env.table_text_f;
        
        try {
            const rows = await global.knex(TABLE)
                .where(TEXT_F, 'like', `%${TERM}%`)
                .limit(10);
            
            const items = [...new Set(rows.map(r => r[TEXT_F]))];
            res.status(200).send({ items });
        } catch (dbError) {
            res.status(500).send({ 
                error: 'Error en autocompletado', 
                details: dbError.message 
            });
        }
    }
});

// Endpoint de búsqueda: devuelve todos los registros que coinciden con el término usando Typesense
app_API.get('/search', async (req, res) => {
    console.log('/search');
    const TERM = req.query.q || '';
    
    if (!TERM) {
        return res.status(200).send({ items: [] });
    }

    try {
        // Buscar en Typesense con búsqueda tolerante a errores
        const searchParameters = {
            'q': TERM,
            'query_by': 'texto,texto_lower',
            'prefix': 'false',
            'num_typos': 2,
            'per_page': 250,
            'sort_by': '_text_match:desc'
        };

        const searchResults = await typesenseClient.collections(COLLECTION_NAME)
            .documents()
            .search(searchParameters);

        // Mapear resultados de Typesense
        const items = searchResults.hits ? 
            searchResults.hits.map(hit => ({
                id: parseInt(hit.document.id),
                texto: hit.document.texto
            })) : [];

        res.status(200).send({ items });
    } catch (error) {
        console.error('Error en Typesense search, usando MySQL como fallback:', error.message);
        
        // Fallback a MySQL si Typesense falla
        const TABLE = process.env.table_name;
        const TEXT_F = process.env.table_text_f;
        const T_ID_F = process.env.table_id_f;
        
        try {
            const rows = await global.knex(TABLE)
                .where(TEXT_F, 'like', `%${TERM}%`)
                .select(T_ID_F + ' as id', TEXT_F + ' as texto');
            
            res.status(200).send({ items: rows });
        } catch (dbError) {
            res.status(500).send({ 
                error: 'Error en búsqueda', 
                details: dbError.message 
            });
        }
    }
});

// Inicialización: configurar Typesense y sincronizar datos
setTimeout(async () => {
    const TABLE = process.env.table_name;
    const TEXT_F = process.env.table_text_f;
    const T_ID_F = process.env.table_id_f;

    // Configurar colección de Typesense
    await setupTypesenseCollection();
    
    // Sincronizar datos de MySQL a Typesense
    await syncDataToTypesense();

    // Generar estructura de autocompletado en memoria (opcional, como backup)
    console.log('Consultando registros para estructura de autocompletado en memoria');
    let elementos = await global.knex(TABLE).select();

    if (elementos) {
        console.log('Generando estructura de autocompletado en memoria');
        for (let i = 0; i < elementos.length; i++) {
            const palabra = elementos[i][TEXT_F];
            
            for (let j = 0; j < palabra.length; j++) {
                const caracter = palabra[j];
                
                if (!struc_busca[j])
                    struc_busca[j] = {};

                if (!struc_busca[j][caracter])
                    struc_busca[j][caracter] = [];
                
                struc_busca[j][caracter].push(elementos[i]);
            }
        }

        console.log('Estructura de autocompletado en memoria generada:', struc_busca.length);
    }

    console.log('Sistema de búsqueda inicializado correctamente');
}, 1000);