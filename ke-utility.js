'use strict';
/* global FIBERS */
global.FIBERS=require('fibers');
const Fs=require('fs');
const Os=require('os');
let Cp=require('child_process');
let Ev=require('events');
const Hp=require('http');
const Hps=require('https');
const NL=String.fromCharCode(0x0a);
const RT=String.fromCharCode(0x0d);
module.exports=class keUtility {

/**
 * コンストラクタ
 * @param  {Bool}   main mainProcedureをコンストラクト時に実行する
 * @param  {Object} op   this.CFGを置き換えるパラメタ
 * @return {Void} none
 * @constructor
 */
  constructor (main, op) {
    /**
     * カスタムイベントを管理するための領域です。
     * @type {Object} Custom
     * @property
     */
    this.Custom = {};
    /**
     * 逐次制御用管理テーブル(For FIBERS)
     * @type {Object} Event
     * @property
     */
    this.Event = {};
    /**
     * パラメータ展開用基本情報テーブル
     * @type {Object} INFOJ
     * @property
     */
    this.INFOJ = {};
    /**
     * データベースレコード管理用テーブル
     * @type {Array} REC
     * @property
     */
    this.REC = [];
    /**
     * 画面入出力インターフェイステーブル
     * @type {Object} SCREEN
     * @property
     */
    this.SCREEN = {};
    /**
     * 外部入力設定情報テーブル
     * @type {Object} CFG
     * @property
     */
    this.CFG = {};
    /**
     * 変換辞書テーブル
     * @type {Object} DICT
     */
    this.DICT = {};

    this.Mode = ''; this.error = ''; this.Related = '';

    if(main){
      let me=this;
      this.MAIN(function(){this.mainProcedure(me, this);}, op);
    }
  }
  /**
 * バージョン表示
 * @return {Void} none
 * @method
 */
  version () {
    try{
      let a=JSON.parse(this.getJson('./package.json'));
      console.log(a.version);
    }catch(e){
      console.log('error ', e);
    }
  }
  /**
 * 環境情報の取り出しとプロパティ[me.CFG]への設定
 * @param  {String} group 選択対象のグループを指定可
 * @return {Void}       none
 * @method
 */
  info (group) {
    let me=this, d, o, a, k, p, f, t;

    // mode, config, groupの決定
    let mode;
    if(process.env.RUNMODE){mode=process.env.RUNMODE;}
    else if(me.isExist(process.env.HOME+'/debug.config')){
      mode='debug'; me.CFG.config=process.env.HOME+'/debug.config';
    }
    else if(me.isExist(process.env.HOME+'/master.config')){
      mode='master'; me.CFG.config=process.env.HOME+'/master.config';
    }
    else{mode='standalone';}
    me.CFG.mode=mode;
    if(process.env.RUNCONFIG){me.CFG.config=process.env.RUNCONFIG;}
    me.group = group || mode;

    // 省略値設定
    me.CFG.dbdriver='knpostgre'; me.CFG.admin=''; me.CFG.psw=''; me.CFG.service='Gmail';
    me.CFG.level='warn'; me.CFG.notify='no';

    // 自動設定
    p=me.lastOf(process.argv[1], '/');
    me.CFG.home=process.env.HOME;
    me.CFG.log=process.env.HOME+'/log'+process.argv[1].substr(p)+'.'+me.date('YMD-HIS')+'.log';
    me.CFG.path=process.argv[1]; me.CFG.pid=process.pid; me.CFG.current=process.cwd();
    me.CFG.apli=me.filepart(me.CFG.path);
    me.CFG.groupid=process.getgid(); me.CFG.uid=process.getuid();
    me.CFG.platform=process.platform; me.CFG.user=process.env.USER; me.CFG.home=process.env.HOME;
    me.CFG.directory=me.pullDir(process.argv[1]);

    //  ログディレクトリチェック
    me.checkDir(['log']);
    me.infoLog('MODE: '+mode);
    if(mode=='standalone'){return;}

    // 設定読み込み
    f=me.CFG.config;
    if(me.isExist(f)){try{
      me.infoLog('config file='+f);
      d=me.getFs(f);
      if(d){o=JSON.parse(d);}
      else{me.infoLog('コンフィグファイルが読めない。file='+f); process.exit(1);}
    }catch(e){
      me.infoLog('コンフィグファイルが読めない。file='+f); process.exit(1);
    }}else{me.infoLog('コンフィグファイルが読めない。file='+f); process.exit(1);}

    a=me.CFG.directory.split('/'); me.CFG.project=a[3];
    let ix; for(ix in o){if(o[ix].mode==mode || o[ix].mode=='always'){
      if(o[ix].group==a[3] || o[ix].group=='all'){
        f=''; t='';
        if(o[ix].valid){a=o[ix].valid.split(':'); f=a[0]; t=a[1];}
        if(!f){f='000101';} if(!t){t='991231';}
        if(me.today('YMD')>=f && me.today('YMD')<=t){
          for(k in o[ix]){
            if(k!='mode' && k!='group'){me.CFG[k]=o[ix][k];}
          }
        }
      }
    }}
    if(mode=='master'){me.infoLog('CONFIG>>'+JSON.stringify(me.CFG));}
    me.Mode=mode;
  }
  /**
 * ローカル設定ファイル(json)の読み込み
 * @param  {Object} op オプション({fn: ファイルパス, [infoj: true/false, stop: true/false]})
 * @return {Object}    環境設定情報/false（結果） ->me.error
 * @method
 */
  localConf (op) {
    let me=this; op=op||{};
    let fn=op.fn||process.argv[1].replace(/\.js/, '.cfg');
    let infoj=op.infoj||false; let stop=op.stop||false; me.error='';
    let rc;
    try{
      rc=this.getFs(fn); if(infoj){this.INFOJ=JSON.parse(rc);}else{this.CFG=JSON.parse(rc);}
      if(rc){return JSON.parse(rc);}else{return {};}
    }catch(e){
      if(stop){me.sevierLog(e);}else{me.error=e; return {};}
    }
  }
  /**
 * 辞書の検索
 * @param  {String} key   対象ワード
 * @param  {String} field 変換言語
 * @return {String}       翻訳結果
 * @method
 */
  dict(key, field) {
    let me=this, rc; me.error=''; field=field||'jp';
    if(me.DICT==''){me.DICT=me.getObject(me.CFG.dictionary, true);}
    try{rc=me.DICT[key][field];}catch(e){me.error=e; rc=key;}
    return rc;
  }
  /**
 * バッチ用メインルーチン定義
 * @param  {Function} proc ルーチン処理
 * @param  {Object}   op   環境変数(CFG)の置き換え
 * @method
 */
  MAIN(proc, op) {
    FIBERS(function(me){
      op=op||{};
      me.info(op.group);
      for(var k in op){me.CFG[k]=op[k];}
      proc(me, this);
    }).run(this);
  }
  /**
   * 自動実行時に実行される処理をオーバーライドする
   * @return {Void} none
   * @method
   */
  mainProcedure(){
    console.log('This should be overrided!!');
  }
  /**
 * セッションルーチンの手続き
 * @param  {Function} proc セッションルーチン
 * @method
 */
  PROC(proc) {
    FIBERS(function(me){
      proc(me, this);
    }).run(this);
  }
  /**
 * 起動引数の取り出し
 * @param  {Integer} n (n個目)==>値
 * @return {String}    指定されたn個目の引数
 * @method
 */
  argv(n) {return process.argv[n+2];}
  /**
 * テンプレートの呼び出し展開
 * @param  {String} fname テンプレートファイルパス
 * @param  {Object} dt    ローカル変数データ
 * @param  {Integer} ix   レコード変数(REC, %{...})参照時のレコード番号
 * @return {String}       呼び出し結果|false
 * @method
 */
  develop(fname, dt, ix) {
    let me=this; if(!dt){dt=me.REC;} if(!ix){ix=0;}
    let d=me.getText(fname, true);
    let f={}; f.HEAD=''; f.BODY=''; f.FOOT='';
    let k='BODY', out='';
    let i;
    if(d){
      if(d[0]){
        if(d[0].charCodeAt(0)==65279){d[0]=d[0].substr(1);} // bom除去feff
        if(d[0].charCodeAt(0)==65534){d[0]=d[0].substr(1);} // bom除去fffe
      }
      for(i in d){
        switch(d[i]){
        case '-HEAD': k='HEAD'; break; case '-BODY': k='BODY'; break; case '-FOOT': k='FOOT'; break;
        default: f[k]+=d[i]+NL;
        }
      }
    }else{return false;}
    let url;
    if(f.BODY){
      out=me.parm(f.HEAD, dt[ix]);
      for(i in dt){
        url=dt[i].url||''; if(url==me.INFOJ.url){me.INFOJ.now='now';}else{me.INFOJ.now='';}
        out+=me.parm(f.BODY, dt[i]);
      }
      out+=me.parm(f.FOOT, dt[ix]);
    }else{me.error='#ERROR MEM frame='+fname; return false;}
    return out;
  }
  /**
 * パラメータを展開する
 * #{}<-INFOJ, %{}<-REC, ${}<-SCREEN &{}<- CFG
 * @param  {String} ln  展開対象データ
 * @param  {String} dt  ローカル変数(%{...})
 * @param  {Integer} ix RECの行番号
 * @return {String}     展開結果
 * @method
 */
  parm(ln, dt, ix, i, j, c, sw, out, cc, key) { // develop parameter
    let me=this; sw=0; out=''; key=''; if(!ix){ix=0;}
    if(!ln){return '';}
    for(i=0; i<ln.length; i++){
      c=ln.substr(i, 1); cc=ln.substr(i, 2);
      switch(sw){
      case 0:
        switch(cc){
        case '#{': sw=1; i++; key=''; break; case '%{': sw=2; i++; key=''; break;
        case '${': sw=3; i++; key=''; break; case '&{': sw=4; i++; key=''; break;
        default: if(cc>'%0' && cc<'%9'){sw=9;}else{out+=c;} break;
        } break;
      case 1:
        if(c=='}'){if(me.INFOJ[key]!==undefined){out+=me.INFOJ[key];} sw=0;}
        else{key+=c;} break;
      case 2:
        if(c=='}'){
          if(dt){if(dt[key]!==undefined){out+=dt[key];}}
          else{if(me.REC[ix]!==undefined){out+=me.REC[ix][key];}}
          sw=0;
        }else{
          key+=c;
        } break;
      case 3:
        if(c=='}'){if(me.SCREEN[key]!==undefined){out+=me.SCREEN[key];} sw=0;}else{key+=c;} break;
      case 4:
        if(c=='}'){if(me.CFG[key]!==undefined){out+=me.CFG[key];} sw=0;}else{key+=c;} break;
      }
    }
    return out;
  }
  /**
 * 文字列をスペースデリミタで分解
 * @param  {String} x 対象データ
 * @return {Array}    分解結果
 * @method
 */
  unstring(x) {
    let win=false, sin=false, ein=false, a=[], j=0;
    a[0]=''; a[1]='';
    let i; for(i=0; i<x.length; i++){
      if(ein){
        a[j]+=x[i]; ein=false;
      }else{
        switch(x[i]){
        case '\\':
          if(sin){ein=true;}else{a[j]+=x[i];}
          break;
        case '"':
          if(sin){sin=false; j++;}else{sin=true; a[j]='';}
          break;
        case ' ':
          if(sin){a[j]+=x[i];}else{if(win){j++; win=false;}} break;
        default:
          if(sin){a[j]+=x[i];}else{if(win){a[j]+=x[i];}else{win=true; a[j]=x[i];}} break;
        }
      }
    }
    return a;
  }
  /**
 * 空白（数はいくつでもよい）でワードを分離する("による包括と\によるエスケープが可)
 * @param  {String} txt 入力文字列
 * @return {Array}      ワード（分離後データ）配列
 * @method
 */
  spacedelimit(txt) {
    let s=0, out=[], e='', i, x;
    for(i=0; i<txt.length; i++){
      x=txt.chatacterAt(i);
      switch(s){
      case 0:
        if(x=='"'){s=1;}
        else if(x==' '){out.push(e); e='';}
        else{e+=x;}
        break;
      case 1:
        if(x=='\\'){s=2;}
        if(x=='"'){s=0;}else{e+=x;}
        break;
      case 2:
        switch(x){
        case 'n': e+=NL; s=1; break;
        case 'r': e+=RT; s=1; break;
        case '\\': e+='\\'; s=1; break;
        case '"': e+='"'; s=1; break;
        default: e+='\\'; e+=x; s=1;
        }
      }
    }
    if(e){out.push(e);}
    return out;
  }
  /**
 * カッコ内を抽出
 * @param  {String} txt 入力文字列
 * @return {String}     抽出文字列
 * @method
 */
  brakets(txt) {
    let out='', i, x, s=false;
    for(i=0; i<txt.length; i++) {
      x=txt[i];
      switch(x) {
      case '(': s=true; break;
      case ')': return out;
      default: if(s){out+=x;}
      }
    }
    return '';
  }
  /**
 * base64変換
 * @param  {String} txt    対象テキストデータ
 * @param  {String} method encode|decode
 * @return {String}        変換後データ
 * @method
 */
  base64(txt, method) {
    let b, s;
    if(method=='encode'){
      b=new Buffer(txt); s=b.toString('base64');
    }else{
      b=new Buffer(txt, 'base64'); s=b.toString();
    }
    return s;
  }
  /**
 * 指定された文字移行の文字列の取り出し
 * @param  {String} txt 対象文字列
 * @param  {String} x   指定文字
 * @return {String}     取り出し結果
 * @method
 */
  lastOf(txt, x) {
    let i;
    for(i=txt.length-1; i>-1; i--){if(txt[i]==x){return i;}}
    return -1;
  }
  /**
 * パスからディレクトリ部の取り出し
 * @param  {String} txt 対象パス
 * @return {String}     結果ディレクトリ部分
 * @method
 */
  pathpart(x) {
    let p=x.lastIndexOf('/'); if(p<0){return '';} return x.substr(0, p+1);
  }
  pullDir(txt) {
    let i=this.lastOf(txt, '/'); return txt.substr(0, i+1);
  }
  /**
 * ァイル名部分を取り出し
 * @param  {String} x パス
 * @return {String}   ファイル名部分
 * @method
 */
  filepart(x) {
    let p=x.lastIndexOf('/'); if(p<0){return x;} p++; return x.substr(p);
  }
  /**
 * 接尾拡張子を取り出し
 * @param  {String} x パス
 * @return {String}   拡張子
 * @method
 */
  modifier(x) {
    let p=x.lastIndexOf('.'); if(p<0){return '';} p++; return x.substr(p);
  }
  /**
 * 文字列置換
 * @param  {String} txt 対象フィールド全体
 * @param  {String} x   置換対象文字列
 * @param  {String} y   置換文字列
 * @return {String}     置き換え結果
 * @method
 */
  repby(txt, x, y) {
    let out='', i; for(i in txt){if(txt[i]==x){out+=y;}else{out+=txt[i];}} return out;
  }
  /**
 * 分離符の前後に分ける
 * @param  {String} txt 対象文字列
 * @param  {String} x   分離符
 * @return {Array}      分離結果[0,1]
 * @method
 */
  separate(txt, x) {
    let out=[], i; out[0]=''; out[1]='';let f=true;
    for(i in txt){
      if(f && txt[i]==x){f=false;}else{if(f){out[0]+=txt[i];}else{out[1]+=txt[i];}}
    }
    return out;
  }
  /**
 * 日付編集(YMD, ymd, HIS, his, W, w)
 * @param  {String} t    編集文字列
 * @param  {String} time 日付時間文字列、省略時は現在
 * @return {String}      編集結果
 * @method
 */
  date(t, time) {
    let d;
    if(time){d=new Date(time);}else{d=new Date();}
    t=t.replace(/Y/, d.getYear()-100); t=t.replace(/y/, d.getYear()+1900);
    t=t.replace(/M/, (d.getMonth()+101+' ').substr(1, 2)); t=t.replace(/m/, d.getMonth()+1);
    t=t.replace(/D/, (d.getDate()+100+' ').substr(1, 2)); t=t.replace(/d/, d.getDate());
    t=t.replace(/H/, (d.getHours()+100+' ').substr(1, 2)); t=t.replace(/h/, d.getHours());
    t=t.replace(/I/, (d.getMinutes()+100+' ').substr(1, 2)); t=t.replace(/i/, d.getMinutes());
    t=t.replace(/S/, (d.getSeconds()+100+' ').substr(1, 2)); t=t.replace(/s/, d.getSeconds());
    t=t.replace(/W/, ['日', '月', '火', '水', '木' ,'金' , '土'][d.getDay()]);
    t=t.replace(/w/, ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()]);
    return t;
  }
  /**
 * 今日の日付編集
 * @param  {String} f 編集文字列,省略時Y/M/D
 * @return {String}   編集結果
 * @method
 */
  today(f) {
    f=f||'Y/M/D'; return this.date(f);
  }
  /**
 * 今の時刻編集
 * @param  {String} f 編集文字列、省略時H:I:S
 * @return {String}   編集結果
 * @method
 */
  now(f) {
    f=f||'H:I:S'; return this.date(f);
  }
  /**
 * 日付演算
 * @param  {String} days 加算日数
 * @param  {String} from 対象日付
 * @param  {string} form 編集文字列,省略時Y/M/D
 * @method
 */
  addDays(days, from, form) {
    let me=this, d;
    d=from||new Date(); form=form||'YMD'; days=days||0;
    d.setTime(d.getTime()+(days*86400000));
    return me.date(form, d);
  }
  /**
 * 現在のunixタイムを取得する
 * @return {Integer} 現在タイムスタンプ(ミリ秒)
 * @method
 */
  unixTime() {
    let date=new Date();
    return date.getTime();
  }
  /**
 * 保存された時刻からの経過時間がlimitを超えているかを判断
 * @param  {Integer} area  UnixTimeの保存領域
 * @param  {Integer} limit 限界時間(秒)、省略時60秒
 * @return {Boolean}       true/false
 * @method
 */
  unixStamp(area, limit) {
    let me, t; limit=limit||60;
    if(area) {
      t=me.unixTime();
      if( (t-area) > (limit*60) ) {area=t; return true;}
    }else{
      area=t; return true;
    }
    return false;
  }
  /**
 * Arrayオブジェクトのソート
 * @param  {Array}   data   ソート対象データ
 * @param  {Array}   keys   キー項目配列
 * @param  {Boolean} desend 降順ソート時にtrue
 * @return {Array}          結果データ
 * @method
 */
  sort(data, keys, desend) {
    let i, j, k, k1, k2, w, s=String.fromCharCode(0x00);
    for(i=0; i<data.length-1; i++){
      for(j=i+1; j<data.length; j++){
        k1=''; for(k in keys){k1+=s+data[i][keys[k]];}
        k2=''; for(k in keys){k2+=s+data[j][keys[k]];}
        if(k1 > k2){
          if(!desend){w=data[j]; data[j]=data[i]; data[i]=w;}
        }else{
          if(desend){w=data[j]; data[j]=data[i]; data[i]=w;}
        }
      }
    }
    return data;
  }
  /**
 * ファイル存在確認
 * @param  {String} fn ファイルパス
 * @return {Boolean}   true/false
 * @method
 */
  isExist(fn) {
    try{return Fs.existsSync(fn);}catch(e){return false;}
  }
  /**
 * ディレクトリ作成
 * @param  {String} dn ディレクトパス
 * @return {Bool}      true/false
 * @method
 */
  mkdir(dn) {
    let me=this;
    try{return Fs.mkdirSync(dn);}catch(e){me.error=e; return false;}
  }
  /**
 * ディレクトリがなければ作成
 * @param  {String} dirs    ディレクトリ名
 * @param  {String} current 作成場所,省略時$HOME
 * @return {Bool}           true/false
 * @method
 */
  checkDir(dirs, current) {
    let me=this, ix, dn; current=current||me.CFG.home+'/';
    for(ix in dirs){dn=current+dirs[ix];if(!me.isExist(dn)){me.mkdir(dn);}}
  }
  /**
 * ディレクトリリスト
 * @param  {String} path ディレクトリパス
 * @param  {String} type file/dir/省略両方
 * @return {Array}       結果リスト
 * @method
 */
  dir(path, type) {
    let me=this, out=[]; me.error='';
    try{
      switch(type){
      case 'file':
        Fs.readdirSync(path).forEach((file) => {
          if(Fs.statSync(path+file).isFile()){out.push(file);}
        });
        return out;
      case 'dir':
        Fs.readdirSync(path).forEach((file) => {
          if(!Fs.statSync(path+file).isFile()){out.push(file);}
        });
        return out;
      default:
        return Fs.readdirSync(path);
      }
    }catch(e){me.error=e; return {};}
  }
  /**
 * ファイル属性の取得
 * @param  {String} fn ファイルパス
 * @return {Object}    結果属性
 * @method
 */
  stat(fn) {
    let out={}, x, k;
    if(this.isExist(fn)){
      x=Fs.statSync(fn); for(k in x){
        switch(k){
        case 'atime': case 'mtime': case 'ctime':
          out[k]=this.date('YMDHIS', x[k]);
          break;
        default: out[k]=x[k]; break;
        }
      }
      return out;
    }else{return false;}
  }
  /**
 * オブジェクト形式ファイル読み込み(RECインターフェイス)
 * @param  {String} fname   ファイルパス
 * @param  {String} ret     結果種別true(returnで返す)/false(me.RECに編集)
 * @return {Object/Integer} 内容オブジェクト/件数
 * @method
 */
  getObject(fname, ret) {
    let me=this, d, rc={}; me.error='';
    if(me.isExist(fname)){
      d=me.getFs(fname);
      if(d){rc=JSON.parse(d);}
    }else{me.error='file not found f='+fname; return false;}
    if(ret){return rc;}else{me.REC=rc; return me.REC.length;}
  }
  /**
 * テキストファイル読み込み
 * @param  {String} fname   テキストファイルパス
 * @param  {Array} ret      結果場所指定(true:return/false:me.REC)
 * @return {Array|Integer}  結果(結果配列/REC件数)
 * @method
 */
  getText(fname, ret) {
    let me=this, d, p=0, i=0, out=[]; me.error='';
    try{
      d=me.getFs(fname);
      if(d){while(p>-1){
        p=d.indexOf(NL);
        if(p<0){out[i]=d;}else{out[i]=d.substr(0, p); d=d.substr(p+1);}
        if(out[i].indexOf(RT)>-1){out[i]=out[i].substr(0, out[i].length-1);} i++;
      }}
      if(ret){return out;}
      else{me.REC=[]; for(i in out){me.REC[i]={}; me.REC[i].data=out[i];} return me.REC.length;}
    }catch(e){me.error=e; return false;}
  }
  /**
 * JSONファイル読み込み
 * @param  {String} fn JSONファイルパス
 * @return {Object}    読み込み結果オブジェクト
 * @method
 */
  getJson(fn) {
    let rc;
    try{
      rc=this.getFs(fn); if(rc){return JSON.parse(rc);}else{return false;}
    }catch(e){this.error=e;}
  }
  /**
 * ファイル読み込み
 * @param  {String} fn ファイルパス
 * @return {String} 読み込み結果
 * @method
 */
  getFs(fn) {
    this.error='';
    let d;
    if(this.isExist(fn)){d=Fs.readFileSync(fn).toString(); return d;}
    else{this.error='file not found file='+fn; return false;}
  }
  /**
 * 自分のIPアドレスを取得する
 * @param  {String} id  デバイスID(ex. wlan0, lan0...)省略時は全件
 * @param  {String} ver バージョン(ipv4/ipv6)省略時ipv4
 * @return {Object}     結果IPアドレス/false
 * @method
 */
  getIp(id, ver) {
    let me=this; ver=ver||'ipv4';
    let a=me.getIPs()[ver];
    let i; for( i in a){
      if(!id){return a[i].address;}
      else{if(id==a[i].name){return a[i].address;}}
    }
    return false;
  }
  getIPs() {
    let o={}; o.ipv4=[]; o.ipv6=[];
    let nif=Os.networkInterfaces();
    let k, j, x;
    for(k in nif){for(j in nif[k]){
      x=nif[k][j];
      if(!x.internal){
        switch(x.family){
        case 'IPv4': o.ipv4.push({name: k, address: x.address}); break;
        case 'IPv6': o.ipv6.push({name: k, address: x.address}); break;
        }
      }
    }}
    return o;
  }
  /**
 * シェルコマンドを実行して、me.stdoutに標準出力を返す
 * @param  {String} cmd 実行コマンド
 * @return {Bool}       処理結果(true/false)
 * @method
 */
  shell(cmd) {
    let me=this, rc;
    try{
      rc=Cp.execSync(cmd);
      me.stdout=rc.toString('utf8');
      rc=true;
    }catch(e){
      me.infoLog('コマンドエラー', e); rc=false;
      me.stdout='';
    }
    return rc;
  }
  /**
 * イベント監視
 * @param  {String} ev     イベント名
 * @param  {Function} proc 発火時実行処理
 * @return {Void}          none
 * @method
 */
  on(ev, proc) {
    this.Custom.ev=new Ev.EventEmitter();
    this.Custom.ev.on(ev, proc);
  }
  /**
 * イベント通知
 * @param  {String}   ev   イベント名
 * @param  {Anything} arg1 通知情報
 * @param  {Anything} arg2 通知情報
 * @param  {Anything} arg3 通知情報
 * @return {Bool}          true/false -> me.error
 * @method
 */
  fire(ev, arg1, arg2, arg3) {
    if(this.Custom[ev]){this.Custom[ev].emit(ev, arg1, arg2, arg3); return true;}
    else{this.error='event not found ev='+ev; return false;}
  }
  /**
 * イベント監視取り消し
 * @param  {String} ev イベント名
 * @return {Bool}      true/false
 * @method
 */
  off(ev) {
    let me=this;
    if(this.Custom[ev]){this.Custom[ev].removeListener(ev, () => {delete me.Custom[ev];});}
    else{this.error='event not found ev='+ev; return false;}
    return true;
  }
  /**
 * 逐次制御開始
 * @return {Integer} 監視番号
 * @method
 */
  ready() {
    var id=Math.random();
    this.Event[id]=FIBERS.current;
    return id;
  }
  /**
 * 逐次制御待ち合わせ
 * @return {Anything} 待ち合わせ解除時引き渡し情報
 * @method
 */
  wait() {
    var rc=FIBERS.yield();
    return rc;
  }
  /**
 * 逐次制御解除
 * @param  {Integer}  id 監視番号
 * @param  {Anything} dt 引き渡しデータ
 * @return {Void}        none
 * @method
 */
  post(id, dt) {this.Event[id].run(dt); delete this.Event[id];}
  /**
 * 時間待ち合わせ
 * @param  {Integer} ms 待ち合わせ時間（ミリ秒）
 * @return {Void}       none
 * @method
 */
  sleep(ms) {
    let wid=this.ready();
    setTimeout(() => {this.post(wid);}, ms);
    this.wait();
  }
  /**
 * デバッグモードを調べる
 * @return {Boolean} true/false
 * @method
 */
  isDebug() {
    if(!this.CFG){return true;} if(this.CFG.mode=='debug'){return true;}
    return false;
  }
  /**
 * グローバルエラーを補足
 * @return {void} none
 * @method
 */
  surveillance() {
    let me=this;
    window.onerror=function(message, file, line) {
      me.sevierLog(message, 'File:'+file+', line:'+line);
    };
  }
  /**
 * 重大エラーメッセージ
 * @param  {string} msg エラーメッセージ
 * @param  {String} e   エラー内容
 * @return {Void}       none
 * @method
 */
  sevierLog(msg, e) { // 重大エラー
    let me=this, d={}, l; d.msg=msg;
    if(e){d=me.analyze(e); d.msg=msg;}else{d=me.getPos(msg);} l='sevier';
    this.putlog(l, d);
    me.notify(l, 'システムエラー通知 ['+l+'] ',d);
  }
  /**
 * エラーメッセージ
 * @param  {String} msg エラーメッセージ
 * @param  {String} e   エラー内容
 * @return {Void}       none
 * @method
 */
  errorLog (msg, e) { // 通常エラー処理、ログ記録
    let me=this, d={}, l;
    if(e){d=me.analyze(e); d.msg=msg;}else{d=me.getPos(msg);} l='error';
    this.putlog(l, d);
  }
  /**
 * 注意メッセージ
 * @param  {String} msg 注意メッセージ
 * @return {Void}       none
 * @method
 */
  noticeLog(msg) {
    let me=this, d=this.getPos(msg), l='notice';
    this.putlog(l, d);
    me.notify(l, 'システム情報 ['+l+'] ', d);
  }
  /**
 * 警告メッセージ
 * @param  {String} msg 警告メッセージ
 * @return {Void}       none
 * @method
 */
  warnLog(msg) { // 警告メッセージ
    let d=this.getPos(msg), l='warn';
    this.putlog(l, d);
  }
  /**
 * 一般メッセージ
 * @param  {String} msg メッセージ
 * @param  {String} e   エラー内容など
 * @return {Void}       none
 * @method
 */
  infoLog(msg, e) { // エラーかどうかはアプリで判断
    let me=this, d={}, l;
    if(e){d=me.analyze(e); d.msg=msg;}else{d.msg=msg;} l='info';
    this.putlog(l, d);
  }
  /**
 * デバッグ情報
 * @param  {String} msg メッセージ
 * @return {Void}       none
 * @method
 */
  debugLog(msg) { // デバッグ用記録
    const me=this;
    let d, l;
    if(me.isDebug()){
      d=[msg]; l='debug';
      this.putlog(l, d);
    }
  }
  /**
 * ログのみ出力
 * @param  {String} msg メッセージ
 * @return {Void}       none
 * @method
 */
  justLog(msg) { // ログのみ
    let d=this.getPos(msg), l='debug';
    this.putlog(l, d);
  }
  /**
 * ログファイル出力
 * @param  {String} level メッセージレベル（sevier/error/info/warn/debug/notice）
 * @param  {Array} lines  メッセージ配列
 * @return {Void}         none
 * @method
 */
  putlog(level, lines) {
    let me=this, out, k;
    try{
      for(k in lines){
        out=me.date('Y/M/D H:I:S')+' ['+level+'] '+k+': '+lines[k]+'\n';
        if(me.CFG.mode=='master'){Fs.appendFileSync(me.CFG.log, out);}
        console.log(out);
      }
    }catch(e){
      console.log(out);
      console.log('error:', e);
    }
  }
  /**
 * コミュニケータにwebhook(起動環境CFG.communicatorでPOSTリクエスト)
 * @param  {String} level   メッセージレベル
 * @param  {String} subject メッセージタイトル
 * @param  {Object} data    メッセージタイトル
 * @return {Object}         送信結果
 * @method
 */
  notify(level, subject, data) {
    let me=this, rc; data=data||{};
    if(me.CFG.notify=='yes'){
      data.subject=subject; data.level=level; data.debug=me.isDebug();
      data.program=JSON.stringify(process.argv);
      rc=me.postRequest(me.CFG.communicator, data);
      if(!rc){console.log('NOTIFY ERROR');}
    }
  }
  /**
 * HTTPリクエストGETメソッド
 * @param  {Object} op     HTTP URLオプション{hostname, port, path}
 * @param  {Bool} json     JSONデータtrue/false
 * @param  {Bool} secure   HTTPStrue/false
 * @return {Object}        結果 JSON/空
 */
  getRequest(op, json, secure) {
    let me=this;
    op=op||{}; op.hostname=op.hostname||'localhost';
    op.path=op.path||'/';

    let body;
    let wid=this.ready();
    let obj;
    if(secure){obj=Hps;}else{obj=Hp;}
    obj.get(op, (res) => {
      body=''; res.setEncoding('utf8');
      res.on('data', (chunk) => {body+=chunk;
      });
      res.on('end', () => {me.post(wid);
      });
    }).on('error', (e) => {
      console.log('error:'+e);
      me.error=e.message; me.post(wid);
    });
    me.wait();
    try{
      if(json){return JSON.parse(body);}
      else{return body;}
    }catch(e){
      me.error=e; return {};
    }
  }
  /**
 * HTTPリクエストPOSTメソッド
 * @param  {Object} op     URLオブジェクト{hostname, port, path, search...}
 * @param  {Object} data   POSTデータ
 * @param  {Bool} secure   HTTPS true/[false]
 * @param  {Bool} json     JSON true/[false]
 * @return {Object}        JSONデータ/空
 * @method
 */
  postRequest(op, data, secure, json) {
    let me=this;
    op=op||{}; op.hostname=op.hostname||'localhost';
    op.path=op.path||'/'; op.method='POST';
    let sd=encodeURIComponent(JSON.stringify(data));
    op.headers=op.headers||{};
    op.headers['Content-Length']=sd.length;
    console.log(op);
    console.log(sd);
    let body, req;
    let wid=me.ready();
    let o;
    if (secure) {o=Hps;}else{o=Hp;}
    req=o.request(op, (res) => {
      body=''; res.setEncoding('utf8');
      res.on('data', (chunk) => {body+=chunk;});
      res.on('end', () => {me.post(wid);});
    }).on('error', (e) => {me.error=e.message; me.post(wid);});
    req.write(sd); req.end();
    me.wait();
    try{
      if(json){
        return JSON.parse(body);
      }else{
        return body;
      }
    }catch(e){
      me.error=e; return {'body': body};
    }
  }
  getPos(msg) {
    try{throw new Error(msg);}catch(e){return this.analyze(e, 3);}
  }
  analyze(e, n) {
    n=n||1; let out={}, a, p;
    if(e.stack){
      a=e.stack.split(/[\r\n]+/);
      out.err=a[0];
      p=a[n].indexOf('at '); out.pos=a[n].substr(p+3);
      if(this.Related){out.related=this.Related;}
    }
    return out;
  }
  exit() {process.exit();}
};
