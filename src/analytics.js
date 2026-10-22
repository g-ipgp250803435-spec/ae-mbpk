import { supabase } from './supabase.js';

const $ = id => document.getElementById(id);
const state = { user:null, classId:null, students:[], rows:[], filtered:[], requestToken:0, followupPlans:[], plansRequestToken:0, savingPlan:false };

function setStatus(text, kind=''){const el=$('analyticsStatus');if(el){el.textContent=text;el.className=`status${kind?` ${kind}`:''}`;}}
function add(parent,tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);parent.append(el);return el;}
function gameLabel(slug){const labels={'misi-berdikari':'Misi Berdikari','misi_berdikari':'Misi Berdikari','peneroka-braille':'Peneroka Braille','papan-komunikasi':'Papan Komunikasi Saya','communication-board':'Papan Komunikasi Saya','kataquest':'KataQuest','nombor-ninja':'NomborNinja','dunia-emosi':'Dunia Emosi','langkah-rutin':'Langkah Demi Langkah','tangan-berbicara':'Tangan Berbicara'};return labels[slug]||String(slug||'Permainan tidak dinyatakan').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
function studentLabel(id){return state.students.find(s=>s.id===id)?.display_name||'Profil tidak tersedia';}
function dateOf(row){return row.completed_at||row.created_at;}
function fmtDate(value){if(!value)return'Tarikh tidak tersedia';const d=new Date(value);return Number.isNaN(d.getTime())?'Tarikh tidak sah':new Intl.DateTimeFormat('ms-MY',{dateStyle:'medium',timeStyle:'short'}).format(d);}
function summary(row){return row.result_summary&&typeof row.result_summary==='object'&&!Array.isArray(row.result_summary)?row.result_summary:{};}
function skillLabel(row){const labels={'syllable-recognition':'Pengenalan suku kata','word-building':'Pembinaan perkataan','word-reading':'Membaca perkataan','number-recognition':'Pengenalan nombor','counting':'Mengira objek','quantity-comparison':'Perbandingan kuantiti','addition':'Operasi tambah','subtraction':'Operasi tolak'};return labels[row.skill_code]||row.skill_code||summary(row).mission_title||summary(row).skill_code||'Kemahiran tidak diperincikan';}
function validScore(row){const n=Number(row.score);return row.score!==null&&row.score!==undefined&&row.score!==''&&Number.isFinite(n)&&n>=0&&n<=100?n:null;}
function stepsDone(row){const s=summary(row);return Number(s.steps_completed??s.tasks_completed??0)||0;}
function totalSteps(row){const s=summary(row);return Number(s.total_steps??s.total_tasks??0)||0;}
function applyFilters(){
  const student=$('analyticsStudentFilter').value,game=$('analyticsGameFilter').value,range=$('analyticsRangeFilter').value;
  const cutoff=range==='all'?null:Date.now()-Number(range)*86400000;
  state.filtered=state.rows.filter(r=>{const t=new Date(dateOf(r)||0).getTime();return(!student||r.student_id===student)&&(!game||r.game_slug===game)&&(cutoff===null||(!Number.isNaN(t)&&t>=cutoff));});
  render();
}
function renderStats(rows){
  const el=$('analyticsStats');el.replaceChildren();
  const sum=fn=>rows.reduce((a,r)=>a+(Number(fn(r))||0),0);
  const scored=rows.map(validScore).filter(v=>v!==null);
  const data=[
    [rows.length,'Sesi direkodkan'],
    [new Set(rows.map(r=>r.student_id)).size,'Murid dengan rekod'],
    [sum(r=>r.hints_used),'Petunjuk digunakan'],
    [sum(stepsDone),'Langkah/tugasan direkodkan'],
    [scored.length?`${(scored.reduce((a,b)=>a+b,0)/scored.length).toFixed(1)}%`:'—','Purata skor sesi*']
  ];
  for(const [value,label] of data){const card=add(el,'div','stat');add(card,'strong','',value);add(card,'span','',label);}
  const note=add(el,'p','analytics-note','*Purata skor hanya menggunakan sesi yang menyimpan skor numerik 0–100. Skor sesi bukan ukuran diagnosis atau penguasaan keseluruhan.');
  note.style.gridColumn='1 / -1';
}
function renderBars(targetId,entries){
  const host=$(targetId);host.replaceChildren();
  if(!entries.length){add(host,'p','analytics-empty','Tiada rekod bagi penapis yang dipilih.');return;}
  const max=Math.max(1,...entries.map(e=>e[1]));
  for(const [label,value] of entries){const row=add(host,'div','analytics-metric');add(row,'span','analytics-metric-label',label);const track=add(row,'div','analytics-track');const fill=add(track,'div','analytics-fill');fill.style.width=`${value/max*100}%`;fill.setAttribute('aria-hidden','true');add(row,'strong','',value);}
}
function renderTrend(rows){
  const host=$('analyticsTrend');host.replaceChildren();const days=[];const now=new Date();
  for(let i=6;i>=0;i--){const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;days.push({key,label:new Intl.DateTimeFormat('ms-MY',{weekday:'short'}).format(d),count:0});}
  const lookup=new Map(days.map(d=>[d.key,d]));
  for(const row of rows){const d=new Date(dateOf(row)||0);if(Number.isNaN(d.getTime()))continue;const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;if(lookup.has(key))lookup.get(key).count++;}
  const max=Math.max(1,...days.map(d=>d.count));
  for(const day of days){const col=add(host,'div','trend-day');add(col,'strong','',day.count);const bar=add(col,'div','trend-column');bar.style.height=`${Math.max(3,day.count/max*72)}px`;bar.setAttribute('role','img');bar.setAttribute('aria-label',`${day.label}: ${day.count} sesi`);add(col,'small','',day.label);}
}
function learnerAggregates(rows){
  const byId=new Map();
  for(const student of state.students)byId.set(student.id,{student,sessions:0,hints:0,attempts:0,scores:[],last:null,skills:new Set(),games:new Set(),steps:0,totalSteps:0});
  for(const r of rows){
    const a=byId.get(r.student_id);if(!a)continue;
    a.sessions++;a.hints+=Number(r.hints_used)||0;a.attempts+=Number(r.attempts)||0;a.steps+=stepsDone(r);a.totalSteps+=totalSteps(r);
    const score=validScore(r);if(score!==null)a.scores.push(score);
    if(r.skill_code)a.skills.add(r.skill_code);if(r.game_slug)a.games.add(r.game_slug);
    const date=new Date(dateOf(r)||0);if(!Number.isNaN(date.getTime())&&(!a.last||date>a.last))a.last=date;
  }
  return [...byId.values()];
}
function renderLearnerTable(rows){
  const host=$('analyticsLearnerTable');host.replaceChildren();
  const entries=learnerAggregates(rows).filter(a=>a.sessions>0).sort((a,b)=>a.student.display_name.localeCompare(b.student.display_name,'ms'));
  if(!entries.length){add(host,'p','analytics-empty','Tiada rekod murid bagi penapis ini. Murid tanpa sesi tidak dipaparkan dalam jadual ini.');return;}
  const table=add(host,'table','analytics-table');const thead=add(table,'thead','');const hr=add(thead,'tr','');
  for(const label of ['Murid','Sesi','Skor sesi purata*','Petunjuk/sesi','Aktiviti terakhir'])add(hr,'th','',label);
  const tbody=add(table,'tbody','');
  for(const a of entries){
    const tr=add(tbody,'tr','');add(tr,'td','',a.student.display_name||'Murid');
    add(tr,'td','',a.sessions);
    const score=a.scores.length?`${(a.scores.reduce((x,y)=>x+y,0)/a.scores.length).toFixed(1)}%`:'Tiada skor';
    add(tr,'td','',score);
    add(tr,'td','',(a.hints/a.sessions).toFixed(1));
    add(tr,'td','',a.last?new Intl.DateTimeFormat('ms-MY',{dateStyle:'medium'}).format(a.last):'—');
  }
  add(host,'p','analytics-note','*Purata tidak membandingkan murid dan tidak mengambil kira perbezaan permainan, bantuan, konteks atau peluang belajar. Gunakan bersama pemerhatian guru.');
}
function renderRecommendations(rows){
  const host=$('analyticsRecommendations');host.replaceChildren();
  const recs=[];
  if(!rows.length)recs.push(['Mulakan dengan pemerhatian','Belum ada sesi yang sepadan dengan penapis. Jalankan aktiviti ringkas bersama murid dan rekodkan pemerhatian guru mengikut matlamat pembelajaran.']);
  else{
    const total=rows.length,studentsWithRecords=new Set(rows.map(r=>r.student_id)).size;
    const hints=rows.reduce((n,r)=>n+(Number(r.hints_used)||0),0);
    const avgHints=hints/total;
    const scored=rows.map(validScore).filter(v=>v!==null);
    if(total<3)recs.push(['Kumpulkan lebih banyak evidens',`Hanya ${total} sesi tersedia. Elakkan membuat kesimpulan daripada sampel kecil; ulang aktiviti pada hari berbeza dan catat konteks sokongan.`]);
    if(avgHints>=1)recs.push(['Semak bentuk bantuan',`Purata ${avgHints.toFixed(1)} petunjuk bagi setiap sesi. Cuba modelkan langkah, gunakan petunjuk visual yang konsisten dan kurangkan bantuan secara beransur-ansur hanya apabila murid bersedia.`]);
    else recs.push(['Kekalkan pilihan bantuan',`Purata ${avgHints.toFixed(1)} petunjuk bagi setiap sesi dalam rekod ini. Pastikan bantuan kekal tersedia; bilangan petunjuk yang rendah sahaja tidak membuktikan murid sudah menguasai kemahiran.`]);
    if(scored.length){
      const avg=scored.reduce((a,b)=>a+b,0)/scored.length;
      recs.push(avg<60
        ?['Cuba pecahkan tugasan',`Purata skor sesi yang merekodkan skor ialah ${avg.toFixed(1)}%. Semak sama ada arahan, jumlah pilihan, bahasa, peranti atau kesesuaian aktiviti perlu diubah. Ini bukan label keupayaan murid.`]
        :['Uji pemindahan kemahiran',`Purata skor sesi yang merekodkan skor ialah ${avg.toFixed(1)}%. Cuba tugasan serupa dalam konteks berbeza dan semak sama ada kemahiran digunakan dengan bantuan yang sesuai.`]);
    }else recs.push(['Rekod hasil yang bermakna', 'Rekod semasa tidak mengandungi skor numerik. Pertimbangkan untuk merekod langkah yang dilakukan, jenis bantuan dan konteks aktiviti tanpa menambah data peribadi yang tidak diperlukan.']);
    if(studentsWithRecords<state.students.length)recs.push(['Semak peluang penyertaan',`${state.students.length-studentsWithRecords} profil dalam kelas tiada sesi dalam penapis ini. Semak sama ada murid belum menggunakan permainan, rekod belum disegerakkan atau tempoh penapis perlu diubah.`]);
  }
  for(const [title,body] of recs){const card=add(host,'article','analytics-recommendation');add(card,'strong','',title);add(card,'p','',body);}
  add(host,'p','analytics-note','Cadangan dijana melalui peraturan ringkas berdasarkan rekod yang dimuatkan; bukan diagnosis, penilaian automatik atau keputusan AI. Sahkan dengan guru dan murid.');
}
function renderHistory(rows){
  const host=$('analyticsHistory');host.replaceChildren();
  if(!rows.length){add(host,'p','analytics-empty','Tiada sesi yang sepadan dengan penapis.');return;}
  for(const r of rows.slice(0,100)){
    const row=add(host,'div','analytics-session');const info=add(row,'div','');
    add(info,'strong','',`${studentLabel(r.student_id)} · ${gameLabel(r.game_slug)}`);
    const score=validScore(r);const scoreText=score===null?'Skor tidak direkodkan':`Skor sesi ${score}%`;
    add(info,'small','',`${skillLabel(r)} · ${Number(r.attempts)||0} percubaan · ${Number(r.hints_used)||0} petunjuk · ${scoreText}`);
    add(info,'small','',fmtDate(dateOf(r)));add(row,'span','pill',r.completed_at?'Selesai':'Direkodkan');
  }
  if(rows.length>100)add(host,'p','muted',`Paparan menunjukkan 100 daripada ${rows.length} rekod. Eksport mengandungi semua rekod yang dimuatkan.`);
}
function render(){
  const rows=state.filtered;renderStats(rows);
  const games=new Map(),skills=new Map();
  for(const r of rows){const g=gameLabel(r.game_slug);games.set(g,(games.get(g)||0)+1);const s=skillLabel(r);skills.set(s,(skills.get(s)||0)+1);}
  renderBars('analyticsGameChart',[...games].sort((a,b)=>b[1]-a[1]));
  renderBars('analyticsSkillChart',[...skills].sort((a,b)=>b[1]-a[1]).slice(0,10));
  renderTrend(rows);renderLearnerTable(rows);renderRecommendations(rows);renderHistory(rows);
  setStatus(`${rows.length} sesi dipaparkan daripada ${state.rows.length} rekod yang dimuatkan.`, 'success');
}
function fillFilters(){
  const student=$('analyticsStudentFilter'),game=$('analyticsGameFilter');const oldS=student.value,oldG=game.value;
  student.replaceChildren();add(student,'option','','Semua murid').value='';
  for(const s of state.students){const o=add(student,'option','',s.display_name);o.value=s.id;}
  game.replaceChildren();add(game,'option','','Semua permainan').value='';
  for(const slug of [...new Set(state.rows.map(r=>r.game_slug).filter(Boolean))].sort()){const o=add(game,'option','',gameLabel(slug));o.value=slug;}
  student.value=[...student.options].some(o=>o.value===oldS)?oldS:'';game.value=[...game.options].some(o=>o.value===oldG)?oldG:'';
}
async function load(){
  const token=++state.requestToken;
  if(!supabase||!state.user||!state.classId){state.rows=[];state.filtered=[];render();setStatus('Log masuk dan pilih kelas untuk memaparkan analitik.');return;}
  setStatus('Memuatkan rekod sesi daripada Supabase…');
  try{
    const {data:students,error:studentError}=await supabase.from('students').select('id,display_name,learner_code').eq('class_id',state.classId);
    if(studentError)throw studentError;
    if(token!==state.requestToken)return;
    state.students=students||[];
    if(!state.students.length){state.rows=[];state.filtered=[];fillFilters();render();setStatus('Kelas ini belum mempunyai profil murid.');return;}
    const ids=state.students.map(s=>s.id);
    const {data,error}=await supabase.from('game_sessions').select('id,student_id,game_slug,skill_code,score,attempts,hints_used,duration_seconds,result_summary,completed_at,created_at').in('student_id',ids).order('created_at',{ascending:false}).limit(5000);
    if(error)throw error;
    if(token!==state.requestToken)return;
    state.rows=data||[];fillFilters();applyFilters();
  }catch(e){
    if(token!==state.requestToken)return;
    state.rows=[];state.filtered=[];render();setStatus(`Tidak dapat memuatkan analitik: ${e?.message||'Ralat tidak diketahui'}`,'error');
  }
}
function csvCell(v){let s=String(v??'');if(/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function exportCsv(){
  const rows=state.filtered;if(!rows.length){setStatus('Tiada rekod untuk dieksport.','error');return;}
  const headers=['nama_samaran','permainan','kemahiran','tarikh','skor_sesi_0_100','langkah_selesai','jumlah_langkah','percubaan','petunjuk','tempoh_saat'];
  const lines=[headers,...rows.map(r=>[studentLabel(r.student_id),gameLabel(r.game_slug),skillLabel(r),dateOf(r),validScore(r)??'',stepsDone(r),totalSteps(r),r.attempts??'',r.hints_used??'',r.duration_seconds??''])].map(row=>row.map(csvCell).join(','));
  const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ae-mbpk-analitik.csv';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}

// Personalised follow-up planner: deterministic rules only; no AI or diagnosis.
const FOCUS_PLANS = {
  general:{title:'Pengukuhan umum',goal:'Memberi peluang latihan berjaya dengan sokongan yang sesuai.',activities:[
    ['Pilih dan tunjuk','Sediakan dua pilihan yang jelas. Minta murid memilih atau menunjuk jawapan tanpa tekanan masa.'],
    ['Latihan ringkas berulang','Jalankan 3–5 percubaan dalam sesi pendek; selang-selikan dengan rehat atau aktiviti pilihan murid.'],
    ['Semak pemindahan','Cuba kemahiran sama menggunakan bahan atau konteks yang berbeza.']],
    evidence:'Catat sama ada murid memulakan, menyelesaikan dan meminta bantuan; jangan gunakan satu sesi sebagai kesimpulan.'},
  instructions:{title:'Memahami arahan',goal:'Menjadikan arahan lebih jelas dan boleh diikuti.',activities:[
    ['Satu arahan pada satu masa','Gunakan ayat ringkas dengan satu tindakan; beri masa memproses sebelum mengulang.'],
    ['Tunjuk langkah pertama','Modelkan langkah pertama, kemudian jemput murid mencuba langkah berikutnya.'],
    ['Semak kefahaman secara mesra','Minta murid menunjuk gambar atau bahan yang sepadan, bukan sekadar menjawab “faham”.']],
    evidence:'Rekod jenis arahan, bilangan pengulangan yang diperlukan dan sokongan yang membantu.'},
  communication:{title:'Komunikasi dan pilihan',goal:'Meluaskan peluang murid menyampaikan pilihan, keperluan atau respons.',activities:[
    ['Dua pilihan bermakna','Tunjukkan dua objek/gambar dan terima respons melalui pertuturan, isyarat, pandangan atau AAC yang digunakan murid.'],
    ['Modelkan cara meminta','Guru modelkan perkataan/isyarat seperti “mahu”, “tolong” atau “lagi”, kemudian beri masa untuk respons.'],
    ['Hormati semua bentuk respons','Jangan memaksa pertuturan atau sentuhan mata; sahkan maksud respons dengan cara yang sesuai.']],
    evidence:'Catat bentuk komunikasi yang digunakan dan sama ada rakan komunikasi memberi masa untuk respons.'},
  routine:{title:'Rutin dan urutan langkah',goal:'Membantu murid menjangka dan mengikuti urutan aktiviti.',activities:[
    ['Jadual visual tiga langkah','Gunakan gambar sebenar/simbol untuk “mula–buat–siap”; tandakan langkah selepas selesai.'],
    ['Susun kad urutan','Murid menyusun 2–4 gambar mengikut rutin sebenar, kemudian melaksanakan rutin dengan bahan maujud.'],
    ['Latihan dalam konteks sebenar','Amalkan rutin pada waktu dan tempat yang sesuai; kurangkan bantuan hanya apabila selesa.']],
    evidence:'Catat langkah yang dibuat sendiri, dengan petunjuk, atau selepas demonstrasi; jangan anggap kelajuan sebagai penguasaan.'},
  literacy:{title:'Literasi / bahasa',goal:'Mengukuhkan bahasa atau literasi melalui bahan yang sesuai tahap.',activities:[
    ['Padan gambar dan perkataan','Mulakan dengan 2 pilihan yang berbeza jelas; sebut/baca bersama jika murid mahu.'],
    ['Bina daripada unit kecil','Pecahkan perkataan/arahan kepada unit yang boleh diurus dan gabungkan secara beransur-ansur.'],
    ['Gunakan minat murid','Pilih bahan berkaitan minat atau rutin harian murid dan ulang kemahiran dalam konteks bermakna.']],
    evidence:'Bezakan sama ada murid mengenal, memadankan, menyebut, membaca atau menggunakan perkataan; rekod hanya kemahiran yang benar-benar diperhatikan.'},
  attention:{title:'Penglibatan dan perhatian',goal:'Menyusun aktiviti yang lebih mudah dimasuki dan boleh disertai.',activities:[
    ['Pusingan pendek','Bahagikan tugasan kepada pusingan pendek dengan titik mula dan tamat yang jelas.'],
    ['Pilihan peranan atau bahan','Benarkan murid memilih bahan, urutan atau cara menjawab apabila matlamat pembelajaran masih sama.'],
    ['Rancang rehat dan peralihan','Berikan amaran peralihan yang konsisten dan akses kepada rehat mengikut keperluan murid.']],
    evidence:'Catat keadaan persekitaran, tempoh aktiviti yang boleh disertai dan faktor yang membantu; elakkan melabel tingkah laku.'},
  motor:{title:'Akses motor / cara memberi respons',goal:'Memastikan respons mengukur kemahiran sasaran, bukan halangan mengendalikan peranti.',activities:[
    ['Sediakan respons alternatif','Terima menunjuk, memilih dengan pandangan, menyebut, menggunakan suis/AAC atau bantuan rakan jika sesuai.'],
    ['Ringkaskan sasaran sentuh','Besarkan sasaran, kurangkan pilihan serentak dan pastikan ruang antara butang mencukupi.'],
    ['Gunakan bahan fizikal','Cuba kad atau objek di atas meja jika interaksi skrin mengganggu matlamat pembelajaran.']],
    evidence:'Catat kaedah respons yang digunakan dan sama ada kesukaran datang daripada tugasan atau cara input.'},
  independence:{title:'Berdikari secara beransur-ansur',goal:'Menyokong penyertaan dan mengurangkan bantuan secara responsif, bukan memaksa.',activities:[
    ['Analisis tugasan','Pecahkan rutin kepada langkah kecil dan tandakan langkah yang sudah boleh dilakukan dengan selesa.'],
    ['Petunjuk paling ringan dahulu','Cuba petunjuk visual atau isyarat ringkas sebelum demonstrasi penuh; tunggu respons murid.'],
    ['Latihan dan generalisasi','Amalkan dalam lebih daripada satu konteks dengan orang/bahan yang sesuai.']],
    evidence:'Rekod tahap bantuan setiap langkah (mandiri, petunjuk visual, arahan, demonstrasi, bantuan fizikal jika sesuai dan dipersetujui).'}
};
const SUPPORT_LABELS={visual:'Jadual visual / gambar',model:'Contoh atau demonstrasi',choice:'Pilihan terhad dan jelas',verbal:'Arahan lisan ringkas',hands:'Bahan maujud / latihan praktikal',peer:'Latihan bersama rakan / guru'};
function recentStudentRows(studentId){
  return state.rows.filter(r=>r.student_id===studentId).sort((a,b)=>new Date(dateOf(b)||0)-new Date(dateOf(a)||0));
}
function makeActivityCards(studentId, focus, support, observation) {
  const all = recentStudentRows(studentId);
  const filtered = all.filter(r => state.filtered.some(f => f.id === r.id));
  const rows = filtered.length ? filtered : all;
  const plan = FOCUS_PLANS[focus] || FOCUS_PLANS.general;
  const avgHints = rows.length ? rows.reduce((n, r) => n + (Number(r.hints_used) || 0), 0) / rows.length : 0;
  const scores = rows.map(validScore).filter(v => v !== null);
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const skills = new Map();
  rows.forEach(r => { const k = skillLabel(r); skills.set(k, (skills.get(k) || 0) + 1); });
  const skill = [...skills.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Kemahiran belum diperincikan';
  const cards = [
    {
      title: 'Aktiviti 1 · Mula dengan sokongan pilihan',
      duration: '5–8 minit',
      steps: [
        `Fokus: ${plan.title.toLowerCase()}.`,
        `${SUPPORT_LABELS[support] || SUPPORT_LABELS.visual}: sediakan bahan dan tunjuk cara respons yang boleh diterima.`,
        plan.activities[0][1],
        'Tamatkan selepas beberapa percubaan bermakna atau apabila murid memerlukan rehat.'
      ],
      adapt: 'Permudahkan jumlah pilihan atau tukar cara respons; kekalkan matlamat kemahiran.'
    },
    {
      title: 'Aktiviti 2 · Latihan berpandu',
      duration: '5–10 minit',
      steps: [
        `${plan.activities[1][0]}: ${plan.activities[1][1]}`,
        'Beri masa pemprosesan dan bantuan yang konsisten; jangan menambah tekanan masa.',
        'Berikan maklum balas khusus tentang usaha atau langkah yang dilakukan.'
      ],
      adapt: avgHints > 0
        ? 'Rekod menunjukkan petunjuk digunakan dalam sesi yang tersedia. Kekalkan petunjuk yang membantu, kemudian cuba kurangkan satu tahap hanya jika sesuai.'
        : 'Pastikan petunjuk tetap tersedia walaupun rekod penggunaan rendah; sahkan melalui pemerhatian langsung.'
    },
    {
      title: 'Aktiviti 3 · Cuba dalam konteks lain',
      duration: '3–5 minit',
      steps: [
        `${plan.activities[2][0]}: ${plan.activities[2][1]}`,
        'Tukar satu unsur sahaja (bahan, tempat atau orang) supaya perubahan boleh diperhatikan.',
        'Tanya atau perhatikan sama ada sokongan yang sama masih diperlukan.'
      ],
      adapt: 'Jangan simpulkan pemindahan kemahiran daripada percubaan tunggal.'
    }
  ];
  const dataNote = rows.length
    ? `${rows.length} sesi dalam data murid tersedia untuk rujukan. Kemahiran paling kerap direkodkan: ${skill}. ${avgScore === null ? 'Tiada skor numerik tersedia.' : `Purata skor sesi yang mempunyai skor: ${avgScore.toFixed(1)}%.`} Purata petunjuk/sesi: ${avgHints.toFixed(1)}.`
    : 'Belum ada rekod sesi untuk murid ini. Pelan bermula daripada fokus pemerhatian guru, bukan andaian berdasarkan data.';
  return {
    plan, cards, evidence: plan.evidence, dataNote,
    observation: observation.trim(), studentName: studentLabel(studentId),
    studentId, focus, support, recordCount: rows.length,
    focusLabel: plan.title,
    supportLabel: SUPPORT_LABELS[support] || SUPPORT_LABELS.visual
  };
}
let latestFollowup=null;
function renderFollowup(){
  const studentId=$('followupStudent')?.value;
  const focus=$('followupFocus')?.value||'general';
  const support=$('followupSupport')?.value||'visual';
  const observation=$('followupObservation')?.value||'';
  const host=$('followupResults');host.replaceChildren();
  if(!studentId){add(host,'p','analytics-empty','Pilih profil murid terlebih dahulu.');latestFollowup=null;setFollowupStatus('Pilih murid sebelum menjana pelan.','error');return;}
  latestFollowup=makeActivityCards(studentId,focus,support,observation);
  const intro=add(host,'div','followup-summary');add(intro,'strong','',`Pelan susulan · ${latestFollowup.studentName}`);add(intro,'div','',latestFollowup.plan.goal);add(intro,'p','',latestFollowup.dataNote);if(observation.trim())add(intro,'p','',`Pemerhatian guru: ${observation.trim()}`);
  for(const cardData of latestFollowup.cards){
    const card=add(host,'article','followup-card');add(card,'h5','',cardData.title);add(card,'p','',`Cadangan masa: ${cardData.duration}`);
    const ol=add(card,'ol','');for(const step of cardData.steps)add(ol,'li','',step);
    const adap=add(card,'p','');const strong=add(adap,'strong','', 'Pelarasan: ');adap.append(document.createTextNode(cardData.adapt));
  }
  const evidence=add(host,'article','followup-card');add(evidence,'h5','','Apa yang perlu diperhatikan');add(evidence,'p','',latestFollowup.evidence);
  const next=add(host,'article','followup-card');add(next,'h5','','Cadangan sesi seterusnya');add(next,'p','',latestFollowup.plan.activities[2][0]+'. Ulang pada hari lain jika sesuai dan bandingkan jenis sokongan, bukan kelajuan sahaja.');
  setFollowupStatus('Pelan dijana menggunakan peraturan tetap dan rekod yang tersedia. Semak kesesuaian bersama guru sebelum digunakan.','success');
}
function setFollowupStatus(text,kind=''){const el=$('followupStatus');if(el){el.textContent=text;el.className=`status${kind?` ${kind}`:''}`;}}
function followupText(){
  if(!latestFollowup)return '';
  const p=latestFollowup;
  return [
    'ae-MBPK — PELAN AKTIVITI SUSULAN',
    `Profil murid: ${p.studentName}`,
    `Fokus: ${p.plan.title}`,
    `Sokongan untuk dicuba: ${SUPPORT_LABELS[p.support]||p.support}`,
    `Tarikh dijana: ${new Date().toLocaleString('ms-MY')}`,
    '',
    'RINGKASAN DATA',
    p.dataNote,
    p.observation?`Pemerhatian guru: ${p.observation}`:'',
    '',
    ...p.cards.flatMap(c=>[c.title,`Cadangan masa: ${c.duration}`,...c.steps.map((s,i)=>`${i+1}. ${s}`),`Pelarasan: ${c.adapt}`,'']),
    'EVIDENS YANG PERLU DIPERHATIKAN',
    p.evidence,
    '',
    'Nota: Ini cadangan awal berasaskan peraturan tetap, bukan diagnosis atau penilaian automatik. Sahkan dengan pemerhatian guru dan suara/pilihan murid.'
  ].filter(Boolean).join('\n');
}
function fillFollowupStudents(){
  const select=$('followupStudent');if(!select)return;
  const old=select.value;select.replaceChildren();add(select,'option','','Pilih murid').value='';
  for(const s of state.students){const o=add(select,'option','',s.display_name);o.value=s.id;}
  select.value=[...select.options].some(o=>o.value===old)?old:'';
}
function copyFollowup(){
  const text=followupText();if(!text){setFollowupStatus('Jana pelan sebelum menyalin.','error');return;}
  if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>setFollowupStatus('Pelan disalin. Kendalikan salinan mengikut dasar privasi institusi.','success')).catch(()=>fallbackCopy(text));}
  else fallbackCopy(text);
}
function fallbackCopy(text){const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();try{document.execCommand('copy');setFollowupStatus('Permintaan salin telah dihantar. Semak hasil papan klip pada peranti anda.','success');}catch{setFollowupStatus('Tidak dapat menyalin secara automatik. Gunakan pelan yang dipaparkan untuk menyalin secara manual.','error');}area.remove();}
function downloadFollowup(){
  const text=followupText();if(!text){setFollowupStatus('Jana pelan sebelum memuat turun.','error');return;}
  const blob=new Blob([text],{type:'text/plain;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ae-mbpk-pelan-aktiviti-susulan.txt';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);setFollowupStatus('Fail pelan disediakan. Simpan dengan selamat mengikut dasar institusi.','success');
}

const PLAN_STATUS_LABELS={planned:'Dirancang',in_progress:'Sedang dilaksanakan',completed:'Selesai',review:'Perlu disemak'};
function setSavedPlansStatus(text,kind=''){const el=$('savedPlansStatus');if(el){el.textContent=text;el.className=`status${kind?` ${kind}`:''}`;}}
function safePlanPayload(p){
  return {
    goal:String(p.plan?.goal||'').slice(0,500),
    activities:(p.cards||[]).slice(0,5).map(c=>({
      title:String(c.title||'').slice(0,160),
      duration:String(c.duration||'').slice(0,60),
      steps:(c.steps||[]).slice(0,8).map(s=>String(s).slice(0,500)),
      adapt:String(c.adapt||'').slice(0,700)
    })),
    evidence:String(p.evidence||'').slice(0,1000),
    data_note:String(p.dataNote||'').slice(0,1000),
    generated_at:new Date().toISOString()
  };
}
async function saveGeneratedPlan(){
  if(state.savingPlan)return;
  if(!latestFollowup){setFollowupStatus('Jana cadangan terlebih dahulu sebelum menyimpan pelan.','error');return;}
  if(!supabase||!state.user||!state.classId){setFollowupStatus('Log masuk dan pilih kelas sebelum menyimpan pelan.','error');return;}
  if(!state.students.some(s=>s.id===latestFollowup.studentId)){setFollowupStatus('Profil murid tidak lagi berada dalam kelas yang dipilih. Jana semula pelan.','error');return;}
  const btn=$('saveFollowupBtn');state.savingPlan=true;if(btn)btn.disabled=true;
  try{
    const payload={
      student_id:latestFollowup.studentId,
      created_by:state.user.id,
      focus_code:latestFollowup.focus,
      focus_label:latestFollowup.focusLabel,
      support_code:latestFollowup.support,
      support_label:latestFollowup.supportLabel,
      plan_payload:safePlanPayload(latestFollowup),
      observation:String(latestFollowup.observation||'').trim().slice(0,1000),
      status:'planned'
    };
    const {error}=await supabase.from('followup_plans').insert(payload);
    if(error)throw error;
    setFollowupStatus('Pelan disimpan ke rekod guru. Anda boleh mengemas kini status dan refleksi dalam bahagian rekod pelaksanaan.','success');
    await loadSavedPlans();
  }catch(e){
    const msg=/row-level security|permission denied/i.test(e?.message||'')
      ?'Simpanan ditolak oleh RLS. Semak migrasi Peringkat 3.8 dan pastikan murid berada dalam kelas milik akaun ini.'
      :/relation .*followup_plans.*does not exist/i.test(e?.message||'')
        ?'Jadual followup_plans belum wujud. Jalankan migrasi 202610210007_followup_plans.sql di Supabase SQL Editor.'
        :'Pelan tidak berjaya disimpan. Semak sambungan dan migrasi pangkalan data.';
    setFollowupStatus(msg,'error');
  }finally{state.savingPlan=false;if(btn)btn.disabled=false;}
}
async function loadSavedPlans(){
  const host=$('savedFollowupPlans');if(!host)return;
  const token=++state.plansRequestToken;
  if(!supabase||!state.user||!state.classId){
    state.followupPlans=[];host.replaceChildren();add(host,'p','analytics-empty','Log masuk dan pilih kelas untuk memuatkan rekod.');return;
  }
  const ids=state.students.map(s=>s.id);
  if(!ids.length){state.followupPlans=[];host.replaceChildren();add(host,'p','analytics-empty','Kelas ini belum mempunyai profil murid.');return;}
  setSavedPlansStatus('Memuatkan rekod pelan…');
  try{
    const {data,error}=await supabase.from('followup_plans')
      .select('id,student_id,created_by,focus_label,support_label,plan_payload,observation,status,implemented_on,reflection,next_step,created_at,updated_at')
      .in('student_id',ids).order('created_at',{ascending:false}).limit(200);
    if(error)throw error;
    if(token!==state.plansRequestToken)return;
    state.followupPlans=data||[];renderSavedPlans();
    setSavedPlansStatus(`${state.followupPlans.length} rekod pelan dimuatkan.`,'success');
  }catch(e){
    if(token!==state.plansRequestToken)return;
    state.followupPlans=[];host.replaceChildren();
    add(host,'p','analytics-empty',/relation .*followup_plans.*does not exist/i.test(e?.message||'')
      ?'Jadual belum tersedia. Jalankan migrasi 202610210007_followup_plans.sql.'
      :'Tidak dapat memuatkan rekod. Semak migrasi dan polisi RLS.');
    setSavedPlansStatus('Rekod pelan tidak dapat dimuatkan.','error');
  }
}
function renderSavedPlans(){
  const host=$('savedFollowupPlans');if(!host)return;host.replaceChildren();
  const rows=state.followupPlans.filter(p=>state.students.some(s=>s.id===p.student_id));
  if(!rows.length){add(host,'p','analytics-empty','Belum ada pelan tersimpan untuk kelas ini. Jana cadangan dan pilih “Simpan pelan ke rekod guru”.');return;}
  for(const plan of rows){
    const card=add(host,'article','saved-plan');
    const learner=studentLabel(plan.student_id);
    add(card,'h5','',`${learner} · ${plan.focus_label}`);
    add(card,'div','saved-plan-meta',`Dicipta ${fmtDate(plan.created_at)} · Sokongan: ${plan.support_label}`);
    const goal=plan.plan_payload?.goal;if(goal)add(card,'p','',goal);
    const list=add(card,'ol','');
    for(const activity of (plan.plan_payload?.activities||[])){
      const li=add(list,'li','',`${activity.title}${activity.duration?` (${activity.duration})`:''}`);
      if(activity.steps?.length){const sub=add(li,'ul','');for(const step of activity.steps.slice(0,4))add(sub,'li','',step);}
    }
    const fields=add(card,'div','followup-filters');
    const statusField=add(fields,'div','field');const statusLabel=add(statusField,'label','',`Status pelaksanaan — ${learner}`);
    const select=add(statusField,'select','');select.setAttribute('aria-label',`Status pelaksanaan ${learner}`);
    for(const [value,label] of Object.entries(PLAN_STATUS_LABELS)){const opt=add(select,'option','',label);opt.value=value;}
    select.value=plan.status;
    const dateField=add(fields,'div','field');add(dateField,'label','','Tarikh pelaksanaan (pilihan)');
    const dateInput=add(dateField,'input','');dateInput.type='date';dateInput.value=plan.implemented_on||'';
    const reflectionField=add(card,'div','field');add(reflectionField,'label','','Refleksi guru (elakkan maklumat klinikal/sensitif)');
    const reflection=add(reflectionField,'textarea','');reflection.rows=3;reflection.maxLength=2000;reflection.value=plan.reflection||'';reflection.placeholder='Apakah yang membantu? Apakah yang perlu diubah?';
    const nextField=add(card,'div','field');add(nextField,'label','','Langkah seterusnya (pilihan)');
    const next=add(nextField,'textarea','');next.rows=2;next.maxLength=1000;next.value=plan.next_step||'';next.placeholder='Contoh: ulang dengan jadual visual pada konteks lain.';
    const actions=add(card,'div','actions');
    const save=add(actions,'button','btn primary','Simpan kemas kini');save.type='button';
    save.addEventListener('click',()=>updateSavedPlan(plan.id,{status:select.value,implemented_on:dateInput.value||null,reflection:reflection.value.trim(),next_step:next.value.trim()},save));
    const del=add(actions,'button','btn','Padam rekod');del.type='button';
    del.addEventListener('click',()=>deleteSavedPlan(plan,del));
  }
}
async function updateSavedPlan(id,changes,button){
  if(!supabase||!state.user)return;
  button.disabled=true;
  try{
    const {data,error}=await supabase.from('followup_plans').update({...changes}).eq('id',id).eq('created_by',state.user.id).select('id').maybeSingle();
    if(error)throw error;
    if(!data)throw new Error('No accessible row updated');
    setSavedPlansStatus('Kemas kini rekod berjaya disimpan.','success');
    await loadSavedPlans();
  }catch(e){setSavedPlansStatus(/row-level security|permission denied/i.test(e?.message||'')?'Kemas kini ditolak oleh RLS. Semak pemilikan kelas dan polisi keselamatan.':'Kemas kini tidak berjaya. Semak sambungan dan cuba lagi.','error');}
  finally{button.disabled=false;}
}
async function deleteSavedPlan(plan,button){
  if(!supabase||!state.user)return;
  const learner=studentLabel(plan.student_id);
  if(!window.confirm(`Padam rekod pelan untuk ${learner} (${plan.focus_label})? Tindakan ini tidak boleh dibuat asal.`))return;
  button.disabled=true;
  try{
    const {data,error}=await supabase.from('followup_plans').delete().eq('id',plan.id).eq('created_by',state.user.id).select('id').maybeSingle();
    if(error)throw error;
    if(!data)throw new Error('No accessible row deleted');
    setSavedPlansStatus('Rekod pelan dipadam.','success');await loadSavedPlans();
  }catch(e){setSavedPlansStatus('Rekod tidak berjaya dipadam. Semak akses dan cuba lagi.','error');}
  finally{button.disabled=false;}
}


function fillReportStudents(){
  const select=$('reportStudent');if(!select)return;
  const old=select.value;select.replaceChildren();add(select,'option','','Pilih murid').value='';
  for(const s of state.students){const opt=add(select,'option','',s.display_name||'Murid');opt.value=s.id;}
  select.value=[...select.options].some(o=>o.value===old)?old:'';
}
function escapeReportHtml(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function reportStatus(text,kind=''){const el=$('learningReportStatus');if(el){el.textContent=text;el.className=`status${kind?` ${kind}`:''}`;}}
function generateLearningReport(){
  if(!state.user||!state.classId){reportStatus('Log masuk dan pilih kelas terlebih dahulu.','error');return;}
  const scope=$('reportScope')?.value||'class';
  const studentId=$('reportStudent')?.value||'';
  if(scope==='student'&&(!studentId||!state.students.some(s=>s.id===studentId))){reportStatus('Pilih profil murid untuk menjana laporan individu.','error');return;}
  const range=$('reportRange')?.value||'30';
  const cutoff=range==='all'?null:Date.now()-Number(range)*86400000;
  const inRange=row=>{
    const raw=dateOf(row)||row.created_at;
    const t=new Date(raw||0).getTime();
    return cutoff===null||(!Number.isNaN(t)&&t>=cutoff);
  };
  const learnerIds=new Set(scope==='student'?[studentId]:state.students.map(s=>s.id));
  const sessions=state.rows.filter(r=>learnerIds.has(r.student_id)&&inRange(r)).sort((a,b)=>new Date(dateOf(b)||0)-new Date(dateOf(a)||0));
  const plans=state.followupPlans.filter(p=>learnerIds.has(p.student_id)&&inRange(p));
  const learnerName=id=>state.students.find(s=>s.id===id)?.display_name||'Profil tidak tersedia';
  const scores=sessions.map(validScore).filter(v=>v!==null);
  const avg=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1)+'%':'Tidak tersedia';
  const totalHints=sessions.reduce((n,r)=>n+(Number(r.hints_used)||0),0);
  const statusLabels={planned:'Dirancang',in_progress:'Sedang dilaksanakan',completed:'Selesai',review:'Perlu disemak'};
  const sessionRows=sessions.map(r=>`<tr><td>${escapeReportHtml(learnerName(r.student_id))}</td><td>${escapeReportHtml(gameLabel(r.game_slug))}</td><td>${escapeReportHtml(skillLabel(r))}</td><td>${escapeReportHtml(fmtDate(dateOf(r)))}</td><td>${validScore(r)===null?'Tidak direkodkan':validScore(r)+'%'}</td><td>${Number(r.attempts)||0}</td><td>${Number(r.hints_used)||0}</td></tr>`).join('');
  const planRows=plans.map(p=>{
    const acts=(p.plan_payload?.activities||[]).map(a=>`<li><strong>${escapeReportHtml(a.title)}</strong>${a.duration?' — '+escapeReportHtml(a.duration):''}<ol>${(a.steps||[]).map(step=>`<li>${escapeReportHtml(step)}</li>`).join('')}</ol></li>`).join('');
    return `<article class="plan"><h3>${escapeReportHtml(learnerName(p.student_id))} — ${escapeReportHtml(p.focus_label)}</h3><p><strong>Status:</strong> ${escapeReportHtml(statusLabels[p.status]||p.status)} · <strong>Sokongan:</strong> ${escapeReportHtml(p.support_label)} · <strong>Dicipta:</strong> ${escapeReportHtml(fmtDate(p.created_at))}</p><p><strong>Matlamat:</strong> ${escapeReportHtml(p.plan_payload?.goal||'Tidak dinyatakan')}</p><ul>${acts}</ul><p><strong>Pemerhatian semasa perancangan:</strong> ${escapeReportHtml(p.observation||'Tiada')}</p><p><strong>Tarikh pelaksanaan:</strong> ${escapeReportHtml(p.implemented_on||'Belum direkodkan')}</p><p><strong>Refleksi guru:</strong> ${escapeReportHtml(p.reflection||'Belum direkodkan')}</p><p><strong>Langkah seterusnya:</strong> ${escapeReportHtml(p.next_step||'Belum direkodkan')}</p></article>`;
  }).join('');
  const title=scope==='student'?`Laporan individu — ${learnerName(studentId)}`:'Laporan kelas ae-MBPK';
  const rangeLabel=range==='all'?'Semua rekod yang dimuatkan':`${range} hari terakhir`;
  const learnerSummary=[...learnerIds].map(id=>{
    const rs=sessions.filter(r=>r.student_id===id);
    if(!rs.length)return '';
    const ss=rs.map(validScore).filter(v=>v!==null);
    const average=ss.length?(ss.reduce((a,b)=>a+b,0)/ss.length).toFixed(1)+'%':'Tidak tersedia';
    return `<tr><td>${escapeReportHtml(learnerName(id))}</td><td>${rs.length}</td><td>${average}</td><td>${rs.reduce((n,r)=>n+(Number(r.hints_used)||0),0)}</td><td>${plans.filter(p=>p.student_id===id).length}</td></tr>`;
  }).filter(Boolean).join('');
  const report=`<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeReportHtml(title)}</title><style>
  :root{color-scheme:light}*{box-sizing:border-box}body{font:15px/1.55 Arial,sans-serif;color:#172033;max-width:1100px;margin:32px auto;padding:0 22px}h1{font-size:28px;margin-bottom:5px}h2{font-size:20px;margin-top:28px;border-bottom:2px solid #dbe3ed;padding-bottom:7px}h3{font-size:16px}p{margin:7px 0}.meta,.note{color:#526175;font-size:13px}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:18px 0}.stat{border:1px solid #dbe3ed;border-radius:10px;padding:13px}.stat strong{display:block;font-size:23px}.stat span{font-size:12px;color:#526175}table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px}th,td{border:1px solid #dbe3ed;padding:8px;text-align:left;vertical-align:top}th{background:#f0f4f8}.plan{border:1px solid #dbe3ed;border-radius:10px;padding:14px;margin:12px 0;break-inside:avoid}.plan li{margin:4px 0}.disclaimer{background:#f4f7fa;border-left:4px solid #66788a;padding:12px;margin:18px 0}.toolbar{margin-bottom:18px}@media(max-width:650px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}body{padding:0 12px;overflow-wrap:anywhere}}@media print{body{margin:0 auto;padding:0 8mm;font-size:11pt}.toolbar{display:none}h2{break-after:avoid}table,.stat{break-inside:avoid}}
  </style></head><body><div class="toolbar"><button onclick="window.print()">Cetak / Simpan sebagai PDF</button></div>
  <h1>${escapeReportHtml(title)}</h1><p class="meta">Dijana: ${escapeReportHtml(new Date().toLocaleString('ms-MY'))} · Tempoh: ${escapeReportHtml(rangeLabel)} · Sumber: rekod yang dimuatkan dalam Portal Guru ae-MBPK</p>
  <div class="disclaimer"><strong>Nota interpretasi dan privasi</strong><br>Laporan ini ialah ringkasan rekod aktiviti dan perancangan guru, bukan diagnosis atau ukuran muktamad penguasaan. Skor mungkin berbeza mengikut permainan, bantuan dan konteks. Sahkan maklumat dengan pemerhatian guru dan suara murid. Fail ini mungkin mengandungi maklumat pendidikan yang perlu dilindungi.</div>
  <div class="stats"><div class="stat"><strong>${sessions.length}</strong><span>Sesi dalam tempoh</span></div><div class="stat"><strong>${new Set(sessions.map(r=>r.student_id)).size}</strong><span>Murid dengan sesi</span></div><div class="stat"><strong>${avg}</strong><span>Purata skor sesi yang tersedia</span></div><div class="stat"><strong>${totalHints}</strong><span>Petunjuk direkodkan</span></div></div>
  <h2>Ringkasan mengikut murid</h2><table><thead><tr><th>Murid</th><th>Sesi</th><th>Purata skor sesi*</th><th>Petunjuk</th><th>Pelan susulan</th></tr></thead><tbody>${learnerSummary||'<tr><td colspan="5">Tiada rekod sesi bagi skop dan tempoh dipilih.</td></tr>'}</tbody></table>
  <p class="note">*Purata hanya mengambil kira sesi yang menyimpan skor numerik 0–100. Ia bukan perbandingan prestasi yang setara antara permainan.</p>
  <h2>Sejarah sesi permainan</h2><table><thead><tr><th>Murid</th><th>Permainan</th><th>Kemahiran direkodkan</th><th>Tarikh</th><th>Skor sesi</th><th>Percubaan</th><th>Petunjuk</th></tr></thead><tbody>${sessionRows||'<tr><td colspan="7">Tiada sesi sepadan.</td></tr>'}</tbody></table>
  <h2>Pelan susulan, pelaksanaan dan refleksi</h2>${planRows||'<p>Tiada pelan susulan sepadan dengan skop/tempoh ini. Rekod pelan mungkin berada di luar tempoh yang dipilih.</p>'}
  <p class="note">Laporan dijana secara setempat oleh pelayar. Simpan, cetak atau kongsi hanya mengikut dasar privasi institusi.</p></body></html>`;
  const blob=new Blob([report],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ae-mbpk-laporan-${scope==='student'?'individu':'kelas'}-${new Date().toISOString().slice(0,10)}.html`;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
  reportStatus(`Laporan dijana: ${sessions.length} sesi dan ${plans.length} pelan susulan. Semak fail yang dimuat turun.`,'success');
}

function wireFollowup(){
  if(!$('followupStudent'))return;
  $('generateFollowupBtn').addEventListener('click',renderFollowup);
  $('saveFollowupBtn').addEventListener('click',saveGeneratedPlan);
  $('refreshFollowupPlansBtn').addEventListener('click',loadSavedPlans);
  $('generateLearningReportBtn').addEventListener('click',generateLearningReport);
  $('reportScope').addEventListener('change',()=>{const isStudent=$('reportScope').value==='student';$('reportStudent').disabled=!isStudent;});
  $('reportStudent').disabled=true;
  $('copyFollowupBtn').addEventListener('click',copyFollowup);
  $('downloadFollowupBtn').addEventListener('click',downloadFollowup);
  for(const id of ['followupStudent','followupFocus','followupSupport'])$(id).addEventListener('change',()=>{latestFollowup=null;setFollowupStatus('Pilihan berubah. Jana semula pelan untuk mengemas kini cadangan.');});
}

window.aeMbpkAnalytics={setContext({user,classId,students}){state.user=user||null;state.classId=classId||null;state.students=students||[];const panel=$('analyticsDashboard');if(panel)panel.classList.toggle('hidden',!user||!classId);fillFollowupStudents();fillReportStudents();latestFollowup=null;load();loadSavedPlans();},refresh:load};
document.addEventListener('DOMContentLoaded',()=>{if(!$('analyticsDashboard'))return;for(const id of ['analyticsStudentFilter','analyticsGameFilter','analyticsRangeFilter'])$(id).addEventListener('change',applyFilters);$('refreshAnalyticsBtn').addEventListener('click',load);$('exportAnalyticsBtn').addEventListener('click',exportCsv);wireFollowup();});
