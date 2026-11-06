export function validOutputs(names){if(!Array.isArray(names)||!names.length||names.length>8||names.some(n=>typeof n!=='string'||!n.trim()||n.length>40)||new Set(names.map(n=>n.trim().toLowerCase())).size!==names.length)throw Error('戻り値は重複しない名前で1〜8個、名前は1〜40文字にしてください。');return names.map(n=>n.trim());}
export const isMyBlockDefinition=b=>['procedures_defnoreturn','procedures_defreturn'].includes(b?.type);
export const outputNames=def=>def?.type==='procedures_defreturn'?(def.returnNames_??['値']):[];
export function setupReturnBlocks(Blockly,openDialog=()=>{}) {
if(Blockly.Blocks.lab_call_outputs)return;
const ordinaryVariables=ws=>ws.getVariableMap().getAllVariables().filter(m=>!ws.getAllBlocks(false).filter(isMyBlockDefinition).some(d=>d.getVarModels().some(p=>p.getId()===m.getId())));
function setDefinitionOutputs(block,names){
 names=validOutputs(names);block.returnNames_=[...names];block.callType_='procedures_callreturn';
 for(let i=block.inputList.length-1;i>=0;i--){const name=block.inputList[i].name;if(/^RETURN[1-9]\d*$/.test(name)&&Number(name.slice(6))>=names.length)block.removeInput(name);}
 names.forEach((name,i)=>{const key=i?'RETURN'+i:'RETURN';let input=block.getInput(key);if(!input)input=block.appendValueInput(key);input.setCheck('Number');
  if(i===0){if(!block.getField('RETURN_LABEL0'))input.appendField(name,'RETURN_LABEL0');else block.setFieldValue(name,'RETURN_LABEL0');}
  else if(!block.getField('RETURN_LABEL'+i))input.appendField('返す値 '+name,'RETURN_LABEL'+i);else block.setFieldValue('返す値 '+name,'RETURN_LABEL'+i);
 });
}
// 丸い呼び出しは選んだ戻り値を1個返す。呼び出すたびに定義を実行し、結果を使い回さない。
{
 const base=Blockly.Blocks.procedures_callreturn,save=base.saveExtraState,load=base.loadExtraState,dom=base.domToMutation,mutation=base.mutationToDom;
 const init=base.init;base.init=function(){init.call(this);this.setOutput(true,'Number');this.setInputsInline(true);};
 base.setReturnChoices=function(names,selected=this.getFieldValue('RESULT')??'0'){
  names=validOutputs(names);selected=Number(selected);if(!Number.isInteger(selected)||selected<0||selected>=names.length)throw Error('戻り値の選択を確認してください。');this.returnNames_=[...names];
  if(!this.getInput('RESULT_ROW'))this.appendDummyInput('RESULT_ROW').appendField('戻り値').appendField(new Blockly.FieldDropdown(()=>this.returnNames_.map((name,i)=>[name,String(i)])),'RESULT');
  this.getField('RESULT').setOptions(names.map((name,i)=>[name,String(i)]));this.setFieldValue(String(selected),'RESULT');
  this.setTooltip('呼び出すたびに定義内の命令を実行し、選んだ戻り値を返します。別の戻り値の呼び出しでも再実行します。');
 };
 base.saveExtraState=function(){return {...save.call(this),outputs:this.returnNames_??['値'],output:Number(this.getFieldValue('RESULT')??0)};};
 base.loadExtraState=function(state){const selected=state.output??this.getFieldValue('RESULT')??'0';load.call(this,state);this.setReturnChoices(state.outputs??['値'],selected);};
 base.mutationToDom=function(){const node=mutation.call(this);node.setAttribute('outputs',JSON.stringify(this.returnNames_??['値']));node.setAttribute('output',this.getFieldValue('RESULT')??'0');return node;};
 base.domToMutation=function(node){const selected=this.getFieldValue('RESULT')??node.getAttribute('output')??'0';dom.call(this,node);const def=Blockly.Procedures.getDefinition(this.getProcedureCall(),this.workspace);this.setReturnChoices(def?outputNames(def):JSON.parse(node.getAttribute('outputs')??'["値"]'),selected);};
}
for(const type of ['procedures_defnoreturn','procedures_defreturn']){
 const base=Blockly.Blocks[type],init=base.init,save=base.saveExtraState,load=base.loadExtraState;
 base.init=function(){init.call(this);this.setMutator(null);if(type==='procedures_defreturn')setDefinitionOutputs(this,['値']);

 };
 if(type==='procedures_defreturn'){
  const mutation=base.mutationToDom; base.mutationToDom=function(...args){const node=mutation.apply(this,args);node.setAttribute('outputs',JSON.stringify(outputNames(this)));return node;};
  const dom=base.domToMutation;base.domToMutation=function(node){dom.call(this,node);setDefinitionOutputs(this,JSON.parse(node.getAttribute('outputs')??'["値"]'));};
  base.saveExtraState=function(){return {...save.call(this),outputs:outputNames(this)};};
  base.loadExtraState=function(state){load.call(this,state);setDefinitionOutputs(this,state.outputs??['値']);};
 }
}
// 1回の呼び出しで全戻り値を別々の変数に受け取る。呼び出しごとの作業領域はEV3側でも独立する。
{
 const base=Blockly.Blocks.procedures_callnoreturn;
 Blockly.Blocks.lab_call_outputs={...base,defType_:'procedures_defreturn',
  init(){base.init.call(this);this.setInputsInline(true);this.returnNames_=[];},
  setReturnTargets(names){
   names=validOutputs(names);this.returnNames_=[...names];
   for(let i=this.inputList.length-1;i>=0;i--){const key=this.inputList[i].name;if(/^OUT\d+$/.test(key)&&Number(key.slice(3))>=names.length)this.removeInput(key);}
   names.forEach((name,i)=>{const key='OUT'+i;if(!this.getInput(key))this.appendDummyInput(key).appendField(name+' →','OUT_LABEL'+i).appendField(new Blockly.FieldVariable(name),key);else this.setFieldValue(name+' →','OUT_LABEL'+i);const field=this.getField(key);if(!field.eblFiltered){const original=field.getOptions.bind(field);field.getOptions=function(cache){const ws=this.getSourceBlock().workspace.targetWorkspace??this.getSourceBlock().workspace,allowed=new Set(ordinaryVariables(ws).map(m=>m.getId()));return original(cache).filter(option=>!ws.getVariableMap().getVariableById(option[1])||allowed.has(option[1])||option[1]===this.getValue());};field.eblFiltered=true;}});
  },
  saveExtraState(){return {...base.saveExtraState.call(this),outputs:this.returnNames_};},
  loadExtraState(state){base.loadExtraState.call(this,state);this.setReturnTargets(state.outputs??['値']);},
  domToMutation(node){base.domToMutation.call(this,node);const def=Blockly.Procedures.getDefinition(this.getProcedureCall(),this.workspace);this.setReturnTargets(def?outputNames(def):this.returnNames_??['値']);}
 };
}
Blockly.Blocks.lab_return_values={
 init(){this.setPreviousStatement(true);this.setColour('#aa597e');this.setInputsInline(true);this.returnNames_=[];this.loadExtraState({outputs:['値1','値2']});},
 saveExtraState(){return {outputs:this.returnNames_};},
 loadExtraState(state){this.returnNames_=validOutputs(state.outputs??['値1','値2']);for(const input of [...this.inputList])if(/^VALUE\d+$/.test(input.name)&&Number(input.name.slice(5))>=this.returnNames_.length)this.removeInput(input.name);this.returnNames_.forEach((name,i)=>{const key='VALUE'+i;if(!this.getInput(key))this.appendValueInput(key).setCheck('Number').appendField(name,'LABEL'+i);else this.setFieldValue(name,'LABEL'+i);});if(!this.getInput('END'))this.appendDummyInput('END').appendField('を返してこのマイブロックを終了する');else this.moveInputBefore('END',null);}
};

Blockly.defineBlocksWithJsonArray([{type:'lab_return_value',message0:'%1 を返してこのマイブロックを終了する',args0:[{type:'input_value',name:'VALUE',check:'Number'}],previousStatement:null,inputsInline:true,colour:'#aa597e'}]);
}
