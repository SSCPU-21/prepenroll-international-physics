const topicGrid=document.getElementById('topicGrid');
const topicSelect=document.getElementById('topicSelect');
const difficulty=document.getElementById('difficulty');
const stem=document.getElementById('stem');
const options=document.getElementById('options');
const feedback=document.getElementById('feedback');
const meta=document.getElementById('meta');
const nextBtn=document.getElementById('nextBtn');
let topics=[],bank=[],lastId=null;

async function init(){
  const r=await fetch('data/imat/topics.json');
  topics=await r.json();
  topicGrid.innerHTML=topics.map(t=>`<article class="topic" data-slug="${t.slug}"><small>${t.unit}</small><h4>${t.title}</h4><p>Practice this subtopic →</p></article>`).join('');
  topicSelect.innerHTML='<option value="" selected disabled>Choose a subtopic</option>'+topics.map(t=>`<option value="${t.slug}">${t.title}</option>`).join('');
  topicGrid.querySelectorAll('.topic').forEach(card=>{
    card.addEventListener('click',async()=>{
      topicSelect.value=card.dataset.slug;
      document.getElementById('practice').scrollIntoView({behavior:'smooth'});
      await loadBank();
    });
  });
}
async function loadBank(){
  const slug=topicSelect.value;
  if(!slug)return;
  const r=await fetch(`data/imat/${slug}.json`);
  bank=await r.json();
  showQuestion();
}
function showQuestion(){
  const level=difficulty.value;
  const pool=(level==='all'?bank:bank.filter(q=>q.difficulty===level)).filter(q=>q.id!==lastId);
  const q=pool[Math.floor(Math.random()*pool.length)];
  if(!q)return;
  lastId=q.id;
  meta.textContent=`IMAT • Physics • ${q.subtopic} • ${q.difficulty}`;
  stem.textContent=q.stem;
  feedback.style.display='none';
  feedback.textContent='';
  nextBtn.style.display='none';
  options.innerHTML='';
  q.options.forEach((opt,i)=>{
    const el=document.createElement('div');
    el.className='option';
    el.textContent=String.fromCharCode(65+i)+'. '+opt;
    el.onclick=()=>{
      [...options.children].forEach((n,j)=>{
        n.style.pointerEvents='none';
        if(j===q.answer_index)n.classList.add('correct');
      });
      if(i!==q.answer_index)el.classList.add('wrong');
      feedback.innerHTML='<b>'+(i===q.answer_index?'Correct.':'Check the reasoning.')+'</b><br>'+q.explanation;
      feedback.style.display='block';
      nextBtn.style.display='inline-flex';
    };
    options.appendChild(el);
  });
}
document.getElementById('loadBtn').onclick=loadBank;
nextBtn.onclick=showQuestion;
topicSelect.onchange=loadBank;
difficulty.onchange=()=>{if(bank.length)showQuestion()};
init();