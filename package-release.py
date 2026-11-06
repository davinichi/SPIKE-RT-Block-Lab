from pathlib import Path
import shutil,zipfile,hashlib,json
root=Path(__file__).resolve().parent
runtime=root/'node_modules/electron/dist'
out=root/'release/SBL-RT-Windows-0.2.0'
out.mkdir(parents=True,exist_ok=True)
for p in runtime.iterdir():
    target=out/('SBL-RT.exe' if p.name=='electron.exe' else p.name)
    if p.is_dir():shutil.copytree(p,target,dirs_exist_ok=True)
    else:shutil.copy2(p,target)
default=out/'resources/default_app.asar'
if default.exists():default.unlink()
app=out/'resources/app'
app.mkdir(parents=True,exist_ok=True)
for name in ['web','tests']:
    shutil.copytree(root/name,app/name,dirs_exist_ok=True)
for name in ['package.json','main.cjs','preload.cjs','server.mjs','build-service.mjs','README.md','THIRD_PARTY.md','RT-NOTICE.txt','TEST_RESULTS.md','export-samples.mjs']:
    shutil.copy2(root/name,app/name)
shutil.copy2(root/'README.md',out/'README.md')
archive=out.parent/(out.name+'.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in out.rglob('*'):
        if p.is_file():z.write(p,p.relative_to(out.parent))
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256').write_text(digest+'  '+archive.name+'\n')
print(json.dumps({'file':str(archive),'bytes':archive.stat().st_size,'sha256':digest}))
