import {configureMyBlockBlocks,installMyBlockFlyout,saveMyBlock} from './sbl-reference/myblocks.js';
import {installCommonWorkspace,syncArgumentColours} from './sbl-reference/common-blocks.js?v=0.7.0';
import {outputNames} from './sbl-reference/returns.js';
export function configureSblDialogs(Blockly){configureMyBlockBlocks(Blockly,id=>window.sblOpenMyBlock(id));}
export function installSblUi(ws,Blockly,onChange){
const $=id=>document.getElementById(id);
let editingMyBlockId=null;
function myBlockArgumentRow(name='',id=''){
  const row=document.createElement('div');row.className='myblock-argument';row.dataset.parameterId=id;
  const input=document.createElement('input');input.value=name;input.maxLength=40;input.placeholder='例：距離';input.setAttribute('aria-label','引数の名前');
  const remove=document.createElement('button');remove.type='button';remove.textContent='削除';remove.onclick=()=>row.remove();
  row.append(input,remove);$('myBlockArguments').append(row);
}
function myBlockReturnRow(name=''){
 const row=document.createElement('div');row.className='myblock-argument';const input=document.createElement('input');input.value=name;input.maxLength=40;input.placeholder='例：距離';input.setAttribute('aria-label','戻り値の名前');const remove=document.createElement('button');remove.type='button';remove.textContent='削除';remove.onclick=()=>row.remove();row.append(input,remove);$('myBlockReturns').append(row);
}
function showMyBlockReturns(){$('myBlockReturnSettings').hidden=$('myBlockReturn').value!=='number';if($('myBlockReturn').value==='number'&&!$('myBlockReturns').children.length)myBlockReturnRow('値');}
$('myBlockReturn').onchange=showMyBlockReturns;
$('myBlockAddReturn').onclick=()=>{if($('myBlockReturns').children.length>=8){$('myBlockError').textContent='戻り値は8個までです。';return;}myBlockReturnRow();};
function openMyBlockDialog(id=null){
  editingMyBlockId=id;const def=id?ws.getBlockById(id):null;
  $('myBlockReturn').value=def?.type==='procedures_defreturn'?'number':'none';$('myBlockReturns').replaceChildren();for(const name of outputNames(def))myBlockReturnRow(name);showMyBlockReturns();
  $('myBlockTitle').textContent=def?'マイブロックを編集':'マイブロックを作る';
  $('myBlockName').value=def?.getFieldValue('NAME')??'';$('myBlockArguments').replaceChildren();$('myBlockError').textContent='';
  for(const model of def?.getVarModels()??[])myBlockArgumentRow(model.getName(),model.getId());
  $('myBlockSubmit').textContent=def?'変更を保存':'作る';$('myBlockDialog').showModal();$('myBlockName').focus();
}
$('createMyBlock').onclick=()=>openMyBlockDialog();
$('myBlockAddArgument').onclick=()=>{if($('myBlockArguments').children.length>=8){$('myBlockError').textContent='引数は8個までです。';return;}myBlockArgumentRow();$('myBlockArguments').lastElementChild.querySelector('input').focus();};
$('myBlockCancel').onclick=()=>$('myBlockDialog').close();
$('myBlockForm').onsubmit=event=>{
  event.preventDefault();
  try{
    const rows=[...$('myBlockArguments').children].map(row=>({id:row.dataset.parameterId,name:row.querySelector('input').value}));
    const def=saveMyBlock(Blockly,ws,$('myBlockName').value,rows,editingMyBlockId,$('myBlockReturn').value==='number',[...$('myBlockReturns').children].map(row=>row.querySelector('input').value.trim()));
    syncArgumentColours(ws);
    for(const block of ws.getAllBlocks(false))if(['procedures_callnoreturn','procedures_callreturn','lab_call_outputs'].includes(block.type)&&!block.getInputsInline())block.setInputsInline(true);ws.refreshToolboxSelection();onChange();$('myBlockDialog').close();ws.centerOnBlock(def.id);
  }catch(error){$('myBlockError').textContent=error.message;}
};

window.sblOpenMyBlock=openMyBlockDialog;
installCommonWorkspace(ws,Blockly);installMyBlockFlyout(ws,openMyBlockDialog);
ws.addChangeListener(e=>{if(!e.isUiEvent)syncArgumentColours(ws);});
$('variableCancel').onclick=()=>$('variableDialog').close();
$('variableForm').onsubmit=e=>{e.preventDefault();const name=$('variableName').value.trim();if(!name||name.length>40){$('variableError').textContent='名前を1〜40文字にしてください。';return;}if(ws.getVariableMap().getAllVariables().some(m=>Blockly.Names.equals(m.getName(),name))){$('variableError').textContent='同じ名前が使われています。';return;}ws.getVariableMap().createVariable(name);ws.refreshToolboxSelection();$('variableDialog').close();onChange();};

ws.registerButtonCallback('LAB_CREATE_VARIABLE',()=>{$('variableName').value='';$('variableError').textContent='';$('variableDialog').showModal();$('variableName').focus();});
}
