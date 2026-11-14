import { getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = id => document.getElementById(id);
const msg = t => { const m = $("msg"); if (m) m.textContent = t; };

let db = null, moiUid = null, stopMsg = null;
let messageJetons = "", affMsg = null, ta = null;

function creerAffichage() {
  const h3 = $("jetonsJoueur").querySelector("h3");
  affMsg = document.createElement("div");
  affMsg.style.cssText = "display:none;margin:6px 0 8px;padding:6px 10px;border-left:3px solid #f4b400;background:#0e3b2a;border-radius:6px;font-size:13px;color:#ffd;white-space:pre-wrap;text-align:left;word-break:break-word";
  h3.after(affMsg);
}

function creerEditeur() {
  const h3 = $("adminBox").querySelector("h3");
  const box = document.createElement("div");
  box.style.margin = "6px 0 8px";

  const info = document.createElement("div");
  info.className = "mini";
  info.style.wordBreak = "normal";
  info.textContent = "Message affiché aux joueurs, sous le titre « Gestion des jetons »";

  ta = document.createElement("textarea");
  ta.maxLength = 300;
  ta.rows = 3;
  ta.placeholder = "Écris ton message…";
  ta.style.cssText = "display:block;width:100%;box-sizing:border-box;border:0;border-radius:8px;padding:8px 10px;font-size:14px;font-family:inherit;margin:6px 0";

  const lg = document.createElement("div");
  lg.className = "ligne";
  lg.style.borderTop = "0";
  const bt = document.createElement("div");
  bt.className = "btns";
  const bp = document.createElement("button");
  bp.textContent = "Publier le message";
  bp.onclick = () => publier(ta.value);
  const be = document.createElement("button");
  be.textContent = "Effacer";
  be.className = "gris";
  be.onclick = () => { ta.value = ""; publier(""); };
  bt.append(bp, be);
  lg.appendChild(bt);

  box.append(info, ta, lg);
  h3.after(box);
}

function majMessage() {
  if (affMsg) {
    affMsg.textContent = messageJetons;
    affMsg.style.display = messageJetons ? "block" : "none";
  }
  if (ta && document.activeElement !== ta) ta.value = messageJetons;
}

async function publier(texte) {
  const t = String(texte).trim().slice(0, 300);
  try {
    await setDoc(doc(db, "config", "jetons"), { message: t, par: moiUid, maj: serverTimestamp() });
    msg(t ? "Message publié." : "Message effacé.");
  } catch (e) {
    msg("Erreur : " + (e.code || e.message));
  }
}

function demarrer() {
  const app = getApp();
  const auth = getAuth(app);
  db = getFirestore(app);
  creerAffichage();
  creerEditeur();
  onAuthStateChanged(auth, user => {
    if (stopMsg) { stopMsg(); stopMsg = null; }
    moiUid = user ? user.uid : null;
    messageJetons = "";
    majMessage();
    if (!user) return;
    stopMsg = onSnapshot(doc(db, "config", "jetons"), s => {
      const d = s.exists() ? s.data() : {};
      messageJetons = typeof d.message === "string" ? d.message : "";
      majMessage();
    }, () => {});
  });
}

function attendre(n) {
  const pret = getApps().length && $("jetonsJoueur") && $("adminBox");
  if (pret) demarrer();
  else if (n < 300) setTimeout(() => attendre(n + 1), 100);
}
attendre(0);
