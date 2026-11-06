import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export function snapshot(Blockly,toolbox,types){
 const ws=new Blockly.Workspace();
 try{return {toolbox,blocks:Object.fromEntries([...new Set(types)].sort().map(type=>{
  const b=ws.newBlock(type);
  const result={colour:b.getColour(),previous:!!b.previousConnection,next:!!b.nextConnection,output:b.outputConnection?.getCheck()??(b.outputConnection?[]:null),inline:b.getInputsInline()??false,
   inputs:b.inputList.map(i=>({name:i.name,type:i.type,check:i.connection?.getCheck()??null,fields:i.fieldRow.map(f=>({name:f.name??null,text:f.getText(),...(f.getOptions?{options:f.getOptions(false).map(o=>[typeof o[0]==='string'?o[0]:JSON.stringify(o[0]),f.getVariable?.()&&ws.getVariableMap().getVariableById(o[1])?'variable:'+ws.getVariableMap().getVariableById(o[1]).getName():o[1]])}:{})}))}))};
  b.dispose();return [type,result];
 }))};}finally{ws.dispose();}
}
export async function verifySourceHashes(){
 const root=new URL('../web/sbl-reference/',import.meta.url),meta=JSON.parse(await readFile(new URL('provenance.json',root),'utf8'));
 return Promise.all(Object.entries(meta.files).map(async([name,expected])=>({name,expected,actual:createHash('sha256').update(await readFile(new URL(name,root))).digest('hex')})));
}
