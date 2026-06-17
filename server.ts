import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";

// Import types
interface PatientMedicationSync {
  patientId: string;
  patientName: string;
  medications: Array<{
    id: string;
    name: string;
    dosage: string;
    time: string;
  }>;
}

interface PushSubscriptionData {
  patientId: string;
  subscription: webpush.PushSubscription;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS headers middleware to guarantee cross-origin capability within iframes and preview environments
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // VAPID keys persistence
  let vapidKeys = { publicKey: "", privateKey: "" };
  const vapidPath = path.join(process.cwd(), "vapid-keys.json");
  if (fs.existsSync(vapidPath)) {
    try {
      vapidKeys = JSON.parse(fs.readFileSync(vapidPath, "utf8"));
    } catch (e) {
      console.error("Error loading VAPID keys, generating new ones...");
    }
  }

  if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(vapidPath, JSON.stringify(vapidKeys, null, 2));
    console.log("Generated stable VAPID keys inside vapid-keys.json");
  }

  webpush.setVapidDetails(
    "mailto:diegodorim@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  // Subscriptions persistence
  let subscriptions: PushSubscriptionData[] = [];
  const subscriptionsPath = path.join(process.cwd(), "subscriptions.json");
  if (fs.existsSync(subscriptionsPath)) {
    try {
      subscriptions = JSON.parse(fs.readFileSync(subscriptionsPath, "utf8"));
    } catch (e) {
      console.error("Error loading subscriptions");
    }
  }

  function saveSubscriptions() {
    fs.writeFileSync(subscriptionsPath, JSON.stringify(subscriptions, null, 2));
  }

  // Patient prescriptions synchronization
  let patientSchedules: Record<string, PatientMedicationSync> = {};
  const schedulesPath = path.join(process.cwd(), "patient-schedules.json");
  if (fs.existsSync(schedulesPath)) {
    try {
      patientSchedules = JSON.parse(fs.readFileSync(schedulesPath, "utf8"));
    } catch (e) {
      console.error("Error loading patient schedules");
    }
  }

  function saveSchedules() {
    fs.writeFileSync(schedulesPath, JSON.stringify(patientSchedules, null, 2));
  }

  // Keep track of sent notifications to avoid duplication within the same minute
  // format: "patientId_medicationId_YYYY-MM-DD_HH:MM"
  const sentNotifications = new Set<string>();

  // API Route: Get VAPID public key
  app.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  // API Route: Register / subscribe a device
  app.post("/api/push/subscribe", (req, res) => {
    const { patientId, subscription } = req.body;
    if (!patientId || !subscription) {
      return res.status(400).json({ error: "patientId and subscription are required" });
    }

    // Filter out existing duplicates for the exact same endpoint
    subscriptions = subscriptions.filter(
      (sub) => sub.subscription.endpoint !== subscription.endpoint
    );

    subscriptions.push({ patientId, subscription });
    saveSubscriptions();

    console.log(`Subscribed mobile/browser device for patient: ${patientId}`);
    res.status(201).json({ success: true, message: "Subscription registered successfully" });
  });

  // API Route: Synchronize patient medications
  app.post("/api/patients/sync", (req, res) => {
    const syncData = req.body as PatientMedicationSync;
    if (!syncData.patientId || !Array.isArray(syncData.medications)) {
      return res.status(400).json({ error: "Invalid patient sync payload" });
    }

    patientSchedules[syncData.patientId] = syncData;
    saveSchedules();

    console.log(`Synchronized medication schedule for patient: ${syncData.patientName} (${syncData.patientId})`);
    res.json({ success: true });
  });

  // API Route: Test immediate notification
  app.post("/api/push/test-now", async (req, res) => {
    const { patientId, name, message, delayMs } = req.body;
    if (!patientId) {
      return res.status(400).json({ error: "patientId is required" });
    }

    const patientSubs = subscriptions.filter((sub) => sub.patientId === patientId);
    if (patientSubs.length === 0) {
      return res.status(404).json({ error: "Nenhum dispositivo cadastrado para este paciente. Ative as notificações no painel do paciente primeiro." });
    }

    const payload = JSON.stringify({
      title: "💊 Alerta de Medicação",
      body: message || `Olá, ${name || "Paciente"}! Está no horário de usar sua medicação. Por favor, confirme o uso.`,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "test-notification-alert",
      data: {
        patientId,
        test: true
      }
    });

    const sendPush = async () => {
      let successCount = 0;
      let failCount = 0;

      const promises = patientSubs.map(async (pSub) => {
        try {
          await webpush.sendNotification(pSub.subscription, payload);
          successCount++;
        } catch (err: any) {
          console.error("Push delivery fail:", err.message);
          failCount++;
          // If the subscription is expired or invalid, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            subscriptions = subscriptions.filter((s) => s.subscription.endpoint !== pSub.subscription.endpoint);
            saveSubscriptions();
          }
        }
      });

      await Promise.all(promises);
      console.log(`Delayed push sent to ${patientId}. Successes: ${successCount}, Failures: ${failCount}`);
    };

    if (delayMs && delayMs > 0) {
      setTimeout(sendPush, delayMs);
      return res.json({
        success: true,
        message: `Alerta agendado para daqui a ${delayMs / 1000} segundos! Feche a aba do navegador ou bloqueie a tela do celular agora para realizar o teste de background.`
      });
    }

    await sendPush();
    res.json({
      success: true,
      message: "Enviado em tempo real."
    });
  });

  // API Route: Trigger on-demand confirmation
  app.post("/api/push/confirm-medication", (req, res) => {
    const { patientId, medicationId, medicationName } = req.body;
    console.log(`Paciente ${patientId} confirmou o uso do medicamento: ${medicationName} (${medicationId})`);
    res.json({ success: true });
  });

  // Background Schedular: Check for medication times every 30 seconds
  setInterval(async () => {
    const now = new Date();
    // Use GMT-3 (Brazil / Brasilia time)
    // AI Studio containers run in UTC or US East/West, let's format to Brazil timezone time
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    const formatter = new Intl.DateTimeFormat("pt-BR", options);
    const timeStr = formatter.format(now); // "HH:MM"
    
    // YYYY-MM-DD
    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    const dateFormatter = new Intl.DateTimeFormat("pt-BR", dateOptions);
    const formattedDate = dateFormatter.format(now).split("/").reverse().join("-"); // "YYYY-MM-DD"

    // Scan all patient schedules
    for (const [patientId, syncData] of Object.entries(patientSchedules)) {
      for (const med of syncData.medications) {
        // Match formatted medication time (e.g. "08:00") with the current paulista time
        if (med.time === timeStr) {
          const uniqueKey = `${patientId}_${med.id}_${formattedDate}_${timeStr}`;

          if (!sentNotifications.has(uniqueKey)) {
            sentNotifications.add(uniqueKey);

            // Fetch push subscriptions for patient
            const patientSubs = subscriptions.filter((sub) => sub.patientId === patientId);
            if (patientSubs.length > 0) {
              console.log(`CLOCK TRIGGER: Sending alert to ${syncData.patientName} for medication ${med.name} at ${med.time}`);

              const payload = JSON.stringify({
                title: "💊 Hora do seu Medicamento!",
                body: `Está no horário de usar: ${med.name} (${med.dosage}). Clique para confirmar o uso!`,
                icon: "/favicon.ico",
                tag: `med-${med.id}-${formattedDate}`,
                data: {
                  patientId,
                  medicationId: med.id,
                  medicationName: med.name,
                  dosage: med.dosage,
                  time: med.time,
                  url: "/"
                }
              });

              patientSubs.forEach(async (pSub) => {
                try {
                  await webpush.sendNotification(pSub.subscription, payload);
                } catch (err: any) {
                  console.error(`Clock push failed for patient: ${patientId}:`, err.message);
                  if (err.statusCode === 410 || err.statusCode === 404) {
                    subscriptions = subscriptions.filter((s) => s.subscription.endpoint !== pSub.subscription.endpoint);
                    saveSubscriptions();
                  }
                }
              });
            }
          }
        }
      }
    }
  }, 30000); // run check every 30 seconds

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
