/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import {
  Live2DCubismFramework as live2dcubismframework,
  Option as Csm_Option
} from '@framework/live2dcubismframework';

import { Live2DCubismFramework as cubismmath } from '@framework/math/cubismmath';
import CubismMath = cubismmath.CubismMath;

import Csm_CubismFramework = live2dcubismframework.CubismFramework;
import { LAppView } from './lappview';
import { LAppPal } from './lapppal';
import { LAppTextureManager } from './lapptexturemanager';
import { LAppLive2DManager } from './lapplive2dmanager';
import * as LAppDefine from './lappdefine';

export let canvas: HTMLCanvasElement = null;
export let s_instance: LAppDelegate = null;
export let gl: WebGLRenderingContext = null;
export let frameBuffer: WebGLFramebuffer = null;

/**
 * アプリケーションクラス。
 * Cubism SDKの管理を行う。
 */
export class LAppDelegate {
  /**
   * クラスのインスタンス（シングルトン）を返す。
   * インスタンスが生成されていない場合は内部でインスタンスを生成する。
   *
   * @return クラスのインスタンス
   */
  public static getInstance(): LAppDelegate {
    if (s_instance == null) {
      s_instance = new LAppDelegate();
    }

    return s_instance;
  }

  /**
   * クラスのインスタンス（シングルトン）を解放する。
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance.release();
    }

    s_instance = null;
  }

  /**
   * APPに必要な物を初期化する。
   */
  public initialize(canvasInstance: HTMLCanvasElement, resources: any): boolean {

    // 使用自定义的资源
    LAppDefine.setResources(resources);

    // 使用传入的canvas
    /*
    // キャンバスの作成
    canvas = document.createElement('canvas');
    canvas.width = LAppDefine.RenderTargetWidth;
    canvas.height = LAppDefine.RenderTargetHeight;
    */
    
    // 转PNG
    canvas = canvasInstance;
    canvas.toDataURL("image/png");
    // 记录半长和半宽
    this.canvasHalfWidth = canvas.width / 2;
    this.canvasHalfHeight = canvas.height / 2;
    this.canvasTop = canvas.getBoundingClientRect().top;
    this.canvasLeft = canvas.getBoundingClientRect().left;

    // glコンテキストを初期化
    // @ts-ignore
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      alert('Cannot initialize WebGL. This browser does not support.');
      gl = null;

      document.body.innerHTML =
        'This browser does not support the <code>&lt;canvas&gt;</code> element.';

      // gl初期化失敗
      return false;
    }

    // 使用的是传入的canvas，不追加了
    // キャンバスを DOM に追加
    //document.body.appendChild(canvas);

    if (!frameBuffer) {
      frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    }

    // 透過設定
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const supportTouch: boolean = 'ontouchend' in canvas;

    if (supportTouch) {
      // タッチ関連コールバック関数登録
      canvas.ontouchstart = onTouchBegan;
      canvas.ontouchmove = onTouchMoved;
      canvas.ontouchend = onTouchEnded;
      canvas.ontouchcancel = onTouchCancel;
    } else {
      // マウス関連コールバック関数登録
      canvas.onmousedown = onClickBegan;
      // 这是在canvas上移动时响应，改为全WINDOW
      //canvas.onmousemove = onMouseMoved;
      window.onmousemove = onMouseMoved;
      canvas.onmouseup = onClickEnded;
    }

    // AppViewの初期化
    this._view.initialize();

    // Cubism SDKの初期化
    this.initializeCubism();

    return true;
  }

  /**
   * 解放する。
   */
  public release(): void {
    this._textureManager.release();
    this._textureManager = null;

    this._view.release();
    this._view = null;

    // リソースを解放
    LAppLive2DManager.releaseInstance();

    // Cubism SDKの解放
    Csm_CubismFramework.dispose();
  }

  // 设置立绘的大小缩放和偏移
  public static setScaleAndOffset(scaleX: number, scaleY: number, offsetX: number, offsetY: number): void{
    LAppDefine.setScaleAndOffset({
      ScaleX: scaleX,
      ScaleY: scaleY,
      OffsetX: offsetX,
      OffsetY: offsetY
    });
  }

  /**
   * 実行処理。
   */
  public run(): void {

    if(this._run){
      return;
    }

    // 设置为播放
    this._run = true;
    // メインループ
    const loop = (): void => {
      // インスタンスの有無の確認
      if (s_instance == null) {
        return;
      }

      // 暂停直接退出Loop
      if(this._run === false){
        return;
      }

      // 時間更新
      LAppPal.updateTime();

      // 画面の初期化
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      // 深度テストを有効化
      gl.enable(gl.DEPTH_TEST);

      // 近くにある物体は、遠くにある物体を覆い隠す
      gl.depthFunc(gl.LEQUAL);

      // カラーバッファや深度バッファをクリアする
      // 清除彩色缓冲区和深度缓冲区  （加上这一句会导致有些浏览器背景变成黑色，而不是透明）
      //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.clearDepth(1.0);

      // 透過設定
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // 描画更新
      this._view.render();

      // ループのために再帰呼び出し
      requestAnimationFrame(loop);
    };
    loop();
  }

  // 暂停Live2D动画
  public pause(): void{
    this._run = false;
  }

  public isRunning(): boolean{
    return this._run;
  }

  /**
   * シェーダーを登録する。
   */
  public createShader(): WebGLProgram {
    // バーテックスシェーダーのコンパイル
    const vertexShaderId = gl.createShader(gl.VERTEX_SHADER);

    if (vertexShaderId == null) {
      LAppPal.printMessage('failed to create vertexShader');
      return null;
    }

    const vertexShader: string =
      'precision mediump float;' +
      'attribute vec3 position;' +
      'attribute vec2 uv;' +
      'varying vec2 vuv;' +
      'void main(void)' +
      '{' +
      '   gl_Position = vec4(position, 1.0);' +
      '   vuv = uv;' +
      '}';

    gl.shaderSource(vertexShaderId, vertexShader);
    gl.compileShader(vertexShaderId);

    // フラグメントシェーダのコンパイル
    const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

    if (fragmentShaderId == null) {
      LAppPal.printMessage('failed to create fragmentShader');
      return null;
    }

    const fragmentShader: string =
      'precision mediump float;' +
      'varying vec2 vuv;' +
      'uniform sampler2D texture;' +
      'void main(void)' +
      '{' +
      '   gl_FragColor = texture2D(texture, vuv);' +
      '}';

    gl.shaderSource(fragmentShaderId, fragmentShader);
    gl.compileShader(fragmentShaderId);

    // プログラムオブジェクトの作成
    const programId = gl.createProgram();
    gl.attachShader(programId, vertexShaderId);
    gl.attachShader(programId, fragmentShaderId);

    gl.deleteShader(vertexShaderId);
    gl.deleteShader(fragmentShaderId);

    // リンク
    gl.linkProgram(programId);

    gl.useProgram(programId);

    return programId;
  }

  /**
   * View情報を取得する。
   */
  public getView(): LAppView {
    return this._view;
  }

  public getTextureManager(): LAppTextureManager {
    return this._textureManager;
  }

  // 转化全屏坐标为画布坐标
  public getMouseTargetToCanvas(e: MouseEvent): any{

    let relativeX: number = e.clientX - this.canvasLeft - this.canvasHalfWidth;
    let relativeY: number = e.clientY - this.canvasTop - this.canvasHalfHeight;

    if(Math.abs(relativeX) > this.canvasHalfWidth){
      let a: number = Math.abs(relativeX) / this.canvasHalfWidth;
      if(a > 1.0){
        relativeX /= a;
        relativeY /= a;
      }
    }

    if(Math.abs(relativeY) > this.canvasHalfHeight){
      let a: number = Math.abs(relativeY) / this.canvasHalfHeight;
      if(a > 1.0){
        relativeX /= a;
        relativeY /= a;
      }
    }

    relativeX = CubismMath.clamp(Math.floor(relativeX + this.canvasHalfWidth), 0, 2 * this.canvasHalfWidth);
    relativeY = CubismMath.clamp(Math.floor(relativeY + this.canvasHalfHeight), 0, 2 * this.canvasHalfHeight);

    return {x: relativeX, y: relativeY};
  }

  // 调用motion
  // callback: (motion: ACubismMotion) => void
  public static startMotion(group: string, index: number, priority: number, callback?:any ): void{
    let instance = LAppDelegate.getInstance();
    if(instance && instance.isRunning()){
      LAppLive2DManager.getInstance().startMotion(group, index, priority, callback);
    }
  }

  // 调用expression
  public static startExpression(expression: string): void{
    let instance = LAppDelegate.getInstance();
    if(instance && instance.isRunning()){
      LAppLive2DManager.getInstance().startExpression(expression);
    }
  }

  // 设定点击区域名称和对应回调函数
  public static clearHitArea(): void{
    LAppDefine.clearHitArea();
  }
  public static setHitAreaAndCallback(name: string, callback: () => void): void{
    LAppDefine.setHitAreaAndCallback(name, callback);
  }

  // 切换立绘
  public static getFigureIndex(): number{
    return LAppLive2DManager.getInstance()._sceneIndex;
  }
  public static setFigureIndex(index: number): void{
    if(LAppDefine.ModelDirSize <= 0){
      return;
    }
    index = CubismMath.clamp(index, 0, LAppDefine.ModelDirSize - 1);
    LAppLive2DManager.getInstance().changeScene(index);
  }


  /**
   * コンストラクタ
   */
  constructor() {
    this._captured = false;
    this._mouseX = 0.0;
    this._mouseY = 0.0;
    this._isEnd = false;

    this._cubismOption = new Csm_Option();
    this._view = new LAppView();
    this._textureManager = new LAppTextureManager();

    this._run = false;

    this.canvasHalfWidth = 0;
    this.canvasHalfHeight = 0;
  }

  /**
   * Cubism SDKの初期化
   */
  public initializeCubism(): void {
    // setup cubism
    this._cubismOption.logFunction = LAppPal.printMessage;
    this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel;
    Csm_CubismFramework.startUp(this._cubismOption);

    // initialize cubism
    Csm_CubismFramework.initialize();

    // load model
    LAppLive2DManager.getInstance();

    LAppPal.updateTime();

    this._view.initializeSprite();
  }

  _cubismOption: Csm_Option; // Cubism SDK Option
  _view: LAppView; // View情報
  _captured: boolean; // クリックしているか
  _mouseX: number; // マウスX座標
  _mouseY: number; // マウスY座標
  _isEnd: boolean; // APP終了しているか
  _textureManager: LAppTextureManager; // テクスチャマネージャー

  _run: boolean; // 更新/暂停Live2D动画

  // 一些初始化后不变的缓存值
  // 画布半长和半宽以及位置
  canvasHalfWidth: number;
  canvasHalfHeight: number;
  canvasTop: number;
  canvasLeft: number;
}

/**
 * クリックしたときに呼ばれる。
 */
function onClickBegan(e: MouseEvent): void {
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }
  LAppDelegate.getInstance()._captured = true;

  const posX: number = e.pageX;
  const posY: number = e.pageY;

  LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * マウスポインタが動いたら呼ばれる。
 */
function onMouseMoved(e: MouseEvent): void {

  // 这是点住不放时响应，一般需要任何时候响应，注释掉
  /*
  if (!LAppDelegate.getInstance()._captured) {
    return;
  }
  */

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  // 这是将canvas默认为在整个页面的坐标，实际应该考虑鼠标在canvas外，对范围做个限制
  /*
  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;
  */
  
  let target = LAppDelegate.getInstance().getMouseTargetToCanvas(e);
  const posX: number = target.x;
  const posY: number = target.y;

  LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * クリックが終了したら呼ばれる。
 */
function onClickEnded(e: MouseEvent): void {
  LAppDelegate.getInstance()._captured = false;
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * タッチしたときに呼ばれる。
 */
function onTouchBegan(e: TouchEvent): void {
  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  LAppDelegate.getInstance()._captured = true;

  const posX = e.changedTouches[0].pageX;
  const posY = e.changedTouches[0].pageY;

  LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * スワイプすると呼ばれる。
 */
function onTouchMoved(e: TouchEvent): void {
  if (!LAppDelegate.getInstance()._captured) {
    return;
  }

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * タッチが終了したら呼ばれる。
 */
function onTouchEnded(e: TouchEvent): void {
  LAppDelegate.getInstance()._captured = false;

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * タッチがキャンセルされると呼ばれる。
 */
function onTouchCancel(e: TouchEvent): void {
  LAppDelegate.getInstance()._captured = false;

  if (!LAppDelegate.getInstance()._view) {
    LAppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}



