const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_DIR = process.env.PROJECT_DOMAIN
  ? path.join(__dirname, '.data')        // Glitch persistent storage
  : path.join(__dirname, 'data');        // local dev
const DATA_FILE = path.join(DATA_DIR, 'participants.json');
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/participants', (req, res) => {
  res.json(readData());
});

app.post('/api/register', (req, res) => {
  const { name, year, dept, books } = req.body;
  if (!name || !year || !dept || !books)
    return res.status(400).json({ error: 'Please fill in all fields before registering.' });
  const participants = readData();
  if (participants.find(p => p.name.toLowerCase() === name.toLowerCase() && p.dept === dept))
    return res.status(400).json({ error: 'This name is already registered for this department.' });
  const participant = {
    id: Date.now() + '' + Math.random().toString(36).slice(2),
    name, year, dept, books,
    pages: [0, 0, 0, 0, 0, 0, 0]
  };
  participants.push(participant);
  writeData(participants);
  res.json({ success: true, participant });
});

app.patch('/api/participants/:id/pages', (req, res) => {
  const { pages } = req.body;
  const participants = readData();
  const p = participants.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Participant not found.' });
  p.pages = pages;
  writeData(participants);
  res.json({ success: true });
});

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) writeData([]);

app.listen(PORT, () => console.log(`Readathon server running on port ${PORT}`));
