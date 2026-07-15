import { Conversation } from "https://cdn.jsdelivr.net/npm/@elevenlabs/client@latest/+esm";

const AGENT_ID = "agent_0701kw9bzh0nez38sc17934gva79";

const orb = document.getElementById("orb");
const statusEl = document.getElementById("status");
const callBtn = document.getElementById("callBtn");
const answerBtn = document.getElementById("answerBtn");
const endBtn = document.getElementById("endBtn");
const ring = document.getElementById("ringSound");

let conversation = null;

function setStatus(t) { statusEl.textContent = t; }
function showRinging() {
  orb.className = "orb ringing";
  callBtn.classList.add("hidden");
  answerBtn.classList.remove("hidden");
  endBtn.classList.add("hidden");
  setStatus("📲 مكالمة واردة من العمل...");
  try { ring.play(); } catch (e) {}
  if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
}
function showIdle() {
  orb.className = "orb";
  callBtn.classList.remove("hidden");
  answerBtn.classList.add("hidden");
  endBtn.classList.add("hidden");
  setStatus('اضغط "اتصل بأحمد" للبدء');
  ring.pause(); ring.currentTime = 0;
}
function showLive() {
  orb.className = "orb live";
  callBtn.classList.add("hidden");
  answerBtn.classList.add("hidden");
  endBtn.classList.remove("hidden");
  ring.pause(); ring.currentTime = 0;
}

async function startCall() {
  try {
    setStatus("جارٍ الاتصال بأحمد...");
    await navigator.mediaDevices.getUserMedia({ audio: true });

    conversation = await Conversation.startSession({
      agentId: AGENT_ID,
      connectionType: "webrtc",
      onConnect: () => { showLive(); setStatus("🟢 متصل — تحدّث الآن"); },
      onDisconnect: () => { showIdle(); },
      onError: (e) => { setStatus("خطأ: " + (e?.message || e)); showIdle(); },
      onModeChange: (m) => {
        if (m.mode === "speaking") setStatus("🗣️ أحمد يتحدث...");
        else setStatus("👂 أحمد يستمع لك...");
      },
    });
  } catch (err) {
    setStatus("تعذّر الاتصال: " + (err?.message || err));
    showIdle();
  }
}

async function endCall() {
  if (conversation) { await conversation.endSession(); conversation = null; }
  showIdle();
}

callBtn.addEventListener("click", startCall);
answerBtn.addEventListener("click", startCall);
endBtn.addEventListener("click", endCall);

// ===== الرنين التلقائي عند وصول إشارة =====
// يفحص ملف signal.json كل 5 ثوانٍ. إذا تغيّر رقمه، يرنّ.
let lastSignal = null;
async function checkSignal() {
  try {
    const r = await fetch("signal.json?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    if (lastSignal === null) { lastSignal = d.id; return; }
    if (d.id !== lastSignal) {
      lastSignal = d.id;
      if (!conversation) showRinging();
    }
  } catch (e) {}
}
setInterval(checkSignal, 5000);
checkSignal();

showIdle();
