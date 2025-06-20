const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const axios = require('axios');
const QRPortalWeb = require('@bot-whatsapp/portal');
const WebWhatsappProvider = require('@bot-whatsapp/provider/web-whatsapp');
const MockAdapter = require('@bot-whatsapp/database/mock');
 
// Configuración del backend
const API_BASE_URL = "http://localhost:5011/api";
 
// Funciones de utilidad para validación
const isValidDate = (dateStr) => {
  console.log(`Validando fecha: ${dateStr}`);
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};
 
// Función para reformatear fecha YYYY-MM-DD a MM/DD/YYYY
const formatDateForBackend = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
};
 
const isValidTime = (timeStr) => {
  console.log(`Validando hora: ${timeStr}`);
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeStr);
};
 
// Obtener fecha y hora actual en formato ISO
const getCurrentISODateTime = () => {
  return new Date().toISOString();
};
 
// Flujo de despedida
const flowDespedida = addKeyword(['gracias', 'gracias por la ayuda', 'adios', 'chao'])
  .addAnswer("Fue un placer servirte, que tengas un buen día. 😊", null, () => {
    console.log('🔄 Usuario finalizó la conversación');
  });
 
// Flujo de registro de horas extras
const flowRegistro = addKeyword(['sí', 'si', 'registrar', 'horas extras'])
  .addAnswer("Perfecto. Vamos a registrar tus horas extras.", null, () => {
    console.log('🔄 Iniciando proceso de registro de horas extras');
  })
  .addAnswer(
    "Escribe tu código empresarial:",
    { capture: true },
    async (ctx, { flowDynamic, fallBack, state }) => {
      const codigoEmpresarial = ctx.body.trim();
      console.log(`🔹 Código empresarial recibido: ${codigoEmpresarial}`);
     
      try {
        console.log(`🔄 Verificando código con endpoint: ${API_BASE_URL}/users/code?code=${codigoEmpresarial}`);
        const userResponse = await axios.get(`${API_BASE_URL}/users/code?code=${codigoEmpresarial}`);
       
        console.log('Respuesta del servidor:', userResponse.status, JSON.stringify(userResponse.data));
       
        if (userResponse.status === 200 && userResponse.data) {
          console.log('✅ Usuario verificado correctamente:', userResponse.data);
          const name = userResponse.data.name || "usuario";
          const userId = userResponse.data.userId;
         
          // Guardamos los datos del usuario en el estado
          await state.update({
            userId,
            name,
            code: codigoEmpresarial
          });
         
          await flowDynamic([
            `✅ Inicio de sesión exitoso. Bienvenido ${name}!`,
            "Ahora ingresa la fecha en que trabajaste las horas extras"
          ]);
        } else {
          console.log('❌ No se encontró el usuario con el código proporcionado');
          await flowDynamic("❌ No encontramos tu código empresarial en el sistema. Por favor, verifica e intenta nuevamente.");
          return fallBack();
        }
      } catch (error) {
        console.error("❌ Error al verificar el código empresarial:", error.message);
        if (error.response) {
          console.error("Detalles del error:", error.response.status, error.response.data);
        }
        await flowDynamic("❌ Error al verificar tu código. Por favor, intenta nuevamente más tarde.");
        return fallBack();
      }
    }
  )
 
  .addAnswer(
    "Formato de fecha: YYYY-MM-DD",
    { capture: true },
    async (ctx, { flowDynamic, fallBack, state }) => {
      const fechaInput = ctx.body.trim();
      console.log(`🔹 Fecha recibida: ${fechaInput}`);
     
      if (!isValidDate(fechaInput)) {
        console.log('❌ Formato de fecha inválido');
        await flowDynamic("❌ La fecha no tiene el formato correcto (YYYY-MM-DD). Por favor, intenta nuevamente.");
        return fallBack();
      }
     
      // Convertir fecha a formato MM/DD/YYYY para el backend
      const fechaFormateada = formatDateForBackend(fechaInput);
      console.log(`🔄 Fecha formateada para backend: ${fechaFormateada}`);
     
      // Guardamos la fecha en el estado (guardamos ambas versiones)
      const currentState = state.getMyState() || {};
      await state.update({
        ...currentState,
        fechaOriginal: fechaInput,
        date: fechaFormateada  // Nombre correcto para el backend
      });
      console.log("Estado actualizado con fecha:", state.getMyState());
     
      await flowDynamic("Ingresa tu hora de inicio.");
    }
  )
 
  .addAnswer(
    "Formato de hora: HH:MM",
    { capture: true },
    async (ctx, { flowDynamic, fallBack, state }) => {
      const horaInicio = ctx.body.trim();
      console.log(`🔹 Hora de inicio recibida: ${horaInicio}`);
     
      if (!isValidTime(horaInicio)) {
        console.log('❌ Formato de hora de inicio inválido');
        await flowDynamic("❌ La hora no tiene el formato correcto (HH:MM). Por favor, intenta nuevamente.");
        return fallBack();
      }
     
      // Guardamos la hora de inicio en el estado
      const currentState = state.getMyState() || {};
      await state.update({
        ...currentState,
        startTime: horaInicio  // Nombre correcto para el backend
      });
      console.log("Estado actualizado con hora inicio:", state.getMyState());
     
      await flowDynamic("Ahora, ingresa tu hora de salida.");
    }
  )
 
  .addAnswer(
    "Formato de hora: HH:MM",
    { capture: true },
    async (ctx, { flowDynamic, fallBack, state }) => {
      const horaSalida = ctx.body.trim();
      console.log(`🔹 Hora de salida recibida: ${horaSalida}`);
     
      if (!isValidTime(horaSalida)) {
        console.log('❌ Formato de hora de salida inválido');
        await flowDynamic("❌ La hora no tiene el formato correcto (HH:MM). Por favor, intenta nuevamente.");
        return fallBack();
      }
     
      // Obtenemos todos los datos del estado
      const currentState = state.getMyState() || {};
      console.log("Estado actual antes de enviar:", currentState);
     
      const { userId, name, date, startTime, code } = currentState;
     
      if (!userId || !date || !startTime) {
        console.error("❌ Faltan datos necesarios:", currentState);
        await flowDynamic("❌ Lo siento, ha ocurrido un error. Falta información necesaria. Por favor, inicia el proceso nuevamente.");
        return;
      }
     
      const timestamp = getCurrentISODateTime();
     
      try {
        console.log("🔄 Enviando datos al backend...");
        const extraHourData = {
          userId,
          name: name,
          code,
          date,
          startTime,
          endTime: horaSalida,
          status: "Pendiente",
          created: timestamp,
          updated: timestamp,
        };
       
        console.log("Datos a enviar:", extraHourData);
       
        // Enviamos al endpoint correcto api/hour
        const response = await axios.post(`${API_BASE_URL}/hour`, extraHourData);
       
        console.log("Respuesta del servidor:", response.status, response.statusText);
       
        if (response.status === 200 || response.status === 201) {
          console.log("✅ Registro de horas extras exitoso:", response.data);
          await flowDynamic([
            "✅ ¡Gracias! Tus horas extras han sido registradas correctamente.",
            "Resumen de registro:",
            `📆 Fecha: ${date}`,
            `⏰ Hora inicio: ${startTime}`,
            `⏰ Hora salida: ${horaSalida}`,
            `📋 Estado: Pendiente`,
            `Para registrar mas horas extras, escribe "Registrar".`,
            `Para salir, escribe "Gracias" 🤗.`
          ]);
        } else {
          console.error(`❌ Error en el registro: ${response.statusText}`);
          await flowDynamic("❌ Lo siento, hubo un problema al registrar tus horas extras.");
        }
      } catch (err) {
        console.error("❌ Error al registrar horas extras:", err.message);
        if (err.response) {
          console.error("Detalles del error:", err.response.status, JSON.stringify(err.response.data));
        }
        await flowDynamic("❌ Lo siento, hubo un error al registrar tus horas extras. Por favor, intenta más tarde.");
      }
    }
  );
 
// Flujo principal mejorado
const flowPrincipal = addKeyword(['hola', 'ole', 'alo', 'inicio'])
  .addAnswer('🙌 Hola, bienvenido al *Bot de Registro de Horas Extras*', null, () => {
    console.log('👋 Nuevo usuario inició conversación');
  })
  .addAnswer(
    ['¿Deseas registrar horas extras?',
     '👉 Responde "Registrar" para iniciar el proceso',
     '👉 Responde "Gracias" para salir'],
    null,
    () => {
      console.log('🔄 Esperando respuesta del usuario');
    },
    [flowRegistro, flowDespedida]
  );
 
const main = async () => {
  try {
    console.log("🚀 Iniciando configuración del bot...");
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipal, flowRegistro, flowDespedida]);
    const adapterProvider = createProvider(WebWhatsappProvider, {
      session: './.wwebjs_auth/session-bot_sessions',
    });
 
    console.log("⚙️ Creando instancia del bot...");
    createBot({
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    });
 
    console.log("✅ Bot iniciado correctamente. Escanea el código QR para iniciar sesión.");
    QRPortalWeb();
 
  } catch (error) {
    console.error("❌ Error al iniciar el bot:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
};
 
main();