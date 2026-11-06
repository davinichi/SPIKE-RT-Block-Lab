import {configureSblDialogs,installSblUi} from './sbl-ui.js';
import {annotateSupport} from './sbl-support.js';
import {setupBlocks,toolbox,workspaceProgram,sampleWorkspace} from './blocks.js';
import {generateProject} from './generator.js';
import {zipFiles} from './zip.js';
import {setupRich,richToolbox,workspaceProgramV2,validateWorkspaceState,richSample} from './rich-blocks.js';
const $=id=>document.getElementById(id);

setupRich(Blockly);configureSblDialogs(Blockly);
const ws=Blockly.inject('workspace',{media:'vendor/media/',toolbox:richToolbox(),trashcan:true,scrollbars:true,zoom:{controls:true,wheel:true,startScale:.9},renderer:'zelos',theme:Blockly.Theme.defineTheme('sblrt',{base:Blockly.Themes.Classic,fontStyle:{family:'"Yu Gothic UI", Meiryo, sans-serif',size:12}})});
const cdl=await(await fetch('rt-template.cdl')).text();let files=null,dirty=false;
const status=(text,error=false)=>{$('status').textContent=text;$('status').className=error?'error':'';};
installSblUi(ws,Blockly,()=>{dirty=true;generate();});
function program(){return workspaceProgramV2(ws);}

function generate(){const issues=annotateSupport(ws);$('capabilityNotice').textContent=issues.length?'RT未対応または制限に該当するブロックが'+issues.length+'個あります。作品は保存できます。C生成前に警告を解消してください。':'SBL保存版23と同じ15グループ・文言・順番です。SPIKE-RTはA〜Eのみ、実機未検証です。';try{files=generateProject(program(),cdl);$('code').textContent=files[$('source').value];status('Cコード生成済み · 実機未検証');return files;}catch(e){files=null;$('code').textContent='';status(e.message,true);return null;}}
const download=(data,name,type='application/octet-stream')=>{const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const project=()=>({format:'sbl-rt-project',version:1,appVersion:'0.3.1',name:$('name').value,target:'spike-rt-v0.2.0',workspace:Blockly.serialization.workspaces.save(ws)});
function restore(p){if(p?.format!=='sbl-rt-project'||p.version!==1||typeof p.name!=='string'||!p.workspace?.blocks)throw Error('SBL-RTの作品を選んでください。EBL・SBL形式の直接読込は未対応です。');validateWorkspaceState(p.workspace);const backup=Blockly.serialization.workspaces.save(ws);try{Blockly.serialization.workspaces.load(p.workspace,ws);}catch(e){Blockly.serialization.workspaces.load(backup,ws);throw e;}$('name').value=p.name.slice(0,64);dirty=false;generate();}
$('save').onclick=()=>{download(JSON.stringify(project(),null,2),'MyProgram.sblrt','application/json');dirty=false;};
$('open').onclick=()=>$('file').click();$('file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{if(f.size>2e6)throw Error('作品は2MB以下にしてください。');if(dirty&&!confirm('編集中の作品を置き換えます。保存しましたか？'))return;restore(JSON.parse(await f.text()));}catch(e){status(e.message,true);}};
$('generate').onclick=generate;$('source').onchange=generate;
$('export').onclick=()=>{const output=generate();if(output)download(zipFiles(output),'SBL-RT-C-source.zip');};
$('panel').onclick=()=>{$('workbench').hidden=!$('workbench').hidden;Blockly.svgResize(ws);};
$('transfer').onclick=()=>window.SBLDesktop?window.SBLDesktop.openTransfer():window.open('transfer.html','_blank');
$('build').onclick=async()=>{if(!window.SBLDesktop){status('DockerビルドはWindowsアプリで利用できます。CソースZIPを保存してください。',true);return;}if(!generate())return;const p=program();$('build').disabled=true;try{const result=await window.SBLDesktop.build(p);$('buildResult').textContent=result.cancelled?'キャンセルしました。':result.message;status(result.ok?'ビルド成功 · asp.binを保存しました':'ビルド未完了',!result.ok);}catch(e){status(e.message,true);}finally{$('build').disabled=false;}};
$('sample').onchange=()=>{const value=$('sample').value;$('sample').value='';if(!value)return;if(dirty&&!confirm('サンプルに置き換えます。保存しましたか？'))return;const example=richSample(value);if(example){restore({format:'sbl-rt-project',version:1,name:value,workspace:example});return;}if(value==='procedure'){restore({format:'sbl-rt-project',version:1,name:'MyBlockTest',workspace:{blocks:{languageVersion:0,blocks:[{type:'spike_start',x:40,y:40,next:{block:{type:'spike_call',fields:{NAME:'表示'}}}},{type:'sbl_proc',x:320,y:40,fields:{NAME:'表示'},inputs:{BODY:{block:{type:'spike_image',fields:{IMAGE:'heart'}}}}}]}}});}else restore({format:'sbl-rt-project',version:1,name:value,workspace:sampleWorkspace(value)});};
let timer;ws.addChangeListener(e=>{if(e.isUiEvent)return;dirty=true;files=null;clearTimeout(timer);timer=setTimeout(()=>{generate();try{localStorage.setItem('sblrt-0.3.1',JSON.stringify(project()));}catch{}},250);});
window.addEventListener('resize',()=>Blockly.svgResize(ws));window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
try{const saved=localStorage.getItem('sblrt-0.3.1')??localStorage.getItem('sblrt-0.3.0')??localStorage.getItem('sblrt-0.2.0');restore(saved?JSON.parse(saved):{format:'sbl-rt-project',version:1,name:'DisplayTest',workspace:sampleWorkspace('lights')});}catch{restore({format:'sbl-rt-project',version:1,name:'DisplayTest',workspace:sampleWorkspace('lights')});}
window.sblTest={program,generate,project,restore,workspace:ws};
