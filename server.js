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

app_API.get('/autocomplete', (req, res) => {
    console.log('/autocomplete')//, req.body);

    const TERM = req.query.q

    let items = []
    return res.status(200).send({ "items": items });
})

setTimeout(async () => {
    const TABLE  = process.env.table_name
    const TEXT_F = process.env.table_text_f
    const T_ID_F = process.env.table_id_f

    console.log('Consultando registros autocompletado')
    let elementos = await global.knex(TABLE).select()

    if (elementos){
        console.log('Generando estructura de autocompletado')
        for (let i = 0; i < elementos.length; i++) {
            const palabra = elementos[i][TEXT_F]
            
            for (let j = 0; j < palabra.length; j++) {
                const caracter = palabra[j]
                
                if (!struc_busca[j])
                    struc_busca[j] = {}

                if (!struc_busca[j][caracter])
                    struc_busca[j][caracter] = []
                
                struc_busca[j][caracter].push(elementos[i])
            }
            
        }

        console.log('Estructura de autocompletado generada',struc_busca.length )
    }
}, 1000)