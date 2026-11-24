(function () {
  "use strict";
  const root=new URL("./",document.currentScript.src), status=document.getElementById("status"), details=document.getElementById("details"), button=document.getElementById("prepare");
  const standalone=!!(navigator.standalone || matchMedia("(display-mode: standalone)").matches);
  let route=null;
  try {
    route=JSON.parse(sessionStorage.getItem("st-app-migration-route-v1") || "null");
    sessionStorage.removeItem("st-app-migration-route-v1");
  } catch {}
  const routeVerified=!!(route && route.root===root.href && typeof route.nonce==="string" && Date.now()-route.createdAt>=0 && Date.now()-route.createdAt<1800000 && route.sourceMode===(standalone?"standalone":"browser"));
  document.getElementById("route-status").textContent=routeVerified
    ? (standalone?"ホーム画面アプリ内からの画面遷移を確認しました":"同じブラウザ画面からの遷移を確認しました。ホーム画面版の確認ではありません")
    : "起動経路未確認。この画面だけでは旧ホーム画面版からの移行を証明できません";
  button.onclick=async()=>{
    button.disabled=true;status.textContent="新版の準備を確認中";
    try {
      if(!navigator.serviceWorker || !isSecureContext)throw Error("HTTPS接続が必要です");
      if(standalone && !routeVerified)throw Error("ホーム画面アプリ内の起動経路が未確認です。管理者の案内を待ってください");
      const registrations=await navigator.serviceWorker.getRegistrations();
      const nested=registrations.filter(r=>r.scope.startsWith(root.href)&&r.scope!==root.href);
      if(nested.length)throw Error("停止：課題専用の旧Service Workerがあります。削除せず診断情報を管理者へ伝えてください");
      const reg=registrations.find(r=>r.scope===root.href);
      if(!reg)throw Error("停止：STアプリ本体の登録がありません。導入経路を確認してください");
      await reg.update();
      const worker=reg.installing;
      if(worker)await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>done(Error("取得が時間内に完了しませんでした")),90000);
        function done(e){clearTimeout(timer);worker.removeEventListener("statechange",check);e?reject(e):resolve();}
        function check(){if(worker.state==="installed"||worker.state==="activated")done();else if(worker.state==="redundant")done(Error("取得・検証・保存に失敗しました"));}
        worker.addEventListener("statechange",check);check();
      });
      const target=reg.waiting || reg.active;
      const info=await new Promise((resolve,reject)=>{
        const channel=new MessageChannel(), timer=setTimeout(()=>{channel.port1.close();reject(Error("新版の診断応答がありません"));},10000);
        channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};
        target.postMessage({type:"ST_STATUS"},[channel.port2]);
      });
      if(!info.ready || info.scope!==root.href)throw Error("新版の完全性または登録範囲を確認できません");
      details.textContent=JSON.stringify({scope:new URL(info.scope).pathname,version:info.release.version,build:info.build,waiting:!!reg.waiting},null,2);
      status.textContent="準備完了・まだ切り替えていません。全ST画面を通常終了し、開き直してください。";
    }catch(e){status.textContent="移行停止："+e.message;}
    finally{button.disabled=false;}
  };
})();
