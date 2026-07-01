(function(){

// Inject print styles
var ps=document.createElement('style');
ps.textContent='@media print{'+
'@page{size:210mm 297mm;margin:0}'+
'body{background:none!important}'+
'.page,.page.first,.container,.container.first{'+
'margin:0!important;'+
'overflow:visible!important;'+
'page-break-after:always;'+
'-webkit-print-color-adjust:exact!important;'+
'print-color-adjust:exact!important'+
'}'+
'.page:last-child,.container:last-child{page-break-after:auto}'+
'}';
document.head.appendChild(ps);

function paginate(){
    // 1. Manual page breaks first
    var breaks=document.querySelectorAll('.page-break');
    for(var b=0;b<breaks.length;b++){
        var br=breaks[b];
        var page=br.parentElement;
        while(page&&!page.classList.contains('page')&&!page.classList.contains('container')){
            page=page.parentElement;
        }
        if(!page)continue;
        var cls=page.className.replace(/\bfirst\b/g,'').trim();
        var newPage=document.createElement('div');
        newPage.className=cls;
        var found=false;
        var children=Array.from(page.childNodes);
        for(var c=0;c<children.length;c++){
            if(found){
                newPage.appendChild(children[c]);
            }
            if(children[c]===br||children[c].contains&&children[c].contains(br)){
                if(children[c]!==br){
                    newPage.appendChild(children[c]);
                }
                found=true;
                if(children[c]===br) page.removeChild(br);
            }
        }
        if(newPage.children.length>0){
            page.parentNode.insertBefore(newPage,page.nextSibling);
        }
    }

    // 2. Auto page breaks (overflow)
    var pages=document.querySelectorAll('.page,.container');
    for(var i=0;i<pages.length;i++){
        if(pages[i].scrollHeight>pages[i].clientHeight+5){
            splitPage(pages[i]);
        }
    }
}
function splitPage(page){
    var cls=page.className.replace(/\bfirst\b/g,'').trim();
    var newPage=document.createElement('div');
    newPage.className=cls;
    var moved=0;
    while(page.scrollHeight>page.clientHeight+5&&page.lastChild){
        newPage.insertBefore(page.lastChild,newPage.firstChild);
        moved++;
    }
    if(moved===0)return;
    page.parentNode.insertBefore(newPage,page.nextSibling);
    if(newPage.scrollHeight>newPage.clientHeight+5){
        splitPage(newPage);
    }
}
if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',paginate);
}else{
    paginate();
}
})();
