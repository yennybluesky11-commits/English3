
/**
 * MEP3+ Speaking Game with Topics and SVG illustrations
 * - Topics: friends, classroom, hobbies, family (10 sentences each)
 * - SVG illustrations per topic
 * - Per-topic leaderboard
 * - Web Speech API TTS + STT
 */

const $ = sel => document.querySelector(sel);
const leaderboardBody = $("#leaderboard tbody");
const lbTopic = $("#lbTopic");

const topicSelect = $("#topicSelect");
const btnNew = $("#btnNew");
const btnListen = $("#btnListen");
const btnStart = $("#btnStart");
const btnStop = $("#btnStop");
const playerNameInput = $("#playerName");
const textInput = $("#textInput");
const resultBox = $("#result");
const illustrationImg = $("#illustrationImg");

let recognition = null;
let isRecording = false;

// Sentence bank (10 per topic)
const bank = {
  friends: [
    "This is my friend.",
    "We play at the park.",
    "He is kind and funny.",
    "She is my best friend.",
    "We walk to school together.",
    "Do you want to play?",
    "Let’s share the toys.",
    "We like to read books.",
    "My friend can run fast.",
    "We help each other."
  ],
  classroom: [
    "Open your book, please.",
    "We are in the classroom.",
    "Raise your hand, please.",
    "Listen to the teacher.",
    "Close the door, please.",
    "Put your bag here.",
    "Stand up, please.",
    "Sit down, please.",
    "Write your name, please.",
    "Work in pairs."
  ],
  hobbies: [
    "I like drawing animals.",
    "Do you like dancing?",
    "I can play the guitar.",
    "She likes reading stories.",
    "He likes playing soccer.",
    "We love riding bikes.",
    "I can swim very well.",
    "They like singing songs.",
    "I enjoy painting pictures.",
    "We fly kites on Sunday."
  ],
  family: [
    "This is my family.",
    "He is my father.",
    "She is my mother.",
    "I love my sister.",
    "He is my brother.",
    "We have dinner together.",
    "My grandma tells stories.",
    "We visit our cousins.",
    "We play games at home.",
    "My grandpa likes gardening."
  ]
};

// Illustration pools per topic (relative paths to /img/...)
const illustrations = {
  friends: ["img/friends/friends1.svg","img/friends/friends2.svg","img/friends/friends3.svg"],
  classroom: ["img/classroom/class1.svg","img/classroom/class2.svg","img/classroom/class3.svg"],
  hobbies: ["img/hobbies/hobby1.svg","img/hobbies/hobby2.svg","img/hobbies/hobby3.svg"],
  family: ["img/family/family1.svg","img/family/family2.svg","img/family/family3.svg"]
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function newSentence() {
  const topic = topicSelect.value;
  const sentence = pickRandom(bank[topic]);
  textInput.value = sentence;
  illustrationImg.src = pickRandom(illustrations[topic]);
  illustrationImg.onerror = () => illustrationImg.removeAttribute('src'); // fallback to empty if missing
  resultBox.innerHTML = "";
  renderLeaderboard(); // refresh per-topic
}

function speakText() {
  const text = textInput.value.trim();
  if (!text) { alert("Please click 'New Sentence' first!"); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function startRecording() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech recognition not supported in this browser. Please use Chrome.");
    return;
  }
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    checkResult(transcript);
  };
  recognition.onerror = (e) => alert("Error: " + e.error);
  recognition.onend = () => { isRecording = false; };

  recognition.start();
  isRecording = true;
  resultBox.innerHTML = "🎙 Recording...";
}

function stopRecording() {
  if (isRecording && recognition) recognition.stop();
}

function normalize(str) {
  return str.toLowerCase().replace(/[.,!?’'"]/g,"").replace(/\s+/g," ").trim();
}
function tokenize(str){ return normalize(str).split(" ").filter(Boolean); }

function checkResult(userSpeech) {
  const name = playerNameInput.value.trim();
  if (!name) { alert("Please enter your name!"); return; }

  const original = textInput.value;
  const target = tokenize(original);
  const said = tokenize(userSpeech);

  let score = 0;
  let tokens = [];
  for (let i=0;i<target.length;i++){
    const t = target[i];
    const s = said[i] || "";
    if (t === s) {
      tokens.push(`<span class="token correct">${t}</span>`);
      score += 10;
    } else {
      tokens.push(`<span class="token wrong">${t}</span>`);
      score -= 5;
    }
  }

  resultBox.innerHTML = `
    <p><strong>You said:</strong> ${userSpeech}</p>
    <p><strong>Result:</strong> ${tokens.join(" ")}</p>
    <p><strong>Score:</strong> ${score}</p>
  `;

  if (score >= 80) playWinFanfare();

  saveScore(topicSelect.value, name, score);
  renderLeaderboard();
}

function getScores(){
  try { return JSON.parse(localStorage.getItem("mep3plus-scores")||"{}"); }
  catch { return {}; }
}

function saveScore(topic, name, score){
  const all = getScores();
  if (!all[topic]) all[topic] = [];
  all[topic].push({ name, score, ts: Date.now() });
  all[topic].sort((a,b)=>b.score-a.score);
  all[topic] = all[topic].slice(0,20);
  localStorage.setItem("mep3plus-scores", JSON.stringify(all));
}

function renderLeaderboard(){
  const topic = topicSelect.value;
  lbTopic.textContent = topic;
  const all = getScores();
  const list = all[topic] || [];
  leaderboardBody.innerHTML = "";
  list.forEach((p, idx) => {
    const reward = p.score >= 80 ? "🏅 Gold" : (p.score >= 50 ? "🥈 Silver" : "🎖 Bronze");
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx+1}</td><td>${escapeHTML(p.name)}</td><td>${p.score}</td><td>${reward}</td>`;
    leaderboardBody.appendChild(tr);
  });
}

function escapeHTML(str){
  return (str||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function playWinFanfare(){
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const seq = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    let t = ctx.currentTime;
    seq.forEach((f,i)=>{
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.28);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t+0.3);
      t += 0.32;
    });
  } catch(e){ console.warn(e); }
}

// Wire up events
btnNew.addEventListener("click", newSentence);
btnListen.addEventListener("click", speakText);
btnStart.addEventListener("click", startRecording);
btnStop.addEventListener("click", stopRecording);
topicSelect.addEventListener("change", ()=>{ newSentence(); renderLeaderboard(); });

// Init
renderLeaderboard();
newSentence();
