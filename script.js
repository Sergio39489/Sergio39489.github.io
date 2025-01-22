document.addEventListener("DOMContentLoaded", () => {
  const countdownElement = document.getElementById("countdown");
  const grid = document.getElementById("number-grid");
  const paymentForm = document.getElementById("payment-form");
  const cardErrors = document.getElementById("card-errors");
  const stripe = Stripe("TU_PUBLIC_KEY_DE_STRIPE"); // Sustituye con tu clave pública de Stripe
  const elements = stripe.elements();
  const cardElement = elements.create("card");
  const raffleDuration = 10 * 24 * 60 * 60 * 1000; // 10 días en milisegundos
  const submitButton = document.getElementById("submit-button");

  let selectedNumber = null;

  // Obtén o establece el tiempo de finalización en localStorage
  let endTime = localStorage.getItem("raffleEndTime");

  if (!endTime) {
    // Si no existe, establece el tiempo actual + duración de la rifa
    endTime = Date.now() + raffleDuration;
    localStorage.setItem("raffleEndTime", endTime);
  } else {
    endTime = parseInt(endTime, 10);
  }

  // Función para actualizar el contador
  function updateCountdown() {
    const now = Date.now();
    const timeRemaining = endTime - now;

    if (timeRemaining <= 0) {
      countdownElement.textContent = "La rifa ha terminado.";
      disableAllButtons(); // Deshabilitar todos los botones
      return;
    }

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  // Actualiza el contador cada segundo
  const interval = setInterval(updateCountdown, 1000);
  updateCountdown();

  // Crear tabla de números del 0 al 100
  for (let i = 0; i <= 100; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.id = `number-${i}`;
    button.onclick = () => showPaymentForm(i);
    grid.appendChild(button);
  }

  // Deshabilitar todos los botones (cuando termina la rifa)
  function disableAllButtons() {
    const buttons = document.querySelectorAll("button");
    buttons.forEach((button) => (button.disabled = true));
  }

  // Mostrar el formulario de pago
  function showPaymentForm(number) {
    selectedNumber = number;
    paymentForm.style.display = "block";
    cardElement.mount("#card-element");
  }

  // Procesar el pago al enviar el formulario
  const form = document.getElementById("stripe-form");
  form.onsubmit = async (event) => {
    event.preventDefault();

    // Crear el token de pago
    const { token, error } = await stripe.createToken(cardElement);

    if (error) {
      cardErrors.textContent = error.message;
    } else {
      const response = await fetch("/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, number: selectedNumber }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Pago exitoso, número comprado.");
        markNumberAsPurchased(selectedNumber);
      } else {
        alert("Hubo un error con el pago.");
      }
    }
  };

  // Marcar el número como comprado
  async function markNumberAsPurchased(number) {
    const response = await fetch("/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number }),
    });

    const data = await response.json();
    if (data.success) {
      const button = document.getElementById(`number-${number}`);
      button.disabled = true;
      button.textContent = "Comprado";
      paymentForm.style.display = "none"; // Ocultar formulario de pago
    } else {
      alert(data.message);
    }
  }
});
