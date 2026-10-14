import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const FECHAS = [
  "Martes 3 de noviembre",
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
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { nombre, fechas } = req.body;

  if (!nombre || !fechas || !Array.isArray(fechas) || fechas.length === 0) {
    return res.status(400).json({ error: "Faltan campos" });
  }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Votos!B2:B",
    });

    const rows = existing.data.values || [];
    const alreadyVoted = rows.flat().filter(Boolean);

    if (alreadyVoted.includes(nombre)) {
      return res.status(409).json({ error: "Esta persona ya ha votado" });
    }

    const timestamp = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });

    const row = [
      timestamp,
      nombre,
      ...FECHAS.map(f => fechas.includes(f) ? "Sí" : "No"),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Votos!A:G",
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar el voto" });
  }
}