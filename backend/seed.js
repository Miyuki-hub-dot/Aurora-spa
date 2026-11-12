// Uso: npm run seed
// Carga los 3 planes iniciales y crea el usuario admin. Es seguro repetirlo:
// $setOnInsert solo crea lo que NO existe (no pisa cambios hechos desde el panel).
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Plan = require('./models/Plan');
const Admin = require('./models/Admin');

const planes = [
  { slug: 'duo', nombre: 'Plan Dúo Sereno', precio: 120000, personasTexto: '2 personas', maxPersonas: 2, duracion: '90 min',
    incluye: ['Masaje relajante 50 min (pareja)', 'Mascarilla facial de arcilla suave', 'Infusión de bienvenida'] },
  { slug: 'amigos', nombre: 'Plan Amigos en Calma', precio: 180000, personasTexto: '3-4 personas', maxPersonas: 4, duracion: '2 h', destacado: true,
    incluye: ['Masaje relajante 40 min por persona', 'Mascarilla facial + exfoliación suave', 'Ritual de respiración grupal'] },
  { slug: 'familia', nombre: 'Plan Familia Aurora', precio: 250000, personasTexto: 'hasta 5 personas', maxPersonas: 5, duracion: '2 h 30 min',
    incluye: ['Masaje relajante breve (25 min) por persona', 'Mascarillas suaves para toda la familia', 'Zona de descanso y aromaterapia'] }
];

async function main() {
  if (!process.env.ADMIN_PASSWORD) throw new Error('Define ADMIN_PASSWORD en tu .env');
  await mongoose.connect(process.env.MONGODB_URI);

  for (const p of planes) await Plan.updateOne({ slug: p.slug }, { $setOnInsert: p }, { upsert: true });

  const usuario = process.env.ADMIN_USER || 'admin';
  if (!(await Admin.exists({ usuario }))) {
    // El 10 es el "costo" del hash: más alto = más seguro pero más lento
    await Admin.create({ usuario, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10) });
    console.log(`✅ Admin "${usuario}" creado`);
  } else {
    console.log(`ℹ️ El admin "${usuario}" ya existía`);
  }
  console.log('✅ Planes cargados');
}

main().catch(e => { console.error('❌', e.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
