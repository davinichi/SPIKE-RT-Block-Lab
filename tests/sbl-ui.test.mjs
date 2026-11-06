import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as Blockly from 'blockly';
import * as Ja from 'blockly/msg/ja';
import {setupRich,richToolbox,workspaceProgramV2,validateWorkspaceState} from '../web/rich-blocks.js';
import {STANDARD_TYPES} from '../web/sbl-reference/classroom-blocks.js';
import {configureMyBlockBlocks,saveMyBlock,installMyBlockFlyout} from '../web/sbl-reference/myblocks.js';
import {generateProject} from '../web/generator.js';
import {snapshot,verifySourceHashes} from './ui-contract.mjs';
Blockly.setLocale(Ja);setupRich(Blockly);configureMyBlockBlocks(Blockly,()=>{});
const cdl=await readFile(new URL('../web/rt-template.cdl',import.meta.url),'utf8');
test('all canonical SBL source files have the recorded published v23 hashes',async()=>{for(const x of await verifySourceHashes())assert.equal(x.actual,x.expected,x.name);});
test('15 group names, order, every palette entry, labels, arguments, defaults and choices match published SBL',async()=>{
 const expected=JSON.parse(await readFile(new URL('./fixtures/sbl-ui-v23.json',import.meta.url),'utf8'));
 assert.equal(richToolbox().contents.length,15);
 assert.deepEqual(snapshot(Blockly,richToolbox(),['spike_start',...STANDARD_TYPES]),expected);
});
test('SBL My Block definitions, named arguments and numeric return calls save, reload and generate three C files',()=>{
 const ws=new Blockly.Workspace(),other=new Blockly.Workspace();Blockly.Events.disable();
 try{
  const def=saveMyBlock(Blockly,ws,'加算',[{name:'左'},{name:'右'}],null,true,['答え']);
  const sum=ws.newBlock('lab_op_add');for(let i=0;i<2;i++){const arg=ws.newBlock('lab_argument');const m=def.getVarModels()[i];arg.loadExtraState({parameterId:m.getId(),name:m.getName()});sum.getInput(i?'B':'A').connection.connect(arg.outputConnection);}
  def.getInput('RETURN').connection.connect(sum.outputConnection);
  const start=ws.newBlock('spike_start'),show=ws.newBlock('lab_display_number');start.nextConnection.connect(show.previousConnection);
  const call=ws.newBlock('procedures_callreturn');call.loadExtraState({name:'加算',params:['左','右'],outputs:['答え'],output:0});
  for(let i=0;i<2;i++){const n=ws.newBlock('math_number');n.setFieldValue(i+2,'NUM');call.getInput('ARG'+i).connection.connect(n.outputConnection);}show.getInput('VALUE').connection.connect(call.outputConnection);
  const state=Blockly.serialization.workspaces.save(ws);validateWorkspaceState(state);Blockly.serialization.workspaces.load(state,other);
  const p=workspaceProgramV2(other),files=generateProject(p,cdl);assert.equal(p.body[0].value.kind,'call');assert.equal(p.procedures[0].body[0].value.a.kind,'param');assert.equal(Object.keys(files).filter(n=>n.endsWith('.c')).length,3);
  assert.deepEqual(workspaceProgramV2(ws),p);
 }finally{ws.dispose();other.dispose();Blockly.Events.enable();}
});
