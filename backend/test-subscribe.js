const BACKEND_URL = 'https://dunita-marketing-production.up.railway.app';
const email = process.argv[2] || `test+${Date.now()}@example.com`;

async function main() {
  try {
    console.log(`Probando suscripción con email: ${email}`);

    const response = await fetch(`${BACKEND_URL}/api/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    console.log('Código HTTP:', response.status);
    console.log('Respuesta:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      process.exitCode = 1;
      return;
    }

    const subscribersResponse = await fetch(`${BACKEND_URL}/api/subscribers`);
    const subscribers = await subscribersResponse.json();

    console.log(`Suscriptores actuales: ${subscribers.length}`);
    console.log('Últimos 3 suscriptores:', subscribers.slice(0, 3));
  } catch (error) {
    console.error('ERROR EN TEST:', error);
    process.exitCode = 1;
  }
}

main();
