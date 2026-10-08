import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const catalog=JSON.parse(await readFile('dist/morphiq/catalog.json','utf8'));
const glossary=JSON.parse(await readFile('dist/morphiq/glossary.json','utf8'));
let script=await readFile('dist/morphiq/app.js','utf8');
script=script.replace(/^const \[catalog,glossary\]=[^\n]+/, 'const {catalog,glossary}=fixtures;');
script=script.replace(/render\(\);\s*$/, '');
const elements=new Map([['app',{addEventListener(){}}],['fullscreen-link',{}]]);
const context={fixtures:{catalog,glossary},assert,URL,URLSearchParams,Number,Set,Map,
 location:{pathname:'/components/aurora',search:'?speed=0&intensity=NaN&baseColor=invalid',origin:'http://localhost',hash:''},
 localStorage:{getItem(){return null;}},
 document:{getElementById:id=>elements.get(id),querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){}},
 window:{addEventListener(){}},history:{replaceState(_state,_title,url){context.lastUrl=url;}},
 clearTimeout(){},setTimeout(){},requestAnimationFrame(){},
 fetch:async()=>({ok:false}),
};
script+=`
assert(detailPage(catalog.find(e=>e.slug==='aurora')).includes('full?'));
assert.equal(previewValues.speed,0,'Zero-valued URL control must survive navigation');
assert.equal(previewValues.intensity,1,'Nonfinite values must use the default');
assert.equal(previewValues.baseColor,'#05010a','Invalid colors must use the default');
location.search='?speed=999';detailPage(currentEntry);
assert.equal(previewValues.speed,3,'Out-of-range values must be clamped');
updateProp({dataset:{prop:'speed'},value:'0'});
assert.equal(lastUrl,'/components/aurora?speed=0');
assert.equal(document.getElementById('fullscreen-link').href,'/components/aurora/full?speed=0');
assert(fullscreen(currentEntry).includes('/components/aurora?speed=999'),'Full-screen exit retains parameters');
location.pathname='/components';location.search='';query='aurora';
assert(filteredEntries().some(e=>e.slug==='aurora'),'Search includes the named component');
assert(filteredEntries().length<catalog.length,'Search must filter the catalog');
query='';category='Text Animations';
assert(filteredEntries().every(e=>e.category==='Text Animations'),'Category filtering');
category='All';sort='name';const alphabetic=filteredEntries();
assert(alphabetic.every((e,i)=>i===0||alphabetic[i-1].displayName.localeCompare(e.displayName)<=0),'Alphabetical sorting');
assert(galleryPage().includes('value="name" selected'),'Sort selection survives rerender');
location.pathname='/favorites';saved=new Set(['aurora']);
assert.equal(filteredEntries().map(e=>e.slug).join(','),'aurora','Favorites filtering');
location.pathname='/other/aurora';render();
assert(document.getElementById('app').innerHTML.includes('Page not found.'),'Unknown routes do not render component details');
`;
vm.runInNewContext(script,context,{filename:'Morphiq behavior checks'});
console.log('Verified control URL validation, full-screen settings, search, categories, sorting, favorites, and unknown routes.');
