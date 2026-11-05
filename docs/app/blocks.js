import {PORTS, SAMPLES, ProgramError} from './model.js';
export function setupBlocks(Blockly) {
  const ports=()=>({type:'field_dropdown',name:'PORT',options:PORTS.map(p=>[p,p])});
  Blockly.defineBlocksWithJsonArray([
    {type:'spike_start',message0:'▶ スタート',nextStatement:null,colour:'#d39b24',tooltip:'つないだブロックを上から順番に実行します。'},
    {type:'spike_image',message0:'%1 をひょうじする',args0:[{type:'field_dropdown',name:'IMAGE',options:[['にこにこ','smile'],['ハート','heart'],['やじるし','arrow'],['けす','clear']]}],previousStatement:null,nextStatement:null,colour:'#965dc0'},
    {type:'spike_wait',message0:'%1 びょう まつ',args0:[{type:'field_number',name:'SECONDS',value:1,min:0,max:60,precision:.1}],previousStatement:null,nextStatement:null,colour:'#d39b24'},
    {type:'spike_motor',message0:'モーター %1 を %2 %3 で %4 びょう まわす',args0:[ports(),{type:'field_dropdown',name:'DIRECTION',options:[['せいかいてん','1'],['ぎゃくかいてん','-1']]},{type:'field_dropdown',name:'SPEED',options:[['ゆっくり','90'],['ふつう','180'],['はやく','360']]},{type:'field_number',name:'SECONDS',value:1,min:.1,max:30,precision:.1}],previousStatement:null,nextStatement:null,colour:'#168db4',tooltip:'ゆっくり90度/秒、ふつう180度/秒、はやく360度/秒。指定時間の後に止まります。'},
    {type:'spike_repeat',message0:'%1 かい くりかえす',args0:[{type:'field_number',name:'COUNT',value:3,min:1,max:1000,precision:1}],message1:'%1',args1:[{type:'input_statement',name:'BODY'}],previousStatement:null,nextStatement:null,colour:'#d39b24'},
    {type:'spike_forever',message0:'ずっと くりかえす',message1:'%1',args1:[{type:'input_statement',name:'BODY'}],previousStatement:null,nextStatement:null,colour:'#d39b24',tooltip:'止めるまで繰り返します。後ろのブロックへは進みません。'},
    {type:'spike_if_distance',message0:'もし きょりセンサー %1 が %2 cm より ちかいなら',args0:[ports(),{type:'field_number',name:'CM',value:15,min:4,max:200,precision:1}],message1:'%1',args1:[{type:'input_statement',name:'THEN'}],message2:'そうでなければ %1',args2:[{type:'input_statement',name:'ELSE'}],previousStatement:null,nextStatement:null,colour:'#4b9b68',tooltip:'測れないときは「そうでなければ」へ進みます。'}
  ]);
}
const labels={
  basic:{spike_image:'%1 をひょうじする',spike_wait:'%1 びょう まつ',spike_motor:'モーター %1 を %2 %3 で %4 びょう まわす',spike_repeat:'%1 かい くりかえす',spike_forever:'ずっと くりかえす',spike_if_distance:'もし きょりセンサー %1 が %2 cm より ちかいなら'},
  standard:{spike_image:'本体に画像 %1 を表示',spike_wait:'%1 秒待つ',spike_motor:'モーター %1 を %2 %3 で %4 秒回す',spike_repeat:'%1 回繰り返す',spike_forever:'ずっと繰り返す',spike_if_distance:'もし 距離センサー %1 が %2 cm より近いなら'}
};
// Re-register definitions before restoring a workspace, so labels change without changing IDs.
export function setBlockLanguage(Blockly,language) {
  const base=labels[language]??labels.basic;
  for(const [type,text] of Object.entries(base)) {
    const original=Blockly.Blocks[type]._labInit??Blockly.Blocks[type].init;
    Blockly.Blocks[type]._labInit=original;
    Blockly.Blocks[type].init=function(){
      const jsonInit=this.jsonInit;
      this.jsonInit=function(def){return jsonInit.call(this,{...def,message0:text});};
      try{original.call(this);}finally{this.jsonInit=jsonInit;}
    };
  }
}
export const toolbox={kind:'categoryToolbox',contents:[
  {kind:'category',name:'はじめる',colour:'#d39b24',contents:[{kind:'block',type:'spike_start'}]},
  {kind:'category',name:'ひかり',colour:'#965dc0',contents:[{kind:'block',type:'spike_image'}]},
  {kind:'category',name:'うごき',colour:'#168db4',contents:[{kind:'block',type:'spike_motor'}]},
  {kind:'category',name:'くりかえし',colour:'#d39b24',contents:['spike_wait','spike_repeat','spike_forever'].map(type=>({kind:'block',type}))},
  {kind:'category',name:'しらべる',colour:'#4b9b68',contents:[{kind:'block',type:'spike_if_distance'}]}
]};
export function workspaceProgram(workspace) {
  const starts=workspace.getTopBlocks(true).filter(b=>b.type==='spike_start'&&b.isEnabled());
  if(starts.length!==1)throw new ProgramError('「スタート」を1個置いてください。');
  let count=0;
  function chain(block,depth=0) {
    if(depth>20)throw new ProgramError('ブロックの入れ子は20段までにしてください。',block?.id);
    const result=[];
    while(block) {
      if(++count>500)throw new ProgramError('ブロックは500個までにしてください。',block.id);
      if(!block.isEnabled()){block=block.getNextBlock();continue;}
      const f=name=>block.getFieldValue(name), type=block.type.slice(6), node={type,id:block.id};
      switch(type) {
        case 'image':node.image=f('IMAGE');break;
        case 'wait':node.seconds=Number(f('SECONDS'));break;
        case 'motor':Object.assign(node,{port:f('PORT'),speed:Number(f('SPEED'))*Number(f('DIRECTION')),seconds:Number(f('SECONDS'))});break;
        case 'repeat':node.count=Number(f('COUNT'));node.body=chain(block.getInputTargetBlock('BODY'),depth+1);break;
        case 'forever':node.body=chain(block.getInputTargetBlock('BODY'),depth+1);if(block.getNextBlock())throw new ProgramError('「ずっと」の後ろには進みません。後ろのブロックを中へ移してください。',block.id);break;
        case 'if_distance':node.type='ifDistance';node.port=f('PORT');node.cm=Number(f('CM'));node.then=chain(block.getInputTargetBlock('THEN'),depth+1);node.else=chain(block.getInputTargetBlock('ELSE'),depth+1);break;
        default:throw new ProgramError('このブロックはまだ使えません。',block.id);
      }
      result.push(node);block=block.getNextBlock();
    }
    return result;
  }
  return {version:1,body:chain(starts[0].getNextBlock())};
}
export function sampleWorkspace(name) {
  function chain(nodes) {
    let next;
    for(const n of [...nodes].reverse()) {
      const type=n.type==='ifDistance'?'if_distance':n.type;
      const fields=n.type==='image'?{IMAGE:n.image}:n.type==='motor'?{PORT:n.port,SPEED:String(Math.abs(n.speed)),DIRECTION:String(Math.sign(n.speed)),SECONDS:n.seconds}:n.type==='repeat'?{COUNT:n.count}:n.type==='ifDistance'?{PORT:n.port,CM:n.cm}:{SECONDS:n.seconds};
      const inputs={};
      for(const [key,slot] of [['body','BODY'],['then','THEN'],['else','ELSE']])if(n[key]?.length)inputs[slot]={block:chain(n[key])};
      next={type:'spike_'+type,fields,inputs,...(next?{next:{block:next}}:{})};
    }
    return next;
  }
  const first=chain(SAMPLES[name].body);
  return {blocks:{languageVersion:0,blocks:[{type:'spike_start',x:50,y:40,next:{block:first}}]}};
}

