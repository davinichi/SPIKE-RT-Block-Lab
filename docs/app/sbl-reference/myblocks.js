import {isMyBlockDefinition,outputNames,validOutputs} from './returns.js';
// Same form, argument rows, editing entries and connection preservation as EV3 Lab.
export function configureMyBlockBlocks(Blockly,openDialog) {
  const call=Blockly.Blocks.procedures_callnoreturn;
  const callInit=call._formInit??call.init;call._formInit=callInit;
  call.init=function(){callInit.call(this);this.setInputsInline(true);};
  for(const type of ['procedures_defnoreturn','procedures_defreturn']){
  const definition=Blockly.Blocks[type];
  const original=definition._formInit??definition.init;definition._formInit=original;
  definition.init=function(){
    original.call(this);this.setMutator(null);
    const menu=this.customContextMenu;
    this.customContextMenu=function(options){menu?.call(this,options);options.unshift({text:'名前・引数・戻り値を編集',enabled:true,callback:()=>openDialog(this.id)});};
  };
  }
}
export function installMyBlockFlyout(workspace,openDialog) {
  workspace.registerButtonCallback('LAB_CREATE_MYBLOCK',()=>openDialog());
  workspace.registerToolboxCategoryCallback('PROCEDURE',ws=>{
    const items=[{kind:'button',text:'マイブロックを作る',callbackKey:'LAB_CREATE_MYBLOCK'}];
    for(const def of ws.getAllBlocks(false).filter(isMyBlockDefinition)){
      const name=def.getFieldValue('NAME'),models=def.getVarModels(),key='LAB_EDIT_'+def.id;
      workspace.registerButtonCallback(key,()=>openDialog(def.id));
      items.push({kind:'block',type:def.type==='procedures_defreturn'?'procedures_callreturn':'procedures_callnoreturn',extraState:{name,params:models.map(m=>m.getName()),...(outputNames(def).length?{outputs:outputNames(def)}:{})},inputs:Object.fromEntries(models.map((m,i)=>['ARG'+i,{shadow:{type:'math_number',fields:{NUM:0}}}]))},{kind:'button',text:'「'+name+'」を編集',callbackKey:key});
    }
    for(const def of ws.getAllBlocks(false).filter(b=>outputNames(b).length)){const name=def.getFieldValue('NAME'),outputs=outputNames(def);items.push({kind:'block',type:'lab_call_outputs',extraState:{name,params:def.getVarModels().map(m=>m.getName()),outputs},inputs:Object.fromEntries(def.getVarModels().map((m,i)=>['ARG'+i,{shadow:{type:'math_number',fields:{NUM:0}}}]))},{kind:'block',type:'lab_return_values',extraState:{outputs},inputs:Object.fromEntries(outputs.map((_,i)=>['VALUE'+i,{shadow:{type:'math_number',fields:{NUM:0}}}]))});}
    items.push({kind:'block',type:'lab_return_value',inputs:{VALUE:{shadow:{type:'math_number',fields:{NUM:0}}}}});
    return items;
  });
}
export function saveMyBlock(Blockly,ws,name,rows,definitionId=null,returnsValue=undefined,returnNames=undefined) {
  name=String(name).trim();rows=rows.map(row=>({name:String(row.name).trim(),id:row.id||''}));
  const defs=ws.getAllBlocks(false).filter(isMyBlockDefinition);
  const def=definitionId?ws.getBlockById(definitionId):null;
  if(definitionId&&(!def||!isMyBlockDefinition(def)))throw Error('編集する定義が見つかりません。');
  const targetType=(returnsValue??(def?.type==='procedures_defreturn'))?'procedures_defreturn':'procedures_defnoreturn';
  const names=targetType==='procedures_defreturn'?validOutputs(returnNames??(outputNames(def).length?outputNames(def):['値'])):[];
  const callers=def?Blockly.Procedures.getCallers(def.getFieldValue('NAME'),ws):[];
  if(def&&(def.type!==targetType||outputNames(def).length!==names.length)&&callers.length)throw Error('戻り値の有無・個数を変える前に呼び出しを外し、変更後に置き直してください。');
  if(def)for(let i=names.length;i<outputNames(def).length;i++){const child=def.getInputTargetBlock(i?'RETURN'+i:'RETURN');if(child&&!child.isShadow())throw Error('削除する戻り値の計算ブロックを先に外してください。');}
  if(!name||name.length>60)throw Error('マイブロックの名前を1〜60文字で入力してください。');
  if(defs.some(b=>b!==def&&b.getFieldValue('NAME').toLowerCase()===name.toLowerCase()))throw Error('同じ名前のマイブロックがあります。');
  if(!def&&defs.length>=32)throw Error('マイブロックは32個までです。');
  if(rows.length>8||rows.some(r=>!r.name||r.name.length>40))throw Error('引数は8個まで、名前は1〜40文字で入力してください。');
  if(new Set(rows.map(r=>r.name.toLowerCase())).size!==rows.length)throw Error('引数には別々の名前を付けてください。');
  const oldModels=def?.getVarModels()??[],oldIds=oldModels.map(m=>m.getId());
  if(rows.some(r=>r.id&&!oldIds.includes(r.id))||new Set(rows.filter(r=>r.id).map(r=>r.id)).size!==rows.filter(r=>r.id).length)throw Error('引数の編集情報を確認してください。');
  const body=def?.getDescendants(false)??[];
  const bodyIds=new Map(body.map(b=>{
    if(b.type!=='lab_argument')return [b.id,b.getFieldValue('VAR')];
    const parameter=oldModels.find(m=>m.getId()===b.parameterId)??oldModels.find(m=>m.getName()===b.getFieldValue('ARG_NAME'));
    return [b.id,parameter?.getId()??b.parameterId];
  }));
  for(const block of body){const id=bodyIds.get(block.id);if(oldIds.includes(id)&&!rows.some(r=>r.id===id))throw Error('使っている引数は削除できません。定義の中の引数ブロックを先に外してください。');}
  const backup=Blockly.serialization.workspaces.save(ws),oldName=def?.getFieldValue('NAME');
  const calls=def?Blockly.Procedures.getCallers(oldName,ws).map(call=>({call,args:oldIds.map((id,i)=>({id,block:call.getInputTargetBlock('ARG'+i)}))})):[];
  const previousGroup=Blockly.Events.getGroup();Blockly.Events.setGroup(previousGroup||true);
  try{
    for(const {args} of calls)for(const argument of args)if(argument.block){argument.state=Blockly.serialization.blocks.save(argument.block);argument.block.unplug();}
    const models=rows.map(row=>ws.getVariableMap().getVariable(row.name,'')??ws.getVariableMap().createVariable(row.name));
    let target=def;
    if(def&&def.type!==targetType){const state=Blockly.serialization.blocks.save(def);state.type=targetType;if(state.inputs&&targetType==='procedures_defnoreturn')for(const key of Object.keys(state.inputs))if(/^RETURN\d*$/.test(key))delete state.inputs[key];def.dispose(false);target=Blockly.serialization.blocks.append(state,ws);}
    target??=ws.newBlock(targetType);
    target.setFieldValue(name,'NAME');target.loadExtraState({params:models.map(m=>({name:m.getName(),id:m.getId()})),...(names.length?{outputs:names}:{})});
    for(const previous of body){const block=ws.getBlockById(previous.id);if(!block)continue;if(block.type==='lab_return_values')block.loadExtraState({outputs:names});const i=rows.findIndex(row=>row.id===bodyIds.get(block.id));if(i<0)continue;
      if(block.type==='lab_argument'){block.parameterId=models[i].getId();block.setFieldValue(rows[i].name,'ARG_NAME');}
      else if(['variables_get','variables_set','math_change'].includes(block.type))block.setFieldValue(models[i].getId(),'VAR');
    }
    for(const {call,args} of calls){
      call.renameProcedure(call.getProcedureCall(),name);const selected=call.getFieldValue('RESULT')??0;const targets=call.type==='lab_call_outputs'?outputNames(def).map((_,i)=>call.getFieldValue('OUT'+i)):[];call.loadExtraState({name,params:rows.map(row=>row.name),...(names.length?{outputs:names,output:Number(selected)}:{})});targets.forEach((id,i)=>call.setFieldValue(id,'OUT'+i));
      rows.forEach((row,i)=>{
        const previous=args.find(argument=>argument.id===row.id),connection=call.getInput('ARG'+i).connection;
        if(previous?.state){let child=ws.getBlockById(previous.state.id);if(!child)child=Blockly.serialization.blocks.append(previous.state,ws);connection.connect(child.outputConnection);}
        else connection.setShadowState({type:'math_number',fields:{NUM:0}});
      });
    }
    if(names.length)names.forEach((_,i)=>{const input=target.getInput(i?'RETURN'+i:'RETURN');if(!input.connection.targetBlock())input.connection.setShadowState({type:'math_number',fields:{NUM:0}});});
    target.initSvg?.();target.render?.();
    if(!def){const bottom=Math.max(20,...ws.getTopBlocks(false).filter(b=>b!==target).map(b=>b.getRelativeToSurfaceXY().y+(b.getHeightWidth?.().height??80)));target.moveBy(60,bottom+60);}
    return target;
  }catch(error){Blockly.serialization.workspaces.load(backup,ws);throw error;}
  finally{Blockly.Events.setGroup(previousGroup);}
}
