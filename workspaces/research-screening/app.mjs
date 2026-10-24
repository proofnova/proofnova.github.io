import {data} from './site-data.mjs';
import {execute} from './browser.mjs';
const input=document.querySelector('#input'),output=document.querySelector('#output'),feedback=document.querySelector('#feedback'),summary=document.querySelector('#summary'),button=document.querySelector('#run'),select=document.querySelector('#case');
let worker=null;
function load(index){input.value=JSON.stringify(data.cases[index].input,null,2);output.textContent='실행하면 결과와 입력 해시가 표시됩니다.';summary.replaceChildren();feedback.textContent='예제는 합성 데이터입니다. 입력을 수정해 직접 실행할 수 있습니다.';}
function show(message){button.disabled=false;if(!message.ok){feedback.textContent='입력 또는 조건 확인: '+message.error;output.textContent=JSON.stringify(message,null,2);return;}output.textContent=JSON.stringify(message.output,null,2);summary.replaceChildren();for(const [key,val]of Object.entries(message.output.result.summary??{})){const span=document.createElement('span');span.textContent=key+' · '+String(val);summary.append(span);}feedback.textContent='계산 완료 · '+message.ms+' ms · 입력 해시 '+message.output.input_sha256.slice(0,16)+'… · 전체 결과의 findings/held/feasible 항목을 함께 확인하세요.';}
data.cases.forEach((f,i)=>{const option=document.createElement('option');option.value=i;option.textContent=(i?'경계 사례 · ':'기본 예제 · ')+f.name;select.append(option);});select.addEventListener('change',()=>load(Number(select.value)));load(0);
button.addEventListener('click',()=>{
 let value;try{if(input.value.length>1048576)throw new Error('입력은 1 MiB 이하여야 합니다.');value=JSON.parse(input.value);}catch(e){feedback.textContent='입력 확인: '+e.message;return;}
 button.disabled=true;feedback.textContent='브라우저 안에서 계산하고 있습니다…';worker?.terminate();
 function fallback(){const start=performance.now();try{show({ok:true,output:execute(value),ms:Math.round((performance.now()-start)*100)/100});}catch(e){show({ok:false,error:e.message,code:e.code??'INPUT_INVALID'});}}
 try{
  worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
  const timer=setTimeout(()=>{worker.terminate();button.disabled=false;feedback.textContent='10초 한도에 도달했습니다. 입력 크기나 search_limit을 줄여 다시 실행하세요. 불가능한 문제로 판정하지 않았습니다.';},10000);
  worker.onmessage=({data:message})=>{clearTimeout(timer);worker.terminate();show(message);};
  worker.onerror=()=>{clearTimeout(timer);worker.terminate();fallback();};
  worker.postMessage(value);
 }catch{fallback();}
});
document.querySelector('#download').addEventListener('click',()=>{const blob=new Blob([output.textContent],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=data.id+'-result.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
