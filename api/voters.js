import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const VOTERS = [
  "Ainhoa Janices",
  "Aixa Gonzalez",
  "Alba Cacheda González",
  "Alejandro Martinez Recio",
  "Almudena Adalia Calvo",
  "Amparo Moroño Díaz",
  "Ana Folguera de la Cámara",
  "Ana María Mansilla Castaño",
  "Ángela Bueno",
  "Ángela Bueno Harris",
  "Arantza Martínez Eguia",
  "Beatriz Martins Orozco",
  "Belén Soto Cachinero",
  "Carlos Almela",
  "Christian Fernandez Mirón",
  "Clara Harguindey",
  "Costa Badía",
  "Cristina de la Casa",
  "Daniel Pecharroman",
  "Dolors Juarez",
  "Efraín Rodriguez",
  "Elena Saenz de Urturi",
  "Esther San Vicente - Al fresco Museos Efímeros",
  "Eva Morales Gomez",
  "Inés Aparicio",
  "Jara Blanco Aguilar",
  "Jesus Morate Roldán",
  "Juan Cubillas Cerezo",
  "Julián Etienne",
  "Laura Díaz",
  "Laura Hernando",
  "Laura Isabel Diaz",
  "Laura Szwarc",
  "Luis Lanchares",
  "LuisCar Molina",
  "Manuela Pedrón",
  "Mar Saenz - Baivén",
  "Margarida Colaço",
  "María Pavón Lopez",
  "Mariana Quinteira",
  "Miren Muñoz Vitoria",
  "Paloma Monleón",
  "Patheny Buitrago",
  "Pilar Álvarez Garcia",
  "Sara Buraya",
  "Sara de Fontecha García",
  "Sara Martín Terceño",
  "Sergio (checho) Tamayo",
  "Susana Galarreta",
  "Verónica Espinosa",
  "Virginia Alonso",
  "Ximena Rios",
  "Yolanda Riquelme García",
  "youssoupha Sock",
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
      range: "Votos!B2:B",
    });

    const rows = response.data.values || [];
    const alreadyVoted = new Set(rows.flat().filter(Boolean));

    res.json({ voters: VOTERS, alreadyVoted: [...alreadyVoted] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cargar datos" });
  }
}