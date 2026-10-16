import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const FECHAS = [
  "Martes 3 de noviembre 19:00-20:00",
  "Lunes 16 de noviembre 18:30-19:30",
];

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Votos!C2:G",
    });
    const rows = response.data.values || [];
    const conteos = FECHAS.map((fecha, i) => ({
      fecha,
      votos: rows.filter(row => row[i] === "Sí").length,
    }));
    res.json(conteos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cargar resultados" });
  }
}