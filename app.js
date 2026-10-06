const topicGrid=document.getElementById('topicGrid');
const topicSelect=document.getElementById('topicSelect');
const difficulty=document.getElementById('difficulty');
const stem=document.getElementById('stem');
const options=document.getElementById('options');
const feedback=document.getElementById('feedback');
const meta=document.getElementById('meta');
let topics=[],bank=[];

async function init(){
  const r=await fetch('data/imat/topics.json'); topics=await r.json();
  topicGrid.innerHTML=topics.map(t=>`<article class="topic"><small>${t.unit}</small><h4>${t.title}</h4><p>150 original IMAT-style questions</p></article>`).join('');
  topicSelect.innerHTML=topics.map(t=>`<option value="${t.slug}">${t.title}</option>`).join('');
  await loadBank();
}
async function loadBank(){
  const slug=topicSelect.value||topics[0]?.slug;if(!slug)return;
  const r=await fetch(`data/imat/${slug}.json`);bank=await r.json();showQuestion();
}
function showQuestion(){
  const level=difficulty.value;
  const pool=level==='all'?bank:bank.filter(q=>q.difficulty===level);
  const q=pool[Math.floor(Math.random()*pool.length)];
  if(!q)return;
  meta.textContent=`IMAT • Physics • ${q.subtopic} • ${q.difficulty}`;
  stem.textContent=q.stem;feedback.style.display='none';feedback.textContent='';
  options.innerHTML='';
  q.options.forEach((opt,i)=>{
    const el=document.createElement('div');el.className='option';el.textContent=String.fromCharCode(65+i)+'. '+opt;
    el.onclick=()=>{[...options.children].forEach((n,j)=>{n.style.pointerEvents='none';if(j===q.answer_index)n.classList.add('correct')});if(i!==q.answer_index)el.classList.add('wrong');feedback.textContent=q.explanation;feedback.style.display='block'};
    options.appendChild(el);
  });
}
document.getElementById('loadBtn').onclick=loadBank;
topicSelect.onchange=loadBank;
difficulty.onchange=showQuestion;
init();