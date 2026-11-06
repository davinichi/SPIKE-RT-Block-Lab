import {setupBlocks,toolbox,workspaceProgram,sampleWorkspace} from './blocks.js';
import {generateProject} from './generator.js';
import {zipFiles} from './zip.js';
const $=id=>document.getElementById(id);
setupBlocks(Blockly);
Blockly.defineBlocksWithJsonArray([
 {type:'sbl_proc',message0:'マイブロック %1',args0:[{type:'field_input',name:'NAME',text:'動作'}],message1:'%1',args1:[{type:'input_statement',name:'BODY'}],colour:'#aa597e'},
 {type:'spike_call',message0:'マイブロック %1 を実行',args0:[{type:'field_input',name:'NAME',text:'動作'}],previousStatement:null,nextStatement:null,colour:'#aa597e'}
]);
toolbox.contents.push({kind:'category',name:'マイブロック',colour:'#aa597e',contents:[{kind:'block',type:'sbl_proc'},{kind:'block',type:'spike_call'}]});
const ws=Blockly.inject('workspace',{media:'vendor/media/',toolbox,trashcan:true,scrollbars:true,zoom:{controls:true,wheel:true,startScale:.9},theme:Blockly.Themes.Classic});
const cdl=await(await fetch('rt-template.cdl')).text();let files=null,dirty=false;
const status=(text,error=false)=>{$('status').textContent=text;$('status').className=error?'error':'';};
function program(){
 // Convert using the basic translator, with procedure calls represented separately.
 const starts=ws.getTopBlocks(true).filter(b=>b.isEnabled()&&b.type==='spike_start');
 if(starts.length!==1)throw Error('スタートは１つ置いてください。');
 let count=0;
 function chain(b,depth=0){if(depth>20)throw Error('入れ子は20段までです。');const out=[];while(b){if(++count>500)throw Error('ブロックは500個までです。');if(!b.isEnabled()){b=b.getNextBlock();continue;}const f=n=>b.getFieldValue(n),node={type:b.type.slice(6),id:b.id};switch(b.type){case 'spike_image':node.image=f('IMAGE');break;case 'spike_wait':node.seconds=Number(f('SECONDS'));break;case 'spike_motor':Object.assign(node,{port:f('PORT'),speed:Number(f('SPEED'))*Number(f('DIRECTION')),seconds:Number(f('SECONDS'))});break;case 'spike_call':node.name=f('NAME');break;case 'spike_repeat':node.count=Number(f('COUNT'));node.body=chain(b.getInputTargetBlock('BODY'),depth+1);break;case 'spike_forever':if(b.getNextBlock())throw Error('ずっと繰り返すブロックの後には進めません。');node.body=chain(b.getInputTargetBlock('BODY'),depth+1);break;case 'spike_if_distance':Object.assign(node,{type:'ifDistance',port:f('PORT'),cm:Number(f('CM')),then:chain(b.getInputTargetBlock('THEN'),depth+1),else:chain(b.getInputTargetBlock('ELSE'),depth+1)});break;default:throw Error('未対応ブロックです: '+b.type);}out.push(node);b=b.getNextBlock();}return out;}
 return {version:1,body:chain(starts[0].getNextBlock()),procedures:ws.getTopBlocks(true).filter(b=>b.isEnabled()&&b.type==='sbl_proc').map(b=>({name:b.getFieldValue('NAME'),body:chain(b.getInputTargetBlock('BODY'))}))};
}
function generate(){try{files=generateProject(program(),cdl);$('code').textContent=files[$('source').value];status('Cコード生成済み · 実機未検証');return files;}catch(e){files=null;$('code').textContent='';status(e.message,true);return null;}}
const download=(data,name,type='application/octet-stream')=>{const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const project=()=>({format:'sbl-rt-project',version:1,appVersion:'0.1.1',name:$('name').value,target:'spike-rt-v0.2.0',workspace:Blockly.serialization.workspaces.save(ws)});
function restore(p){if(p?.format!=='sbl-rt-project'||p.version!==1||typeof p.name!=='string'||!p.workspace?.blocks)throw Error('SBL-RTの作品を選んでください。EBL・SBL形式の直接読込は未対応です。');let count=0;const allowed=new Set(['spike_start','spike_image','spike_wait','spike_motor','spike_repeat','spike_forever','spike_if_distance','spike_call','sbl_proc']);function check(x,depth=0){if(depth>100)throw Error('作品の入れ子が深すぎます。');if(!x||typeof x!=='object')return;if(x.fields?.PORT==='F')throw Error('ポートFを使う作品です。公式SDK版はA〜Eのみ対応します。元の作品は変更していません。');if(x.type&&(!allowed.has(x.type)||++count>500))throw Error('未対応ブロックまたは上限超過です。');Object.values(x).forEach(v=>check(v,depth+1));}check(p.workspace);const backup=Blockly.serialization.workspaces.save(ws);try{Blockly.serialization.workspaces.load(p.workspace,ws);}catch(e){Blockly.serialization.workspaces.load(backup,ws);throw e;}$('name').value=p.name.slice(0,64);dirty=false;generate();}
$('save').onclick=()=>{download(JSON.stringify(project(),null,2),'MyProgram.sblrt','application/json');dirty=false;};
$('open').onclick=()=>$('file').click();$('file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{if(f.size>2e6)throw Error('作品は2MB以下にしてください。');if(dirty&&!confirm('編集中の作品を置き換えます。保存しましたか？'))return;restore(JSON.parse(await f.text()));}catch(e){status(e.message,true);}};
$('generate').onclick=generate;$('source').onchange=generate;
$('export').onclick=()=>{const output=generate();if(output)download(zipFiles(output),'SBL-RT-C-source.zip');};
$('panel').onclick=()=>{$('workbench').hidden=!$('workbench').hidden;Blockly.svgResize(ws);};
$('transfer').onclick=()=>window.SBLDesktop?window.SBLDesktop.openTransfer():window.open('transfer.html','_blank');
$('build').onclick=async()=>{if(!window.SBLDesktop){status('DockerビルドはWindowsアプリで利用できます。CソースZIPを保存してください。',true);return;}if(!generate())return;const p=program();$('build').disabled=true;try{const result=await window.SBLDesktop.build(p);$('buildResult').textContent=result.cancelled?'キャンセルしました。':result.message;status(result.ok?'ビルド成功 · asp.binを保存しました':'ビルド未完了',!result.ok);}catch(e){status(e.message,true);}finally{$('build').disabled=false;}};
$('sample').onchange=()=>{const value=$('sample').value;$('sample').value='';if(!value)return;if(dirty&&!confirm('サンプルに置き換えます。保存しましたか？'))return;if(value==='procedure'){restore({format:'sbl-rt-project',version:1,name:'MyBlockTest',workspace:{blocks:{languageVersion:0,blocks:[{type:'spike_start',x:40,y:40,next:{block:{type:'spike_call',fields:{NAME:'表示'}}}},{type:'sbl_proc',x:320,y:40,fields:{NAME:'表示'},inputs:{BODY:{block:{type:'spike_image',fields:{IMAGE:'heart'}}}}}]}}});}else restore({format:'sbl-rt-project',version:1,name:value,workspace:sampleWorkspace(value)});};
let timer;ws.addChangeListener(e=>{if(e.isUiEvent)return;dirty=true;files=null;clearTimeout(timer);timer=setTimeout(()=>{generate();try{localStorage.setItem('sblrt-0.1.1',JSON.stringify(project()));}catch{}},250);});
window.addEventListener('resize',()=>Blockly.svgResize(ws));window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
try{const saved=localStorage.getItem('sblrt-0.1.1');restore(saved?JSON.parse(saved):{format:'sbl-rt-project',version:1,name:'DisplayTest',workspace:sampleWorkspace('lights')});}catch{restore({format:'sbl-rt-project',version:1,name:'DisplayTest',workspace:sampleWorkspace('lights')});}
window.sblTest={program,generate,project,restore,workspace:ws};
