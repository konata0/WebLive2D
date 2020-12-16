/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { LogLevel } from '@framework/live2dcubismframework';

/**
 * Sample Appで使用する定数
 */
// 画面
export const ViewMaxScale = 2.0;
export const ViewMinScale = 0.8;

export const ViewLogicalLeft = -1.0;
export const ViewLogicalRight = 1.0;

export const ViewLogicalMaxLeft = -2.0;
export const ViewLogicalMaxRight = 2.0;
export const ViewLogicalMaxBottom = -2.0;
export const ViewLogicalMaxTop = 2.0;

// 缩放平移参数
export let ScaleX = 1.0;
export let ScaleY = 1.0;
export let OffsetX = 0;
export let OffsetY = 0;
export function setScaleAndOffset(para: any): void{
    ScaleX = para.ScaleX;
    ScaleY = para.ScaleY;
    OffsetX = para.OffsetX;
    OffsetY = para.OffsetY;
}

// 采用自定义的路径和资源，在LAppDelegate.getInstance().initialize中进行赋值
export let ResourcesPath: string = null;
export let BackImageName: string = null;
export let GearImageName: string = null;
export let ModelDir: string[] = [];
export let ModelDirSize: number = 0;
export function setResources(resources: any): void{
    ModelDir = resources.ModelDir;
    ModelDirSize = ModelDir.length;
    ResourcesPath = resources.ResourcesPath;
    BackImageName = resources.BackImageName;
    GearImageName = resources.GearImageName;
}

// 相対パス
//export const ResourcesPath = '../../Resources/';

// モデルの後ろにある背景の画像ファイル
//export const BackImageName = 'back_class_normal.png';

// 歯車
//export const GearImageName = 'icon_gear.png';

// 終了ボタン
export const PowerImageName = 'CloseNormal.png';

// モデル定義---------------------------------------------
// モデルを配置したディレクトリ名の配列
// ディレクトリ名とmodel3.jsonの名前を一致させておくこと
//export const ModelDir: string[] = ['Haru', 'Hiyori', 'Mark', 'Natori', 'Rice'];
//export const ModelDirSize: number = ModelDir.length;

// 外部定義ファイル（json）と合わせる
export const MotionGroupIdle = 'Idle'; // アイドリング
export const MotionGroupTapBody = 'TapBody'; // 体をタップしたとき


// 允许自定义部位名称与相应的响应函数，注意与model3.json中对应
export let HitAreaNameAndCallback: any = {};
export function clearHitArea(): void {
    HitAreaNameAndCallback = {};
}
export function setHitAreaAndCallback(name: string, callback: () => void): void{
    HitAreaNameAndCallback[name] = callback;
}

// 外部定義ファイル（json）と合わせる
//export const HitAreaNameHead = 'Head';
//export const HitAreaNameBody = 'Body';

// モーションの優先度定数
export const PriorityNone = 0;
export const PriorityIdle = 1;
export const PriorityNormal = 2;
export const PriorityForce = 3;

// デバッグ用ログの表示オプション
export const DebugLogEnable = true;
export const DebugTouchLogEnable = false;

// Frameworkから出力するログのレベル設定
export const CubismLoggingLevel: LogLevel = LogLevel.LogLevel_Verbose;

// 使用已有Canvas，不使用创建的
// デフォルトのレンダーターゲットサイズ
/*
export const RenderTargetWidth = 1900;
export const RenderTargetHeight = 1000;
*/
