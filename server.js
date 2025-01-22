const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const stripe = require('stripe')('TU_SECRET_KEY_DE_STRIPE');  // Sustituye por tu clave secreta de Stripe

const app = express();
const PORT = 3000;

// Datos simulados de los números comprados
let purchasedNumbers = new Set();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Ruta para gestionar compras
app.post('/purchase', (req, res) => {
  const { number } = req.body;

  // Verificar si el número ya está comprado
  if (purchasedNumbers.has(number)) {
    return res.json({ success: false, message: "Este número ya está comprado." });
  }

  purchasedNumbers.add(number);
  console.log(`Número ${number} comprado.`);
  res.json({ success: true });
});

// Ruta para procesar pagos
app.post('/charge', async (req, res) => {
  const { token, number } = req.body;

  try {
    // Crear un cargo con Stripe
    const charge = await stripe.charges.create({
      amount: 200,  // 2€ = 200 centavos
      currency: 'eur',
      description: `Compra del número ${number} para la rifa`,
      source: token.id,
    });

    // Responder con éxito si el pago es procesado
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al procesar el pago' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
