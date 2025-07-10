# 🤖 Bot de Registro de Horas Extras — WhatsApp - Amadeus

Este es un chatbot desarrollado con la librería [`@bot-whatsapp/bot`](https://bot-whatsapp.netlify.app/) usando **Node.js** y conectado a un backend para registrar horas extras de empleados mediante el código empresarial.

---

## 🛠️ Tecnologías utilizadas

- Node.js
- [@bot-whatsapp/bot](https://bot-whatsapp.netlify.app/)
- WebWhatsappProvider
- Axios (para llamadas HTTP)
- MockAdapter (almacenamiento en memoria)
- QRPortalWeb (visualización QR en navegador)
- API REST propia en `http://localhost:5011/api`

---

## 🚀 Instalación y ejecución

### 1. Clona el repositorio

```bash
git clone https://github.com/Honne15/ChatBotAmadeus
cd tu-repo
```

### 2. Instala las dependencias

```bash
npm install
```

### 3. Ejecuta el bot

```bash
npm start
```

> Se abrirá una ventana en el navegador con un **código QR** para escanear con WhatsApp Web. Una vez escaneado, el bot estará listo para interactuar.

---

## 💬 Funcionalidades

### ✅ Registro de horas extras paso a paso

1. El bot te saluda y te pregunta si deseas registrar horas extras.
2. Si respondes "Registrar", el bot:
   - Solicita tu **código empresarial**.
   - Verifica el código contra el backend: `GET /users/code?code=...`.
   - Pide la **fecha** de trabajo (formato `YYYY-MM-DD`).
   - Pide la **hora de inicio** y luego la **hora de salida** (formato `HH:MM`).
   - Envía los datos al backend mediante `POST /hour`.
   - Muestra un **resumen del registro**.

### 📌 Palabras clave

- `"hola"`, `"inicio"` → Inicia la conversación
- `"registrar"` → Comienza el registro de horas
- `"gracias"`, `"adiós"` → Finaliza la conversación

---

## 📦 Estructura del proyecto

```
.
├── app.js                # Archivo principal del bot
├── .wwebjs_auth/         # Carpeta de sesión de WhatsApp
├── package.json
└── README.md
```

---

## 🧪 Validaciones integradas

- Validación de formato de **fecha** y **hora**
- Verificación de código empresarial contra el backend
- Manejo de errores de red o validaciones incompletas

---

## 🔗 Requisitos del backend

Debes tener corriendo una API REST con los siguientes endpoints:

- `GET /users/code?code={codigo}` → Retorna datos del empleado.
- `POST /hour` → Recibe el objeto con la hora extra a registrar.

Ejemplo de payload que se envía:

```json
{
  "userId": 1,
  "name": "Juan Pérez",
  "code": "EMP123",
  "date": "07/09/2025",
  "startTime": "18:00",
  "endTime": "21:00",
  "status": "Pendiente",
  "created": "2025-07-10T22:14:00.000Z",
  "updated": "2025-07-10T22:14:00.000Z"
}
```

---