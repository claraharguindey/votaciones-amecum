# Votaciones AMECUM

Formulario de votaciones para junta directiva. Stack: Vercel (serverless) + Google Sheets.

---

## Estructura

```
votaciones/
├── api/
│   ├── voters.js     → devuelve lista de socias y quién ya votó
│   └── vote.js       → guarda un voto en Google Sheets
├── public/
│   └── index.html    → el formulario
├── vercel.json
└── package.json
```

---

## 1. Crear la Google Sheet

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja nueva
2. Renombra la primera pestaña como **Votos**
3. En la fila 1 añade estas cabeceras:
   `Timestamp | Nombre | Presidencia | Secretaría | Tesorería`
4. Copia el **ID de la hoja** — es la parte larga de la URL:
   `https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit`

---

## 2. Crear una Google Service Account

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo (o usa uno existente)
3. Activa la API **Google Sheets API** (busca en "APIs y servicios")
4. Ve a **IAM y administración → Cuentas de servicio → Crear cuenta de servicio**
5. Dale un nombre cualquiera, pulsa continuar
6. En el paso de permisos no hace falta añadir nada, sigue adelante
7. Una vez creada, entra en la cuenta → pestaña **Claves** → **Añadir clave → JSON**
8. Se descargará un fichero `.json` — guárdalo bien, es tu credencial

9. **Comparte la Google Sheet** con el email de la service account
   (aparece en el JSON como `client_email`, algo como `nombre@proyecto.iam.gserviceaccount.com`)
   Dale permisos de **Editor**

---

## 3. Añadir las socias

Abre `api/voters.js` y reemplaza el array `VOTERS` con los nombres reales de las 40 socias:

```js
const VOTERS = [
  "Nombre Apellido",
  "Nombre Apellido",
  // ...
];
```

---

## 4. Desplegar en Vercel

### Primera vez

```bash
npm install -g vercel
vercel login
vercel
```

Sigue las instrucciones. Cuando pregunte por el directorio raíz, pon `.`

### Variables de entorno

En el dashboard de Vercel → tu proyecto → **Settings → Environment Variables**, añade:

| Nombre | Valor |
|--------|-------|
| `GOOGLE_SHEET_ID` | El ID de tu hoja (paso 1) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | El contenido completo del fichero `.json` descargado (paso 2) |

Después haz un redeploy:
```bash
vercel --prod
```

---

## 5. Dominio personalizado (votaciones.amecum.es)

1. En Vercel → **Settings → Domains** → añade `votaciones.amecum.es`
2. Vercel te dará un valor CNAME
3. Ve al panel DNS de donde tengáis el dominio amecum.es
4. Crea un registro:
   - Tipo: `CNAME`
   - Nombre: `votaciones`
   - Valor: el que te dio Vercel (algo como `cname.vercel-dns.com`)
5. En 5-10 minutos ya funciona con HTTPS automático

---

## Actualizar la lista de socias o candidaturas

Solo hay que editar `api/voters.js` y hacer `vercel --prod` de nuevo.