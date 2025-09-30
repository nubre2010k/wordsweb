let entries = [];
let queue = [];
let index = 0;
let wrongAnswers = [];

let startTime, timerInterval;

const totalEl = document.getElementById('total');
const correctEl = document.getElementById('correct');
const wrongEl = document.getElementById('wrong');
const remainingEl = document.getElementById('remaining');
const currentWordEl = document.getElementById('currentWord');
const currentMetaEl = document.getElementById('currentMeta');
const wordListEl = document.getElementById('wordList');
const answerInput = document.getElementById('answerInput');
const resultBox = document.getElementById('resultBox');
const timerEl = document.getElementById('timer');
const wrongListBox = document.getElementById('wrongList');
const wrongItems = document.getElementById('wrongItems');

// --- TIMER FUNKSIYASI ---
function startTimer(){
  startTime = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    let elapsed = Math.floor((Date.now()-startTime)/1000);
    timerEl.textContent = "⏳ " + elapsed + " soniya";
  },1000);
}
function stopTimer(){ clearInterval(timerInterval); }

// --- Yuklash funksiyalari ---
async function fetchWordsFile(name){
  try{
    const r = await fetch(name, {cache:'no-store'});
    if(!r.ok) return null;
    return await r.text();
  }
  catch(e){
    return null;
  }
}

function loadFromJsonText(txt){
  let parsed;
  try {
    parsed = JSON.parse(txt);
  } catch(e) {
    return alert('JSON xato.');
  }

  if(Array.isArray(parsed)){
    entries = parsed.map(p => ({
      word: String(p.word || '').trim(),
      mean: Array.isArray(p.mean) ? p.meaning.join(', ') : String(p.meaning || '').trim()
    })).filter(e => e.word);
  } else if(typeof parsed === 'object' && parsed !== null){
    entries = Object.keys(parsed).map(k => ({
      word: k,
      mean: Array.isArray(parsed[k]) ? parsed[k].join(', ') : String(parsed[k] || '').trim()
    }));
  } else {
    return alert('JSON format xato.');
  }

  renderList();
  resetProgress();
  alert(entries.length + " ta so‘z yuklandi.");
}

function renderList(){
  wordListEl.value = JSON.stringify(entries,null,2);
  totalEl.textContent = entries.length;
  remainingEl.textContent = entries.length - (parseInt(correctEl.textContent)+parseInt(wrongEl.textContent));
}

function resetProgress(){
  correctEl.textContent = '0';
  wrongEl.textContent = '0';
  remainingEl.textContent = entries.length;
  resultBox.innerHTML = '';
  wrongAnswers = [];
  wrongListBox.style.display = 'none';
}

function startQuiz(){
  if(entries.length === 0) return alert('JSON yuklang!');
  queue = entries.map((e,i) => i);
  shuffleArray(queue);
  index = 0;
  wrongAnswers = [];
  wrongListBox.style.display = 'none';
  renderCurrent();
  answerInput.focus();
  startTimer();
}

function renderCurrent(){
  if(index >= queue.length){
    currentWordEl.textContent = '✅ Test tugadi';
    currentMetaEl.textContent = 'Barcha so‘zlar ko‘rildi.';
    stopTimer();
    if(wrongAnswers.length > 0){
      wrongItems.innerHTML = wrongAnswers.map(w =>
        `<div class="wrong-item">❌ ${w.word} → ${w.mean} <small>(Faylning ${w.originalIndex}-qatori)</small></div>`
      ).join("");
      wrongListBox.style.display = 'block';
    }
    return;
  }
  const item = entries[queue[index]];
  const mode = document.getElementById('modeSelect').value;
  if(mode === 'word->mean'){
    currentWordEl.textContent = item.word;
    currentMetaEl.textContent = "Ma'noni yozing.";
  } else {
    currentWordEl.textContent = item.mean;
    currentMetaEl.textContent = "So'zni yozing.";
  }
  resultBox.innerHTML = '';
  answerInput.value = '';
  updateCounters();
}

function checkAnswer(){
  if(index >= queue.length) return;
  const user = answerInput.value.trim().toLowerCase();
  if(!user) return;
  const itemIndex = queue[index];
  const item = entries[itemIndex];
  const mode = document.getElementById('modeSelect').value;

  // Ma'nolarni vergul bilan ajratib olish (agar bo'lsa)
  let correctAnswersList;
  if(mode === 'word->mean'){
    correctAnswersList = item.mean.split(',').map(s => s.trim().toLowerCase());
  } else {
    correctAnswersList = [item.word.toLowerCase()];
  }

  // Foydalanuvchi javobi shu ma'nolardan birortasiga tengmi tekshirish
  const isCorrect = correctAnswersList.some(ans => ans === user);

  if(isCorrect){
    showResult(true, correctAnswersList[0]); // to'g'ri javobni ko'rsatish (birinchisi)
    incrementCounter('correct');
  } else {
    showResult(false, correctAnswersList[0]);
    incrementCounter('wrong');
    wrongAnswers.push({ ...item, originalIndex: itemIndex + 1 });
  }
  index++;
  if(index < queue.length) setTimeout(() => renderCurrent(), 400);
  else renderCurrent();
}


function skip(){
  index++;
  renderCurrent();
}

function showAnswer(){
  if(index >= queue.length) return;
  const item = entries[queue[index]];
  const mode = document.getElementById('modeSelect').value;
  showResult(true, (mode === 'word->mean' ? item.meaning : item.word));
  index++;
  updateCounters();
  if(index < queue.length) setTimeout(() => renderCurrent(), 400);
  else renderCurrent();
}

function showResult(ok, text){
  const div = document.createElement('div');
  div.className = ok ? 'ok' : 'bad';
  div.textContent = (ok ? '✅ To‘g‘ri! ' : '❌ Noto‘g‘ri! To‘g‘risi: ') + (text || '—');
  resultBox.innerHTML = '';
  resultBox.appendChild(div);
}

function incrementCounter(name){
  const el = (name === 'correct' ? correctEl : wrongEl);
  el.textContent = String(Number(el.textContent) + 1);
  remainingEl.textContent = String(entries.length - (Number(correctEl.textContent) + Number(wrongEl.textContent)));
}

function updateCounters(){
  totalEl.textContent = entries.length;
}

function shuffleArray(a){
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function shuffleEntries(){
  shuffleArray(entries);
}

// tugmalar uchun hodisalar
document.getElementById('loadBtn').addEventListener('click', () => {
  fetchWordsFile('words.json').then(txt => {
    if(txt === null) alert('Topilmadi');
    else loadFromJsonText(txt);
  });
});
document.getElementById('fileInput').addEventListener('change', e => {
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = () => loadFromJsonText(r.result);
  r.readAsText(f);
});
document.getElementById('shuffleBtn').addEventListener('click', () => {
  shuffleEntries();
  renderList();
  resetProgress();
});
document.getElementById('startBtn').addEventListener('click', () => {
  startQuiz();
});
document.getElementById('checkBtn').addEventListener('click', () => {
  checkAnswer();
});
document.getElementById('skipBtn').addEventListener('click', () => {
  skip();
});
document.getElementById('showBtn').addEventListener('click', () => {
  showAnswer();
});
document.getElementById('modeSelect').addEventListener('change', () => {
  renderCurrent();
});
answerInput.addEventListener('keydown', e => {
  if(e.key === 'Enter') checkAnswer();
});
wordListEl.addEventListener('change', () => {
  try {
    const parsed = JSON.parse(wordListEl.value);
    loadFromJsonText(JSON.stringify(parsed));
  } catch(e) {
    alert('JSON xato.');
  }
});
(async () => {
  const txt = await fetchWordsFile('words.json');
  if(txt !== null) loadFromJsonText(txt);
})();

document.getElementById('githubBtn').addEventListener('click', async () => {
  const box = document.getElementById('githubSelect').value;
  if(!box) return alert("Box tanlang!");
  try {
    const url = `${box}.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error("Fayl yuklanmadi");
    const txt = await res.text();
    loadFromJsonText(txt);
  } catch (err) {
    alert("Xato: " + err.message);
  }
});


function renderCurrent(){
  if(index >= queue.length){
    currentWordEl.textContent = '✅ Test tugadi';
    currentMetaEl.textContent = 'Barcha so‘zlar ko‘rildi.';
    stopTimer();

    // To‘g‘ri javoblar ro‘yxati
    const correctAnswers = [];
    for(let i=0; i<queue.length; i++){
      if(!wrongAnswers.find(w => w.originalIndex === queue[i] + 1)){
        correctAnswers.push(entries[queue[i]]);
      }
    }

    // To‘g‘ri javoblarni chiqarish
    const correctAnswersBox = document.getElementById('correctAnswersBox');
    const correctAnswersText = document.getElementById('correctAnswersText');
    if(correctAnswers.length > 0){
      correctAnswersText.value = JSON.stringify(correctAnswers, null, 2);
      correctAnswersBox.style.display = 'block';
    } else {
      correctAnswersBox.style.display = 'none';
    }

    // Noto‘g‘ri javoblarni chiqarish
    const wrongAnswersBox = document.getElementById('wrongAnswersBox');
    const wrongAnswersText = document.getElementById('wrongAnswersText');
    if(wrongAnswers.length > 0){
      const wrongOnly = wrongAnswers.map(({word, mean}) => ({word, mean}));
      wrongAnswersText.value = JSON.stringify(wrongOnly, null, 2);
      wrongAnswersBox.style.display = 'block';
    } else {
      wrongAnswersBox.style.display = 'none';
    }

    return;
  }

  // Qolgan renderCurrent kodi o‘zgarmaydi
  const item = entries[queue[index]];
  const mode = document.getElementById('modeSelect').value;
  if(mode === 'word->mean'){
    currentWordEl.textContent = item.word;
    currentMetaEl.textContent = "Ma'noni yozing.";
  } else {
    currentWordEl.textContent = item.mean;
    currentMetaEl.textContent = "So'zni yozing.";
  }
  resultBox.innerHTML = '';
  answerInput.value = '';
  updateCounters();
}

// Copy tugmalari uchun hodisalar

document.getElementById('copyCorrectBtnNew').addEventListener('click', () => {
  const text = document.getElementById('correctAnswersText').value;
  navigator.clipboard.writeText(text).then(() => {
    alert('To‘g‘ri javoblar nusxa olindi!');
  }).catch(() => {
    alert('Nusxa olishda xato yuz berdi.');
  });
});

document.getElementById('copyWrongBtnNew').addEventListener('click', () => {
  const text = document.getElementById('wrongAnswersText').value;
  navigator.clipboard.writeText(text).then(() => {
    alert('Noto‘g‘ri javoblar nusxa olindi!');
  }).catch(() => {
    alert('Nusxa olishda xato yuz berdi.');
  });
});
