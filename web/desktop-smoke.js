// Developer-only integration checks, invoked by the hidden Electron smoke runner.
const pause=()=>new Promise(resolve=>setTimeout(resolve,80));
export async function checkCategory(index){
 const ws=window.sblTest.workspace,toolbox=ws.getToolbox(),items=toolbox.getToolboxItems();
 toolbox.setSelectedItem(items[index]);await pause();
 return {name:items[index].getName(),blocks:ws.getFlyout().getWorkspace().getTopBlocks(false).map(b=>b.type)};
}
export async function checkDialogsAndPreservation(){
 const t=window.sblTest,initial=t.project();
 document.getElementById('createMyBlock').click();
 if(!document.getElementById('myBlockDialog').open)throw Error('My Block dialog did not open');
 document.getElementById('myBlockName').value='画面試験';
 document.getElementById('myBlockAddArgument').click();
 document.querySelector('#myBlockArguments input').value='入力';
 document.getElementById('myBlockReturn').value='number';document.getElementById('myBlockReturn').dispatchEvent(new Event('change'));
 document.getElementById('myBlockForm').requestSubmit();await pause();
 if(document.getElementById('myBlockDialog').open)throw Error(document.getElementById('myBlockError').textContent);
 if(!t.workspace.getAllBlocks(false).some(b=>b.type==='procedures_defreturn'))throw Error('SBL definition was not created');
 const created=t.project();t.restore(created);
 const block=t.workspace.newBlock('lab_log_start');block.setFieldValue('保持試験','NAME');block.initSvg();block.render();
 const port=t.workspace.newBlock('lab_distance');port.setFieldValue('F','PORT');port.initSvg();port.render();
 const saved=t.project();t.restore(saved);
 if(t.generate()!==null)throw Error('Unsupported/F program unexpectedly generated C');
 if(!t.project().workspace.blocks.blocks.some(b=>b.type==='lab_log_start'&&b.fields.NAME==='保持試験'))throw Error('Unsupported data was lost');
 if(t.workspace.getAllBlocks(false).find(b=>b.type==='lab_distance')?.getFieldValue('PORT')!=='F')throw Error('Port F was remapped');
 t.restore(initial);if(!t.generate())throw Error('Initial project no longer generates');
 return {myBlockDialog:true,canonicalDefinition:true,savedReloaded:true,unsupportedPreserved:true,portFPreserved:true,exportBlocked:true};
}
