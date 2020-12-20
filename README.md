# WebLive2D

由 Live2D Cubism 的 Demo 修改，重写了一些接口，方便使用。

### 修改文件

```
lappdefine.ts
lappdelegate.ts
lapplive2dmanager.ts
main.ts
```

### TS与JS

TS方便嵌入其他前端框架中，也便于源码修改，JS方便直接嵌入一般网页使用。

### 引入

TS下，复制Live2DTS至项目，主要接口位于lappdelegate.ts，在需要使用的地方导入。

```typescript
import { LAppDelegate } from './Live2DTS/lappdelegate';
```

引入Core中的核心JS文件，Live2DTS/Core/live2dcubismcore.js（按引入方式视具体项目框架而定）。

```html
<script src="./Live2DTS/Core/live2dcubismcore.js"></script>
```

tsconfig.json设置中添加Live2D框架的路径。

```json
{
  "compilerOptions": {
    "paths": {
      "@framework/*": ["./Live2DTS/Framework/src/*"]
    }
  }
}
```

package.json设置中添加必要的依赖。

```json
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^2.18.0",
    "@typescript-eslint/parser": "^2.18.0",
    "eslint": "^6.8.0",
    "eslint-config-prettier": "^6.10.0",
    "eslint-plugin-prettier": "^3.1.2",
    "prettier": "^1.19.1",
    "rimraf": "^3.0.1",
    "serve": "^11.3.0",
    "ts-loader": "^6.2.1",
    "typescript": "^3.7.5"
  },
  "dependencies": {
    "whatwg-fetch": "^3.0.0"
  }
```

JS下，直接在HTML引入Live2DJS文件夹下，编译生成的live2dcubismcore.js和Live2D.js即可。

```html
  <!-- Pollyfill script -->
  <script src="https://unpkg.com/core-js-bundle@3.6.1/minified.js"></script>
  <!-- Live2DCubismCore script -->
  <script src = "./Live2DJS/live2dcubismcore.js"></script>
  <!-- Build script -->
  <script src = "./Live2DJS/Live2D.js"></script>
```

### API

接口均位于LAppDelegate中。

------

获取LAppDelegate实例，LAppDelegate以单例存在

```typescript
public static getInstance(): LAppDelegate
```

------

释放实例

```typescript
public static releaseInstance(): void
```

------

获取LAppDelegate实例，LAppDelegate以单例存在

```typescript
public static getInstance(): LAppDelegate
```

------

初始化

```typescript
public initialize(canvasInstance: HTMLCanvasElement, resources: any): boolean
```

canvasInstance：页面canvas元素

resources：资源路径

```typescript
let resource = {
    ResourcesPath: "/assets/Live2D/",        // 立绘资源根目录
    BackImageName: "BackImage.png",          // 背景
    GearImageName: null,
    ModelDir: ["character0", "character1"]   // 立绘目录
};
```

资源目录：

----Live2D/

--------BackImage.png

--------character0/

--------character1/

------------character1.2048/（纹理所在文件夹）

------------character1.moc3（模型）

------------character1.physics3.json（物理配置）

------------character1.model3.json（模型主要配置文件）

------------character1.cdi3.json（模型参数ID文件，保证参数ID与cubismdefaultparameterid.ts中定义的一致，立绘不动可能是因为ID名不同导致的）

表情和动作文件位置不固定，在XXX.model3.json中配置好即可。

------

开始运行

```typescript
public run(): void
```

------

暂停

```typescript
public pause(): void
```

------

是否正在运行

```typescript
public isRunning(): boolean
```

------

设置立绘在canvas上的缩放大小和偏置

```typescript
public static setScaleAndOffset(scaleX: number, scaleY: number, offsetX: number, offsetY: number): void
```

------

执行Motion

```typescript
public static startMotion(group: string, index: number, priority: number, callback?:any ): void
```

group，index：组和索引，根据XXX.model3.json中配置好的传参，下例motion0.motion3.json，其group为motion0，索引为0

priority：优先级

callback：执行完毕的回调函数，类型为(motion: ACubismMotion) => void

model3.json中Motion配置：

```json
	"FileReferences": {
		"Motions": {
			"motion0": [
			  {"File":"motions/motion0.motion3.json" ,"FadeInTime":0.5, "FadeOutTime":0.5}
			],
			"motion1": [
			  {"File":"motions/motion1.motion3.json" ,"FadeInTime":0.5, "FadeOutTime":0.5}
			]
		}
	}
```

------

执行Expression

```typescript
public static startExpression(expression: string): void
```

expression：expression对应的Name

model3.json中Expression配置：

```json
	"FileReferences": {
		"Expressions": [
			{"Name":"f00","File":"expressions/F01.exp3.json"},
			{"Name":"f01","File":"expressions/F02.exp3.json"},
			{"Name":"f02","File":"expressions/F03.exp3.json"},
			{"Name":"f03","File":"expressions/F04.exp3.json"},
			{"Name":"f04","File":"expressions/F05.exp3.json"},
			{"Name":"f05","File":"expressions/F06.exp3.json"},
			{"Name":"f06","File":"expressions/F07.exp3.json"},
			{"Name":"f07","File":"expressions/F08.exp3.json"}
		]
	}
```

------

清理点击区域设定

```typescript
public static clearHitArea(): void
```

------

设定点击区域的消息事件

```typescript
public static setHitAreaAndCallback(name: string, callback: () => void): void
```

name：点击区域的名字

model3.json中HitAreas配置：

```
{
	"HitAreas": [
		{"Name":"Head", "Id":"HitArea"},
		{"Name":"Body", "Id":"HitArea2"}
	]
}
```

------

多个立绘切换

```typescript
public static getFigureIndex(): number
public static setFigureIndex(index: number): void
```

------

在TS编译打包中，将LAppDelegate挂到了window下，使JS能够直接调用：

```typescript
// 打包成JS，直接将LAppDelegate挂在window下
declare var window: any;
function loadLive2DModule(){
  window.Live2D = LAppDelegate;
  console.log('Load live2D module done. Interface: "window.Live2D"');
}
window.addEventListener("load", loadLive2DModule, false);
```

因此在JS中，使用window.Live2D代替LAppDelegate即可。

### Example

**Live2D资源的加载方式为异步，因此必须启HTTP Server来运行。**

```typescript
// 加载Live2D
RunLive2D(){
    // 从HTML获取Canvas实例
    this.live2DCanvas = document.getElementById("Live2DCanvas");
    // 资源路径
    let resource = {
        ResourcesPath: "/assets/Live2D/",
        BackImageName: null,
        GearImageName: null,
        ModelDir: ["character0", "character1"]
    };
    if(this.live2DCanvas){
        // 初始化
        if (LAppDelegate.getInstance().initialize(this.live2DCanvas, resource) == false) {
            return;
        }
        // 设置放大缩小和偏置
        LAppDelegate.setScaleAndOffset(3.2, 3.2, 0, -0.5);
        // 设置点击区域响应函数
        // 这东西是共用的，如果不同角色点击区域或相应函数不同，切角色前用LAppDelegate.clearHitArea()清掉，然后重新建立
        LAppDelegate.setHitAreaAndCallback("Head", ()=>{
            LAppDelegate.startMotion("motion0", 0, 2, null);   // 摸头，执行motion0
        });
        // 开始运行
        LAppDelegate.getInstance().run();
    }
}
```

JS同理，使用window.Live2D代替LAppDelegate即可。