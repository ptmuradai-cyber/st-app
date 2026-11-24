/* v1.2 workspace: presentation/navigation only; no persistence or network operations. */
(function(){'use strict';
const $=id=>document.getElementById(id),body=document.body,app=body.dataset.app;
function pick(scope,name){for(const b of scope.querySelectorAll(':scope>.h-tabbar>[data-h-pane-target]')){const active=b.dataset.hPaneTarget===name;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}for(const pane of scope.querySelectorAll(':scope>[data-h-pane]'))pane.dataset.selected=String(pane.dataset.hPane===name);}
function attentionBusy(){return !!window.StAttentionUI?.busy();}
function view(name){if(app==='attention'){if(attentionBusy()&&name==='history'){alert('訓練を終了し、結果を保存してから履歴を開いてください。');return;}body.dataset.hView=name;if(name==='history')window.StAttentionUI?.refreshHistory();}}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-h-settings')){$('workspace-settings').showModal();return;}
 if(b.hasAttribute('data-h-close-settings')){$('workspace-settings').close();return;}
 if(b.dataset.hPaneTarget){pick(b.closest('.h-tab-scope'),b.dataset.hPaneTarget);return;}
 if(b.dataset.hView){view(b.dataset.hView);return;}
 if(b.dataset.hTask){if(window.StAttentionUI?.task(b.dataset.hTask)===false)alert('結果を保存してから別の課題へ進んでください。');else view('task');return;}
 if(app==='picture'&&b.dataset.tab==='history')queueMicrotask(()=>{if(!$('history').hidden)$('find-history').click();});
});
document.addEventListener('keydown',e=>{const b=e.target.closest('[data-h-pane-target]');if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const scope=b.closest('.h-tab-scope'),buttons=Array.from(scope.querySelectorAll(':scope>.h-tabbar>button')),i=buttons.indexOf(b),next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;e.preventDefault();pick(scope,buttons[next].dataset.hPaneTarget);buttons[next].focus();});
document.addEventListener('invalid',e=>{const pane=e.target.closest('[data-h-pane]');if(pane)pick(pane.parentElement,pane.dataset.hPane);},true);
let lastScreen='';function sync(){
 if(app==='picture')body.dataset.hPhase=!$('training').hidden?'training':!$('result').hidden?'result':'normal';
 else if(app==='attention'){const id=document.querySelector('.screen.is-active')?.id||'';body.dataset.hPhase=['training-screen','grid-training-screen','tmt-training-screen'].includes(id)?'training':id.includes('result-screen')?'result':'normal';if(lastScreen&&id!==lastScreen)body.dataset.hView='task';lastScreen=id;}
 else if(app==='catr')body.dataset.hPhase=document.querySelector('.view.is-active')?.id==='summaryView'?'result':'normal';
}
for(const n of document.querySelectorAll('.screen,.view'))new MutationObserver(sync).observe(n,{attributes:true,attributeFilter:['class','hidden']});
sync();if(app==='attention'&&new URL(location.href).searchParams.get('view')==='history')view('history');
if(app==='picture'){
 const options=$('card-options');function names(){for(const label of options.querySelectorAll('label:not(.h-card-label)')){label.classList.add('h-card-label');for(const text of Array.from(label.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE)){const parts=text.textContent.split(' ／ '),title=document.createElement('span'),category=document.createElement('small');title.className='h-card-name';title.textContent=parts.shift();category.textContent=parts.join(' ／ ');text.replaceWith(title,category);}}}
 new MutationObserver(names).observe(options,{childList:true});names();
 const result=$('result-body');function resultLayout(){if(!result.children.length||result.querySelector(':scope>.h-picture-result-split'))return;const children=Array.from(result.children),stats=children.find(n=>n.classList.contains('stats'));if(!stats)return;const split=document.createElement('div'),overview=document.createElement('aside'),detail=document.createElement('div');split.className='h-picture-result-split';overview.className='h-scoreboard';detail.className='h-result-scroll';overview.append(stats);for(const n of children)if(n!==stats)detail.append(n);split.append(overview,detail);result.replaceChildren(split);}
 new MutationObserver(resultLayout).observe(result,{childList:true});resultLayout();$('result').querySelector('header').after($('save-state'));
 const list=$('history-list'),detail=$('workspace-history-detail');function records(){detail.replaceChildren();const prompt=document.createElement('p');prompt.textContent='履歴を選択';detail.append(prompt);for(const record of list.querySelectorAll('details.record')){if(record.dataset.hBound)continue;record.dataset.hBound='true';record.addEventListener('toggle',()=>{if(!record.open)return;for(const other of list.querySelectorAll('details.record'))if(other!==record)other.open=false;queueMicrotask(()=>{const content=record.querySelector('div');if(content)detail.replaceChildren(content.cloneNode(true));});});}}
 new MutationObserver(records).observe(list,{childList:true});records();
}
})();
