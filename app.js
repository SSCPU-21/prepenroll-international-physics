const state={topics:[],selected:new Set(),difficulty:'all',setSize:15,questions:[],answers:{},flags:new Set(),index:0};
const $=id=>document.getElementById(id);
const screens=['welcomeScreen','practiceScreen','resultsScreen','reviewScreen'];

function showScreen(id){screens.forEach(s=>$(s).classList.toggle('active',s===id));window.scrollTo({top:0,behavior:'smooth'});}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}

async function init(){
  state.topics=await (await fetch('../data/imat/topics.json')).json();
  renderTopics();
  document.querySelectorAll('.chip.diff').forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll('.chip.diff').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');state.difficulty=btn.dataset.diff;
  });
  $('setSize').onchange=e=>state.setSize=Number(e.target.value);
  $('generateBtn').onclick=generatePractice;
  $('welcomeStart').onclick=generatePractice;
  $('selectAll').onclick=()=>{state.topics.forEach(t=>state.selected.add(t.slug));renderTopics();};
  $('clearAll').onclick=()=>{state.selected.clear();renderTopics();};
  $('prevBtn').onclick=()=>goTo(state.index-1);
  $('nextBtn').onclick=()=>goTo(state.index+1);
  $('flagBtn').onclick=toggleFlag;
  $('submitBtn').onclick=submitPractice;
  $('reviewBtn').onclick=renderReview;
  $('newSetBtn').onclick=()=>showScreen('welcomeScreen');
  $('backResults').onclick=()=>showScreen('resultsScreen');
  setupCalculator();
}
function renderTopics(){
  const grouped={};
  state.topics.forEach(t=>(grouped[t.unit]??=[]).push(t));
  $('topicList').innerHTML=Object.entries(grouped).map(([unit,topics])=>`
    <div class="unit-block">
      <div class="unit-header">${unit}</div>
      <div class="sub-list">${topics.map(t=>`
        <label class="sub-row"><input type="checkbox" value="${t.slug}" ${state.selected.has(t.slug)?'checked':''}><span>${t.title}</span></label>
      `).join('')}</div>
    </div>`).join('');
  $('topicList').querySelectorAll('input').forEach(cb=>cb.onchange=()=>{
    cb.checked?state.selected.add(cb.value):state.selected.delete(cb.value);
  });
}
async function generatePractice(){
  if(!state.selected.size){alert('Please select at least one topic.');return;}
  const banks=[];
  for(const slug of state.selected){
    const r=await fetch(`../data/imat/${slug}.json`);
    const arr=await r.json();
    banks.push(...arr);
  }
  let pool=state.difficulty==='all'?banks:banks.filter(q=>q.difficulty===state.difficulty);
  if(!pool.length){alert('No questions match this selection.');return;}
  state.questions=shuffle(pool).slice(0,Math.min(state.setSize,pool.length));
  state.answers={};state.flags=new Set();state.index=0;
  showScreen('practiceScreen');renderQuestion();
}
function renderQuestion(){
  const q=state.questions[state.index];if(!q)return;
  $('practiceTitle').textContent='IMAT Physics Practice';
  $('progressText').textContent=`${state.index+1} / ${state.questions.length}`;
  $('answeredText').textContent=`${Object.keys(state.answers).length} answered`;
  $('qMeta').textContent=`${q.unit} • ${q.subtopic} • ${q.difficulty}`;
  $('qStem').textContent=q.stem;
  const chosen=state.answers[q.id];
  $('qOptions').innerHTML=q.options.map((o,i)=>{
    const cls = chosen===undefined ? '' :
      (i===q.answer_index ? 'correct-now' : (i===chosen ? 'wrong-now' : ''));
    return `<button class="opt ${chosen===i?'sel':''} ${cls}" data-i="${i}">
      <span class="letter">${String.fromCharCode(65+i)}</span><span>${o}</span>
    </button>`;
  }).join('');
  $('qOptions').querySelectorAll('.opt').forEach(btn=>btn.onclick=()=>{
    state.answers[q.id]=Number(btn.dataset.i);renderQuestion();
  });
  const fb=$('instantFeedback');
  if(chosen===undefined){
    fb.className='instant-feedback';
    fb.innerHTML='';
  } else {
    const ok=chosen===q.answer_index;
    fb.className='instant-feedback show '+(ok?'correct':'wrong');
    fb.innerHTML=`<b>${ok?'Correct':'Correct answer: '+String.fromCharCode(65+q.answer_index)+'. '+q.options[q.answer_index]}</b><br>${q.explanation}`;
  }
  $('prevBtn').disabled=state.index===0;
  $('nextBtn').style.display=state.index===state.questions.length-1?'none':'inline-block';
  $('submitBtn').style.display=state.index===state.questions.length-1?'inline-block':'none';
  $('flagBtn').textContent=state.flags.has(q.id)?'Unflag':'Flag';
  renderQNav();
}
function renderQNav(){
  $('qNav').innerHTML=state.questions.map((q,i)=>`<button class="pillnav ${i===state.index?'current':''} ${state.answers[q.id]!==undefined?'answered':''} ${state.flags.has(q.id)?'flagged':''}" data-i="${i}">${i+1}</button>`).join('');
  $('qNav').querySelectorAll('button').forEach(b=>b.onclick=()=>goTo(Number(b.dataset.i)));
}
function goTo(i){if(i<0||i>=state.questions.length)return;state.index=i;renderQuestion();}
function toggleFlag(){const id=state.questions[state.index].id;state.flags.has(id)?state.flags.delete(id):state.flags.add(id);renderQuestion();}
function submitPractice(){
  if(!confirm('Submit this practice set and view your scorecard?'))return;
  let correct=0;const topicStats={};
  state.questions.forEach(q=>{
    const ok=state.answers[q.id]===q.answer_index;if(ok)correct++;
    const k=q.subtopic;topicStats[k]??={correct:0,total:0};topicStats[k].total++;if(ok)topicStats[k].correct++;
  });
  const pct=Math.round(correct/state.questions.length*100);
  $('scorePct').textContent=pct+'%';
  $('scoreSub').textContent=`${correct} correct out of ${state.questions.length}`;
  $('resultsMeta').textContent=`${Object.keys(state.answers).length} answered • ${state.questions.length-Object.keys(state.answers).length} unanswered`;
  $('breakdownRows').innerHTML=Object.entries(topicStats).map(([topic,s])=>{
    const p=Math.round(s.correct/s.total*100);
    return `<div class="urow"><span>${topic}</span><div class="bar"><div style="width:${p}%"></div></div><b>${s.correct}/${s.total}</b></div>`;
  }).join('');
  showScreen('resultsScreen');
}
function renderReview(){
  $('reviewList').innerHTML=state.questions.map((q,i)=>{
    const ans=state.answers[q.id],ok=ans===q.answer_index;
    return `<article class="review-card ${ok?'correct':'wrong'}">
      <div class="review-meta">Q${i+1} • ${q.subtopic} • ${q.difficulty}</div>
      <h3>${q.stem}</h3>
      ${q.options.map((o,j)=>`<div class="review-opt ${j===q.answer_index?'correct-opt':''} ${j===ans&&j!==q.answer_index?'wrong-opt':''}">${String.fromCharCode(65+j)}. ${o}</div>`).join('')}
      <div class="explanation"><b>${ok?'Correct':'Review'}:</b> ${q.explanation}</div>
    </article>`;
  }).join('');
  showScreen('reviewScreen');
}
function setupCalculator(){
  const keys=['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','C','+','√','(',')','='];
  $('calcGrid').innerHTML=keys.map(k=>`<button data-k="${k}" class="${['÷','×','−','+','√'].includes(k)?'op':''} ${k==='='?'eq':''}">${k}</button>`).join('');
  $('calcToggle').onclick=()=>$('calc').classList.toggle('open');
  $('calcClose').onclick=()=>$('calc').classList.remove('open');
  $('calcGrid').querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const k=b.dataset.k,s=$('calcScreen');
    if(k==='C'){s.value='';return;}
    if(k==='='){try{s.value=Function('"use strict";return ('+s.value.replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replaceAll('√','Math.sqrt')+')')();}catch{s.value='Error';}return;}
    s.value+=k;
  });
}
init();