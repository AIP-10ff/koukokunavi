(function() {
  const DEFAULT_SG = [
    {id:1700000000001,name:"佐賀県 唐津市 カラオケサイネージ",yomi:"サガケン カラツシ さがけん からつし からおけさいねーじ",lat:33.437059229737095,lng:129.97597217548903,area:"",place:"",target:"",addr:"",size:"640mm×2240mm",type:"LED",ped:"",trf:"",status:"EMPTY",favCount:0,plans:[{n:"プランA",p:""}],e:"📺",photos:[],docs:[]},
    {id:1700000000002,name:"大分県 第７ピカソ会館 カラオケサイネージ",yomi:"オオイタケン ダイナナピカソカイカン おおいたけん だいななぴかそかいかん からおけさいねーじ",lat:33.24000419750767,lng:131.60634934896734,area:"",place:"",target:"",addr:"",size:"640mm×2240mm",type:"LED",ped:"",trf:"",status:"EMPTY",favCount:0,plans:[{n:"プランA",p:""}],e:"📺",photos:[],docs:[]},
    {id:1700000000003,name:"福岡県 カラオケサイネージ",yomi:"フクオカケン ふくおかけん からおけさいねーじ",lat:33.87216357279096,lng:130.8609098195484,area:"",place:"",target:"",addr:"",size:"640mm×2240mm",type:"LED",ped:"",trf:"",status:"EMPTY",favCount:0,plans:[{n:"プランA",p:""}],e:"📺",photos:[],docs:[]},
    {id:1700000000004,name:"福岡県カラオケサイネージ",yomi:"フクオカケン ふくおかけん からおけさいねーじ",lat:33.889556285766204,lng:130.88357448556053,area:"",place:"",target:"",addr:"",size:"640mm×2240mm",type:"LED",ped:"",trf:"",status:"EMPTY",favCount:0,plans:[{n:"プランA",p:""}],e:"📺",photos:[],docs:[]},
    {id:1700000000005,name:"大阪府 駅近 塾サイネージ",yomi:"おおさかふ えきちか じゅく さいねーじ オオサカフ エキ ジュク",lat:34.577094955407965,lng:135.55573582643777,area:"",place:"",target:"",addr:"",size:"640mm×2240mm",type:"LED",ped:"",trf:"",status:"EMPTY",favCount:0,plans:[{n:"プランA",p:""}],e:"📺",photos:[],docs:[]}
  ];

  window.getKokokunaviDefaultSG = function() {



    return JSON.parse(JSON.stringify(DEFAULT_SG));
  };
})();

// =============================================================
//  SHARED — 管理者画面・一般ユーザー画面の両方で使用する共通コード
// =============================================================

// ===== ステータス定数 =====
var STATUS_COLOR = {ON:'#10b981', EMPTY:'#f59e0b', MAINT:'#ef4444'};
var STATUS_BG    = {ON:'#d1fae5', EMPTY:'#fef3c7', MAINT:'#fee2e2'};
var STATUS_TC    = {ON:'#065f46', EMPTY:'#92400e', MAINT:'#991b1b'};
var STATUS_LBL   = {ON:'稼働中',  EMPTY:'空き',    MAINT:'メンテ中'};

// ===== トースト通知 =====
function toast(msg){
  var t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(function(){t.classList.remove('show');},2800);
}

// ===== Argon2id パスワードハッシュ =====
async function hashPw(pw){
  var salt=crypto.getRandomValues(new Uint8Array(16));
  var result=await argon2.hash({pass:pw,salt:salt,time:2,mem:19456,hashLen:32,parallelism:1,type:argon2.ArgonType.Argon2id});
  return result.encoded;
}
async function verifyPw(pw,encoded){
  try{await argon2.verify({pass:pw,encoded:encoded});return true;}catch(e){return false;}
}

// ===== パスワード表示切替 =====
function togglePw(id,btn){
  var el=document.getElementById(id);
  if(!el)return;
  el.type=el.type==='password'?'text':'password';
  btn.textContent=el.type==='text'?'🙈':'👁';
}

// ===== マップピンアイコン =====
// ステータスバッジ設定（クラスター数バッジと同じスタイル・位置）
var PIN_BADGE={
  ON:  {bg:'#eab308', color:'#fff', text:''},
  MAINT:{bg:'#ef4444', color:'#fff', text:''},
  EMPTY:{bg:'#10b981', color:'#fff', text:'空'}
};

// ピン内オーバーレイ用ヘルパー
function _pinNum(v){
  if(v==null||v==='') return 0;
  var m=String(v).replace(/[,，\s]/g,'').match(/\d+(?:\.\d+)?/);
  return m?parseFloat(m[0]):0;
}
// サイズ表記から ㎡(数値文字列) に正規化。失敗時 null。
// 例: "640mm×2240mm" → "1.43"、"0.64m x 2.24m" → "1.43"、"1.43㎡" → "1.43"、"1.43" → "1.43"
function _sizeToSqM(raw){
  if(raw==null) return null;
  var s=String(raw).trim();
  if(!s) return null;
  function toM(v,u){v=parseFloat(v);u=(u||'mm').toLowerCase();return u==='mm'?v/1000:u==='cm'?v/100:v;}
  // 寸法 (×を含む)
  var m=s.match(/(\d+(?:\.\d+)?)\s*(mm|cm|m)?\s*[×x*✕✖]\s*(\d+(?:\.\d+)?)\s*(mm|cm|m)?/i);
  if(m){
    var area=toM(m[1],m[2])*toM(m[3],m[4]);
    if(area>0) return area<0.01 ? area.toFixed(3) : area.toFixed(2);
  }
  // 数値のみ または ㎡/m²/m2 付き
  var n=s.match(/^\s*(\d+(?:\.\d+)?)\s*(?:㎡|m²|m\^?2|平米|sqm)?\s*$/i);
  if(n){
    var v=parseFloat(n[1]);
    if(v>0) return v<0.01 ? v.toFixed(3) : v.toFixed(2);
  }
  return null;
}
// 編集画面の値整形: 数値だけの入力 → "1.43㎡" 形式に整える。解析不能なら原文を返す。
// たて×よこ（例 640mm×2240mm）はそのまま残す。面積はピンで計算して出すので、寸法を消すと詳細画面から寸法が分からなくなる
window.formatSizeFieldValue=function(raw){
  if(raw!=null&&/[×x*✕✖]/i.test(String(raw))) return String(raw).trim();
  var n=_sizeToSqM(raw);
  return n!=null ? n+'㎡' : (raw==null?'':String(raw));
};
// ピン表示用: 面積（㎡ 付き）
function _pinSizeM2(sz){
  var n=_sizeToSqM(sz);
  // 単位を付けないと何の数字か分からない（10/9 中井さんの指摘）。ピンの下の段＝画面の面積
  return n!=null ? n+'㎡' : '---';
}
// 先頭プラン(plans[0])の価格を "○万/月" に整形
function _pinFirstPrice(plans){
  if(!plans||!plans.length) return '---';
  var n=_pinNum(plans[0]&&plans[0].p);
  if(n<=0) return '---';
  if(n>=10000){
    var man=n/10000;
    return (man%1===0?man:man.toFixed(1))+'万/月';
  }
  return n.toLocaleString()+'円/月';
}
// ピンの通行アイコン: 'ped'(人) / null(未入力)。交通量（車）はデータ元が無いため 10/8 に表示をやめた
function _pinTrafficKind(s){
  return _pinNum(s&&s.ped)>0?'ped':null;
}
var _PIN_PERSON_SVG='<svg width="22" height="24" viewBox="0 0 22 24" style="display:block">'
  +'<circle cx="11" cy="6" r="4" fill="none" stroke="#222" stroke-width="1.8"/>'
  +'<path d="M2 24 Q2 12 11 12 Q20 12 20 24" fill="none" stroke="#222" stroke-width="1.8" stroke-linecap="round"/>'
  +'</svg>';
var _PIN_CAR_SVG='<svg width="28" height="20" viewBox="0 0 28 20" style="display:block">'
  +'<path d="M2 15 L2 11 L5 4 L23 4 L26 11 L26 15 Z" fill="none" stroke="#222" stroke-width="1.6" stroke-linejoin="round"/>'
  +'<circle cx="8" cy="15.5" r="2.2" fill="#222"/>'
  +'<circle cx="20" cy="15.5" r="2.2" fill="#222"/>'
  +'</svg>';

// ピンの内側HTML（画像＋価格/サイズ/通行アイコン＋バッジ＋NEW）を生成する。
// Leaflet(divIcon)・Google Maps(AdvancedMarker)の両方から利用する共通関数。
function pinInnerHtml(s){
  var badge=s&&s.status?PIN_BADGE[s.status]:null;
  var badgeHtml=badge
    ? '<div style="position:absolute;top:4px;right:4px;background:'+badge.bg+';color:'+badge.color+';font-size:12px;font-weight:700;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);z-index:3">'+badge.text+'</div>'
    : '';
  var isNew=s&&s.id&&(Date.now()-s.id)<3*30*24*60*60*1000;
  var newHtml=isNew
    ? '<div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);background:#e8650a;color:#fff;font-size:9px;font-weight:900;border:2px solid #fff;border-radius:3px;padding:1px 6px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3);letter-spacing:.5px;z-index:3">NEW!</div>'
    : '';

  // ピン内 2 段オーバーレイ（価格 / サイズ）
  // ※ 交通種別の人／車アイコンの上書きは廃止（元画像のデザインを活かすため）
  // 画像 168×189 → 110×124 表示。行内側 y 範囲: 価格 10-54 / サイズ 56-96（原寸基準）
  var priceTxt=_pinFirstPrice(s&&s.plans);
  var sizeTxt =_pinSizeM2(s&&s.size);
  var rowBase ='position:absolute;left:23px;width:64px;display:flex;align-items:center;justify-content:center;color:#111;line-height:1;z-index:2';
  var priceHtml='<div style="'+rowBase+';top:9px;height:22px;font-size:10.5px;font-weight:900;letter-spacing:-0.5px">'+priceTxt+'</div>';
  var sizeHtml ='<div style="'+rowBase+';top:39px;height:20px;font-size:11px;font-weight:700;letter-spacing:-0.3px">'+sizeTxt+'</div>';

  var html='<div style="position:relative;width:110px;height:118px">'
    +'<img src="アセット%205.png" style="width:110px;height:auto;display:block;pointer-events:none;"/>'
    +priceHtml+sizeHtml
    +badgeHtml
    +newHtml
    +'</div>';
  return html;
}

// ピンアイコン用の中身を組み立てる（admin.html・index.html の双方が利用）。
function pinIcon(s){
  return L.divIcon({html:pinInnerHtml(s),iconSize:[110,118],iconAnchor:[55,118],popupAnchor:[0,-118],className:''});
}

// =============================================================
//  SHARED — IndexedDB（写真・資料のストレージ）
// =============================================================
var DB_NAME='kokoknavi_db', DB_VER=2;
var photoCache={}, docCache={};

function idbOpen(cb){
  var req=indexedDB.open(DB_NAME,DB_VER);
  req.onupgradeneeded=function(e){
    var db=e.target.result;
    if(!db.objectStoreNames.contains('photos'))   db.createObjectStore('photos');
    if(!db.objectStoreNames.contains('docs'))     db.createObjectStore('docs');
    if(!db.objectStoreNames.contains('xl_files')) db.createObjectStore('xl_files');
  };
  req.onsuccess=function(e){cb(null,e.target.result);};
  req.onerror=function(e){cb(e.target.error);};
}
function idbGet(store,key,cb){
  idbOpen(function(err,db){
    if(err){cb(err,null);return;}
    var tx=db.transaction(store,'readonly');
    var req=tx.objectStore(store).get(key);
    req.onsuccess=function(e){db.close();cb(null,e.target.result);};
    req.onerror=function(e){db.close();cb(e.target.error,null);};
  });
}
// idbPut / idbDelete / idbClearStore の共通 readwrite トランザクション処理
function _idbRw(store,op,cb){
  idbOpen(function(err,db){
    if(err){if(cb)cb(err);return;}
    var tx=db.transaction(store,'readwrite');
    op(tx.objectStore(store));
    tx.oncomplete=function(){db.close();if(cb)cb(null);};
    tx.onerror=function(e){db.close();if(cb)cb(e.target.error);};
  });
}
function idbPut(store,key,val,cb){_idbRw(store,function(os){os.put(val,key);},cb);}
function idbGetAll(store,cb){
  idbOpen(function(err,db){
    if(err){cb(err,[]);return;}
    var tx=db.transaction(store,'readonly');
    var result=[];
    var req=tx.objectStore(store).openCursor();
    req.onsuccess=function(e){
      var cursor=e.target.result;
      if(cursor){result.push({key:cursor.key,val:cursor.value});cursor.continue();}
      else{db.close();cb(null,result);}
    };
    req.onerror=function(e){db.close();cb(e.target.error,[]);};
  });
}
function idbDelete(store,key,cb){_idbRw(store,function(os){os.delete(key);},cb);}
function idbClearStore(store,cb){_idbRw(store,function(os){os.clear();},cb);}
function idbGenId(){
  return 'media_'+Date.now()+'_'+Math.random().toString(36).substr(2,9);
}

// ===== BOT対策：送信クールダウンチェック =====
// key: localStorage キー名（例: 'kn_cd_auth'）
// seconds: 再送禁止秒数
// 戻り値: { ok: true } または { ok: false, remaining: 残り秒数 }
function _checkSendCooldown(key, seconds){
  var now=Date.now();
  var last=parseInt(localStorage.getItem(key)||'0',10);
  var elapsed=Math.floor((now-last)/1000);
  if(last&&elapsed<seconds){return {ok:false,remaining:seconds-elapsed};}
  localStorage.setItem(key,now.toString());
  return {ok:true};
}
// EmailJS などの catch(e) でエラー文字列を安全に取得する共通ヘルパー
function _errMsg(e){return e&&(e.text||e.message)||JSON.stringify(e)||'不明なエラー';}

function _parseKokokunaviInquiryTimestamp(value){
  try{
    if(value===null||value===undefined||value==='') return null;
    var date=value instanceof Date?value:(typeof value==='number'?new Date(value):new Date(value));
    if(isNaN(date.getTime())&&typeof value==='string'){
      var normalized=value
        .replace(/[年月\.]/g,'/')
        .replace(/[日]/g,' ')
        .replace(/[時]/g,':')
        .replace(/[分]/g,'')
        .replace(/[秒]/g,'')
        .replace('T',' ')
        .replace(/Z$/,'')
        .replace(/[^0-9/:\-\s]/g,' ')
        .replace(/\s+/g,' ')
        .trim();
      date=new Date(normalized);
      if(isNaN(date.getTime())){
        var parts=normalized.match(/\d+/g)||[];
        if(parts.length>=3){
          date=new Date(
            Number(parts[0]),
            Math.max(Number(parts[1]||1)-1,0),
            Number(parts[2]||1),
            Number(parts[3]||0),
            Number(parts[4]||0),
            Number(parts[5]||0)
          );
        }
      }
    }
    return isNaN(date.getTime())?null:date;
  }catch(e){
    return null;
  }
}

window.formatKokokunaviInquiryTimestamp=function(value){
  var date=_parseKokokunaviInquiryTimestamp(value);
  if(!date) return String(value||'---');
  return date.getFullYear()+'/'+String(date.getMonth()+1).padStart(2,'0')+'/'+String(date.getDate()).padStart(2,'0')+' '+String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');
};

window.getNormalizedKokokunaviInquiries=function(){
  try{
    var raw=localStorage.getItem('kokoknavi_inquiries')||'[]';
    var parsed=JSON.parse(raw);
    if(!Array.isArray(parsed)) return [];
    var changed=false;
    var normalized=parsed.map(function(item){
      if(!item||typeof item!=='object') return item;
      var next=Object.assign({},item);
      var parsedDate=_parseKokokunaviInquiryTimestamp(next.ts);
      if(parsedDate){
        var iso=parsedDate.toISOString();
        if(next.ts!==iso){next.ts=iso;changed=true;}
      }
      return next;
    });
    if(changed){
      localStorage.setItem('kokoknavi_inquiries',JSON.stringify(normalized));
    }
    return normalized;
  }catch(e){
    return [];
  }
};

window.setKokokunaviInquiries=function(inquiries){
  try{
    localStorage.setItem('kokoknavi_inquiries',JSON.stringify(Array.isArray(inquiries)?inquiries:[]));
  }catch(e){}
};

window.prependKokokunaviInquiry=function(inquiry){
  try{
    var inquiries=window.getNormalizedKokokunaviInquiries?window.getNormalizedKokokunaviInquiries():[];
    inquiries.unshift(inquiry);
    window.setKokokunaviInquiries(inquiries);
  }catch(e){}
};

// ===== お問い合わせ共通ユーティリティ（admin/user 両ファイル共用） =====
function _getInqs(){
  try{
    if(window.getNormalizedKokokunaviInquiries) return window.getNormalizedKokokunaviInquiries();
    return JSON.parse(localStorage.getItem('kokoknavi_inquiries')||'[]');
  }catch(e){return[];}
}
function _fmtInqDate(value){
  if(window.formatKokokunaviInquiryTimestamp) return window.formatKokokunaviInquiryTimestamp(value);
  return String(value||'---');
}
function getFavIds(){try{return JSON.parse(localStorage.getItem('kokoknavi_favs')||'[]');}catch(e){return[];}}

// ===== Cookie 操作 =====
function _setCookie(name,val,days){var d=new Date();d.setTime(d.getTime()+days*864e5);document.cookie=name+'='+val+';expires='+d.toUTCString()+';path=/;SameSite=Lax';}
function _getCookie(name){var m=document.cookie.match('(?:^|; )'+name+'=([^;]*)');return m?m[1]:null;}

// ===== テキスト正規化（全角数字・ひらがな→カタカナ・小文字化） =====
function _nrmS(s){
  if(!s)return'';
  return String(s)
    .replace(/[０-９]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-0xFEE0);})
    .replace(/[\u3041-\u3096]/g,function(c){return String.fromCharCode(c.charCodeAt(0)+0x60);})
    .toLowerCase();
}
// ローマ字→ひらがな変換
function _romajiToHira(s){
  if(!s)return'';
  var r=s.toLowerCase();
  var tb=[
    ['kya','きゃ'],['kyu','きゅ'],['kyo','きょ'],
    ['sha','しゃ'],['shi','し'],['shu','しゅ'],['sho','しょ'],
    ['chi','ち'],['cha','ちゃ'],['chu','ちゅ'],['cho','ちょ'],
    ['tsu','つ'],
    ['tya','ちゃ'],['tyu','ちゅ'],['tyo','ちょ'],
    ['sya','しゃ'],['syu','しゅ'],['syo','しょ'],
    ['nya','にゃ'],['nyu','にゅ'],['nyo','にょ'],
    ['hya','ひゃ'],['hyu','ひゅ'],['hyo','ひょ'],
    ['mya','みゃ'],['myu','みゅ'],['myo','みょ'],
    ['rya','りゃ'],['ryu','りゅ'],['ryo','りょ'],
    ['gya','ぎゃ'],['gyu','ぎゅ'],['gyo','ぎょ'],
    ['jya','じゃ'],['jyu','じゅ'],['jyo','じょ'],
    ['bya','びゃ'],['byu','びゅ'],['byo','びょ'],
    ['pya','ぴゃ'],['pyu','ぴゅ'],['pyo','ぴょ'],
    ['dya','ぢゃ'],['dyu','ぢゅ'],['dyo','ぢょ'],
    ['zya','じゃ'],['zyu','じゅ'],['zyo','じょ'],
    ['nn','ん'],
    ['ka','か'],['ki','き'],['ku','く'],['ke','け'],['ko','こ'],
    ['sa','さ'],['si','し'],['su','す'],['se','せ'],['so','そ'],
    ['ta','た'],['ti','ち'],['tu','つ'],['te','て'],['to','と'],
    ['na','な'],['ni','に'],['nu','ぬ'],['ne','ね'],['no','の'],
    ['ha','は'],['hi','ひ'],['fu','ふ'],['hu','ふ'],['he','へ'],['ho','ほ'],
    ['ma','ま'],['mi','み'],['mu','む'],['me','め'],['mo','も'],
    ['ya','や'],['yu','ゆ'],['yo','よ'],
    ['ra','ら'],['ri','り'],['ru','る'],['re','れ'],['ro','ろ'],
    ['wa','わ'],['wi','い'],['we','え'],['wo','を'],
    ['ga','が'],['gi','ぎ'],['gu','ぐ'],['ge','げ'],['go','ご'],
    ['za','ざ'],['ji','じ'],['zi','じ'],['zu','ず'],['ze','ぜ'],['zo','ぞ'],
    ['da','だ'],['di','ぢ'],['du','づ'],['de','で'],['do','ど'],
    ['ba','ば'],['bi','び'],['bu','ぶ'],['be','べ'],['bo','ぼ'],
    ['pa','ぱ'],['pi','ぴ'],['pu','ぷ'],['pe','ぺ'],['po','ぽ'],
    ['ja','じゃ'],['ju','じゅ'],['jo','じょ'],
    ['a','あ'],['i','い'],['u','う'],['e','え'],['o','お']
  ];
  var out='',i=0;
  while(i<r.length){
    if(r[i]==='n'&&(i+1>=r.length||(/[bcdfghjklmpqrstvwxz]/.test(r[i+1])&&r[i+1]!=='y'))){
      out+='ん';i++;continue;
    }
    if(r[i]!=='n'&&i+1<r.length&&r[i]===r[i+1]&&/[bcdfghjklmpqrstvwxyz]/.test(r[i])){
      out+='っ';i++;continue;
    }
    var matched=false;
    for(var j=0;j<tb.length;j++){
      if(r.substr(i,tb[j][0].length)===tb[j][0]){out+=tb[j][1];i+=tb[j][0].length;matched=true;break;}
    }
    if(!matched){out+=r[i];i++;}
  }
  return out;
}
// クエリの正規化バリエーション生成（通常＋ローマ字変換）
function _queryForms(q){
  var base=_nrmS(q);
  var forms=[base];
  if(/^[a-zA-Z\s]+$/.test(q.trim())){
    var kana=_nrmS(_romajiToHira(q));
    if(kana&&kana!==base) forms.push(kana);
  }
  return forms;
}

// ===== プラン料金正規化（¥なし→¥付き・/月付きに統一） =====
function normalizePlan(p){
  if(!p.p) return p;
  var price=String(p.p).replace(/^¥/,'').replace(/\/月$/,'').trim();
  return {n:p.n, p:'¥'+price+'/月'};
}

// ===== 汎用ユーティリティ =====
// SGからIDでサイネージを検索
function find(id){for(var i=0;i<SG.length;i++) if(SG[i].id===id) return SG[i]; return null;}
// DOM要素の値を取得
function gv(id){var el=document.getElementById(id);return el?el.value:'';}

// IDBからキャッシュ読み込み + 旧localStorage形式を自動移行
// sg: SGデータ配列（各ページのSGをそのまま渡す）
function preloadMediaCache(sg,cb){
  idbGetAll('photos',function(err,items){
    if(!err&&items) items.forEach(function(x){photoCache[x.key]=x.val;});
    idbGetAll('docs',function(err2,items2){
      if(!err2&&items2) items2.forEach(function(x){docCache[x.key]=x.val;});
      _migrateOldPhotos(sg,function(){if(cb)cb();});
    });
  });
}

// 旧形式（dataUrlが直接入っていたphoto/doc）をIDBへ移行
function _migrateOldPhotos(sg,cb){
  var pending=0;
  var done=function(){pending--;if(pending<=0&&cb)cb();};
  (sg||[]).forEach(function(s){
    (s.photos||[]).forEach(function(p){
      if(p.dataUrl&&!p.id){
        var id=idbGenId(); p.id=id; pending++;
        idbPut('photos',id,p.dataUrl,function(){
          photoCache[id]=p.dataUrl; delete p.dataUrl; done();
        });
      }
    });
    (s.docs||[]).forEach(function(d){
      if(d.dataUrl&&!d.id){
        var id=idbGenId(); d.id=id; pending++;
        idbPut('docs',id,d.dataUrl,function(){
          docCache[id]=d.dataUrl; delete d.dataUrl; done();
        });
      }
    });
  });
  if(pending===0&&cb)cb();
}

// ===== サーバー API（Phase2 管理系 API） =====
// 掲載情報（サイネージ）はサーバーの DB を正とする。利用者画面・管理画面の両方から使う。
// file:// で開いたときや API が無いときは fetch が失敗し、呼び出し側が従来の動き（localStorage／DEFAULT_SG）に戻る。
var KN_API_BASE = '/api/v1';

// Firebase（電話番号＋SMS の本人確認だけに使う）。Web 用の設定は公開される前提の値で、
// 使えるドメインは Firebase 側の「承認済みドメイン」（app・app2・localhost）で絞っている
var KN_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyA75nlsclgEcSkpFXNEXYRvkQdAMEO0WEY',
  authDomain: 'koukokunavi-e4b90.firebaseapp.com',
  projectId: 'koukokunavi-e4b90',
  storageBucket: 'koukokunavi-e4b90.firebasestorage.app',
  messagingSenderId: '465232241609',
  appId: '1:465232241609:web:29020d80c7810106c8be18'
};
window.KN_FIREBASE_CONFIG = KN_FIREBASE_CONFIG;
var KN_SIGNAGE_KEYS = ['id','name','yomi','lat','lng','area','place','target','addr','size','type','ped','trf','status','plans','photos','docs'];

function knApi(method, path, body, token){
  var h = {'Accept':'application/json'};
  if(body !== undefined) h['Content-Type'] = 'application/json';
  if(token) h['Authorization'] = 'Token ' + token;
  return fetch(KN_API_BASE + path, {
    method: method, headers: h, cache: 'no-cache',
    body: body === undefined ? undefined : JSON.stringify(body)
  }).then(function(r){
    if(r.status === 204) return null;
    return r.json().catch(function(){ return null; }).then(function(d){
      if(!r.ok){
        var e = new Error((d && d.detail) || ('HTTP ' + r.status));
        e.status = r.status; e.data = d; throw e;
      }
      return d;
    });
  });
}
window.knApi = knApi;

// 利用者向け：公開中のピン一覧（ログイン不要）
function knFetchSignages(){
  return knApi('GET', '/signages/').then(function(d){ return Array.isArray(d) ? d : []; });
}
window.knFetchSignages = knFetchSignages;

// 画面の SG 1 件 → サーバーに送る形（画面だけで使う項目 e / favCount / _xxxEdited は送らない）
function knToServerSignage(s){
  var o = {};
  KN_SIGNAGE_KEYS.forEach(function(k){ if(s[k] !== undefined && s[k] !== null) o[k] = s[k]; });
  o.lat = Number(s.lat); o.lng = Number(s.lng);
  o.plans = (s.plans || []).map(function(p){ return {n: String(p.n || ''), p: String(p.p || '')}; });
  // key は S3 の置き場所（⑥ 9c）。url は一時的なものなので送らない
  o.photos = (s.photos || []).map(function(p){ var x = {id: p.id, name: p.name || '', isMain: !!p.isMain}; if(p.key) x.key = p.key; return x; });
  o.docs = (s.docs || []).map(function(d){ var x = {id: d.id, name: d.name || '', size: d.size || 0, type: d.type || ''}; if(d.key) x.key = d.key; return x; });
  if(['ON','EMPTY','MAINT'].indexOf(o.status) < 0) o.status = 'EMPTY';
  return o;
}
window.knToServerSignage = knToServerSignage;

// ===== 写真・資料（S3、⑥ 9c） =====
// サーバーが返す photos / docs の url（1 時間ほど有効な一時 URL）を、表示用のキャッシュに入れる。
// 画面は従来どおり photoCache[id] / docCache[id] を見るだけで、S3 の写真が出る。一覧を取り直すたびに呼ぶ（URL の期限切れ対策）
function knApplyMediaUrls(list){
  (list || []).forEach(function(s){
    (s.photos || []).forEach(function(p){ if(p && p.id && p.url) photoCache[p.id] = p.url; });
    (s.docs || []).forEach(function(d){ if(d && d.id && d.url) docCache[d.id] = d.url; });
  });
}
window.knApplyMediaUrls = knApplyMediaUrls;

// 管理者用：ファイル（File / Blob）を S3 に上げて {key, url, ...} を受け取る（POST /admin/media/）
function knUploadMedia(blob, filename, kind, token){
  var fd = new FormData();
  fd.append('kind', kind || 'photo');
  fd.append('file', blob, filename || 'file');
  return fetch(KN_API_BASE + '/admin/media/', {
    method: 'POST', headers: {'Accept': 'application/json', 'Authorization': 'Token ' + token}, body: fd
  }).then(function(r){
    return r.json().catch(function(){ return null; }).then(function(d){
      if(!r.ok){ var e = new Error((d && d.detail) || ('HTTP ' + r.status)); e.status = r.status; e.data = d; throw e; }
      return d;
    });
  });
}
window.knUploadMedia = knUploadMedia;

// dataURL（圧縮後の写真）を、アップロード用の Blob にする
function knDataUrlToBlob(dataUrl){
  var parts = String(dataUrl).split(','), mime = (parts[0].match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  var bin = atob(parts[1] || ''), arr = new Uint8Array(bin.length);
  for(var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], {type: mime});
}
window.knDataUrlToBlob = knDataUrlToBlob;

// 利用者向け：問い合わせをサーバーへ（POST /contact/、ログイン不要）。
// サーバーが DB に保存し、SES で社内へ通知する。戻り値 {id, notified}（notified=false は保存済み・未通知）。
// 電話番号・希望期間などの項目は body（メール本文と同じ文面）にまとめて送る。
function knSendContact(inq, bodyText){
  return knApi('POST', '/contact/', {
    name: inq.name, email: inq.email, company: inq.company || '',
    signage_id: inq.signageId ? String(inq.signageId) : '',
    body: bodyText
  });
}
window.knSendContact = knSendContact;
