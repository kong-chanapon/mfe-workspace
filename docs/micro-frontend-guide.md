# Micro-Frontend Guide (Angular Host + Angular/React/Vue Remotes)

เอกสารนี้สรุปทั้งแนวคิดและ implementation ของโปรเจกต์นี้ ตั้งแต่ที่มา, สถาปัตยกรรม, การสื่อสารระหว่าง host/remote, เหตุผลที่แต่ละ framework setup ต่างกัน, ไปจนถึงวิธีรัน local/docker

## 1) ที่มาและเป้าหมายของ Micro-Frontend

Micro-Frontend เกิดจากแนวคิดเดียวกับ Microservice: แยกระบบใหญ่ให้ deploy ได้เป็นส่วนย่อยที่มีขอบเขตชัดเจน

เป้าหมายหลัก:
- ลด coupling ระหว่างทีม
- deploy แยกกันได้
- เลือกเทคโนโลยีได้เหมาะกับแต่ละโดเมน
- ลด blast radius เวลามี bug

เหตุผลที่โปรเจกต์นี้ทำแบบหลาย framework (Angular + React + Vue):
- จำลองสถานการณ์ migration จริง
- ทดลอง contract กลางสำหรับ input/output
- เปรียบเทียบวิธีเชื่อมต่อระหว่าง framework ที่ต่างกัน

## 2) ภาพรวมสถาปัตยกรรมของโปรเจกต์นี้

โครงสร้าง:
- `angular-host/`: Shell/Host หลัก
- `angular-mfe/`: Angular remotes (`mfe1`, `mfe2`)
- `react-mfe/`: React remotes 3 แบบ (`props`, `window-event`, `window-event-collision`)
- `vue-mfe/`: Vue remotes 2 แบบ (`props/callback`, `window-event`)

Topology พอร์ต (local/dev):
- Host: `http://localhost:4200`
- Angular MFE1: `http://localhost:4201`
- Angular MFE2: `http://localhost:4202`
- React props remote: `http://localhost:4300`
- React window-event remote: `http://localhost:4301`
- Vue remote (props/callback): `http://localhost:4302`
- React window-event collision remote: `http://localhost:4303`
- Vue window-event remote: `http://localhost:4304`

## 3) คำศัพท์สำคัญ

- Host/Shell: แอปแม่ที่ประกอบหลาย remote เข้าด้วยกัน
- Remote: แอปย่อยที่ expose module/component ให้ host โหลด
- Federation Container: object ที่มี `init()` และ `get()`
- `remoteEntry`: entrypoint ของ remote สำหรับ host ใช้ค้น module ที่ expose
- Contract: รูปแบบข้อมูลที่ตกลงกันระหว่าง host กับ remote

## 4) ทำไม setup การโหลด component ของแต่ละตัวไม่เหมือนกัน

## 4.1 Angular host -> Angular remote

ใช้ Native Federation + Angular ecosystem เดียวกัน จึงโหลด module ได้ตรงด้วย `loadRemoteModule(...)`

ข้อดี:
- route/component integration ตรง framework
- lifecycle/DI/zone อยู่ในโลก Angular เดียวกัน

## 4.2 Angular host -> React/Vue remote

Angular ไม่รู้จัก React/Vue component โดยตรง จึงต้องใช้วิธี “imperative mount”:
- Host โหลด `remoteEntry.js`
- ขอ `./mount` จาก container
- เรียก `mount(containerEl, { input, onOutput })`
- เก็บตัวคืน (`update`, `unmount`) เพื่อควบคุม lifecycle

ข้อดี:
- framework-agnostic
- contract ชัด

ต้นทุน:
- ต้องเขียน bridge เอง (mount/update/unmount)
- ต้องจัดการ change detection/zone เอง (ฝั่ง Angular)

## 4.3 บทบาทของ `NgZone.run(...)`

เมื่อ callback มาจากโลกนอก Angular (เช่น React/Vue callback หรือ DOM event ตรงๆ) Angular อาจไม่ trigger change detection อัตโนมัติ

จึงใช้ `NgZone.run(...)` เพื่อให้ state update แล้ว UI Angular refresh แน่นอน

## 5) รูปแบบการสื่อสาร Input/Output

## 5.1 Contract กลางที่ใช้ในโปรเจกต์

```ts
// Host -> Remote
{
  type: string;
  payload: Record<string, unknown>;
}

// Remote -> Host
{
  type: string;
  payload: unknown;
}
```

เหตุผลที่ใช้แบบนี้:
- ขยาย event type ได้โดยไม่ต้องเพิ่ม props/event ใหม่ทุกครั้ง
- debug/logging ง่าย
- ใช้ schema validation ภายหลังได้

## 5.2 Pattern A: props/callback (`mount` API)

ตัวอย่าง flow:
1. Host ส่ง `input` ตอน mount
2. Host เปลี่ยน state -> เรียก `update({ input })`
3. Remote ส่งผลกลับผ่าน `onOutput(event)`

เหมาะกับ:
- ช่องทางสื่อสารแบบ point-to-point
- ต้องการความชัดของ ownership

## 5.3 Pattern B: `window.dispatchEvent` / `window.addEventListener`

ตัวอย่าง flow:
1. Host `dispatchEvent('mfe:host-to-react-window', detail)`
2. Remote ฟัง event นี้และอัปเดตตัวเอง
3. Remote ส่งกลับด้วยอีก event เช่น `mfe:react-window-to-host`

เหมาะกับ:
- เชื่อมหลายแอปโดยไม่ผูกกับ mount signature มาก

ข้อควรระวัง:
- global scope ชนชื่อ event ง่าย
- ต้อง remove listener ตอน unmount
- trace ยากขึ้นเมื่อระบบใหญ่

## 5.3.1 วิธีเรียกให้เกิด “window event ชนกัน” (Collision Demo)

ในโปรเจกต์นี้มี demo จริงที่ชนกัน โดย mount React remotes 2 ตัวและใช้ event name เดียวกัน:
- host -> remote: `mfe:host-to-react-window`
- remote -> host: `mfe:react-window-to-host`

เมื่อทั้งสอง remote ฟังชื่อเดียวกัน:
- ทุกครั้งที่ host `dispatchEvent` จะมี remote มากกว่า 1 ตัวรับพร้อมกัน
- output ที่ host ได้จะไหลกลับ channel เดียวกันและปะปนกัน

ตัวอย่างการส่ง event จาก host:

```ts
window.dispatchEvent(
  new CustomEvent('mfe:host-to-react-window', {
    detail: { type: 'set-context', payload: { message: 'hello', tag: 'collision' } },
  }),
);
```

ตัวอย่างรับ event ฝั่ง remote:

```ts
window.addEventListener('mfe:host-to-react-window', (event) => {
  const custom = event as CustomEvent;
  const input = custom.detail;
  // ทั้ง remote A และ remote B จะเข้าบล็อกนี้พร้อมกัน
});
```

วิธีลองในโปรเจกต์:
1. รัน `npm run start:react-window`
2. รัน `npm run start:react-window-collision`
3. รัน `npm run start:host`
4. เข้าแท็บ `React Window Collision` แล้วกด emit จากทั้งสอง remote
5. ดู output log ใน host จะเห็น event จากหลาย source ปะปนใน channel เดียว

แนวทางแก้ collision:
- ตั้งชื่อ event ให้เฉพาะโดเมน/remote เช่น `mfe:cart:host-to-react` หรือ `mfe:profile:react-to-host`
- ส่ง `source`/`target` ใน payload แล้วกรองก่อน handle
- ใช้ `mount(input,onOutput)` เป็น default และใช้ window event เฉพาะ event ที่เป็น global จริง

## 5.4 แล้วใช้ `[input] (output)` แบบ Angular ได้ไหม

ได้ “เฉพาะ” ภายใน wrapper Angular component ของ host

ความหมายคือ:
- `<app-host-mfe2-io-demo [input]="..." (output)="...">` เป็น contract ระหว่าง `app-root` กับ wrapper
- wrapper แปลงเป็น bridge ไป remote จริงอีกชั้น (`mount/update/onOutput`)

สรุป: Angular syntax ใช้ได้ แต่ไม่ได้ทะลุข้าม framework โดยตรง ต้องมี adapter/wrapper เสมอ

## 6) Webpack / Module Federation / Vite Federation

## 6.1 React (Webpack Module Federation)

ฝั่ง React ใช้หลาย config ตาม remote mode:
- `webpack.props.config.js` (scope `reactRemote`)
- `webpack.window.config.js` (scope `reactWindowRemote`)
- `webpack.window.collision.config.js` (scope `reactWindowCollisionRemote`)

ค่าเช่น `publicPath`, `port`, `scope`, `remoteEntryFilename` ถูกอ่านจาก `react-mfe/environment.json`

## 6.2 Angular (Native Federation)

Angular remotes expose ผ่าน `federation.config.js` และ host initialize remotes ใน `main.ts` ก่อน bootstrap

## 6.3 Vue (Vite + Federation plugin)

Vue remote ใช้ `@originjs/vite-plugin-federation` แล้ว expose `./mount`

config หลัก:
- `vite.config.ts` สำหรับ props/callback remote
- `vite.window.config.ts` สำหรับ window-event remote

หมายเหตุเชิง ecosystem:
- ปัจจุบันโปรเจกต์ Vue ส่วนใหญ่เริ่มจาก Vite เป็นค่าเริ่มต้น
- เหตุผลหลักคือ dev server/HMR เร็ว, config เบา, และ tooling ของ Vue 3 รองรับดี
- อย่างไรก็ตาม หากมีข้อกำหนดองค์กรหรือ plugin เฉพาะทาง ก็ยังสามารถเลือก webpack ได้

## 6.4 เรื่อง `init()` และ `get()`

container มาตรฐานมักมี:
- `init(sharedScope)` สำหรับ setup shared libs
- `get('./mount')` เพื่อเอา factory ของ module

host จึงต้อง handle กรณี re-init และรูปแบบ export ที่ต่างกัน (default/function/object)

## 6.5 Webpack build “ทำอะไร” และ “ไม่ได้ทำอะไร”

สิ่งที่มักเข้าใจผิดคือ: พอ build ด้วย Webpack/Module Federation แล้ว ระบบจะสร้าง API กลางอย่าง `mount/update` ให้อัตโนมัติ

ความจริง:
- Webpack ทำหน้าที่ bundle และ expose module ตามที่ประกาศใน `exposes`
- host จะได้ “module export” ตามที่ remote เขียนไว้จริงๆ
- ถ้า remote export ฟังก์ชัน `mount` host ก็เรียก `mount(...)` ได้
- ถ้า remote export object ที่มี `render/update` host ก็ต้องเรียก `render/update` ให้ตรงชื่อ

สรุป: ชื่อ method เป็นเรื่องของ “contract ระหว่างทีม” ไม่ใช่ข้อบังคับของ Webpack

## 6.6 ทำไม host ถึงเรียก `.mount` / `.update` ได้

เพราะ host กับ remote ตกลง interface กันเอง เช่น:

```ts
type MountOptions = { input?: RemoteInput; onOutput?: (event: RemoteOutput) => void };
type MountedRemote = { update?: (next: MountOptions) => void; unmount: () => void };
type RemoteModule = { mount: (container: HTMLElement, options?: MountOptions) => MountedRemote };
```

flow ที่เกิดขึ้นจริง:
1. Host โหลด `./mount` จาก container (`container.get('./mount')`)
2. Host ได้ factory/module ตาม export ของ remote
3. Host เรียก `mount(container, options)` เพื่อ render remote
4. Host เก็บค่าที่คืนมา (`mountedRemote`) และใช้ `mountedRemote.update(...)` เมื่อ input เปลี่ยน
5. ตอน destroy เรียก `mountedRemote.unmount()`

ดังนั้นคำว่า “มันรู้ได้ไงว่าต้องเรียก `mount/update`” คำตอบคือ:
- มันรู้จาก type + code ที่เราเขียนใน host
- และจะทำงานได้ก็ต่อเมื่อ remote export ตามสัญญาเดียวกัน

## 6.7 React MFE Loading Flow (Deep Dive)

หัวข้อนี้อธิบายลำดับจริงของ Angular host -> React remote (แบบไม่ใช้ window event)

### 6.7.1 Phase A: Remote build/expose (ฝั่ง React)

ไฟล์ `react-mfe/webpack.props.config.js` กำหนดว่า remote จะ expose อะไร:
- `name: env.props.scope` (เช่น `reactRemote`)
- `filename: env.props.remoteEntryFilename` (เช่น `remoteEntry.js`)
- `exposes: { './mount': './src/mount.jsx' }`

ผลลัพธ์คือ host จะสามารถเรียก module key `./mount` ได้จาก container ตัวนี้

ใน `react-mfe/src/mount.jsx`:
- export ฟังก์ชัน `mount(container, options)`
- `mount` สร้าง React root และ render `RemoteApp`
- `mount` คืน object `{ update, unmount }`

นั่นคือ contract หลักที่ host ต้องรู้ล่วงหน้า

### 6.7.2 Phase B: Host bootstrap + runtime config

ไฟล์ `angular-host/src/main.ts`:
1. โหลด `/environment.json`
2. normalize config
3. เก็บไว้ใน `window.__APP_CONFIG__`
4. bootstrap Angular app

ไฟล์ `angular-host/src/app/core/runtime-config.ts`:
- ระบุ `reactPropsEntry` (URL ของ remoteEntry)
- ระบุ `reactPropsScope` (ชื่อ scope/container บน `window`)

### 6.7.3 Phase C: Mount time (ฝั่ง Angular component)

ไฟล์ `angular-host/src/app/features/react/react-remote-tab.component.ts` ลำดับคือ:

1. `ngAfterViewInit()` เรียก `mountRemote()`
2. `mountRemote()` เรียก `loadRemoteContainer()`
3. `loadRemoteContainer()` เรียก `injectRemoteEntryScript(entryUrl, scope)`
4. `injectRemoteEntryScript(...)` ทำ 3 กรณี:
   - มี script และ `window[scope]` พร้อม -> ใช้ได้ทันที
   - มี script แต่ container ยังไม่พร้อม -> รอ `load/error` ของ script เดิม
   - ไม่มี script -> สร้าง `<script src="remoteEntry.js">` แล้ว inject เข้า `<head>`
5. เมื่อ script โหลดสำเร็จ จะได้ container จาก `window[scope]`
6. ถ้า container มี `init` จะเรียก `container.init({})`
7. ขอ module ด้วย `container.get('./mount')`
8. ได้ factory แล้วเรียก `factory()` เพื่อได้ `remoteModule`
9. เรียก `remoteModule.mount(hostElement, { input, onOutput })`
10. เก็บค่าที่คืนมาไว้ใน `this.mountedRemote`

### 6.7.4 Phase D: Update input และรับ output

Input flow:
- เมื่อ host เปลี่ยน state (`onMessageChange`, `onTagChange`, `setInputType`)
- จะเรียก `pushInputToRemote()`
- และสุดท้ายไป `this.mountedRemote?.update({ input: this.remoteInput })`

Output flow:
- React remote ส่ง event กลับผ่าน callback `onOutput`
- callback นี้ทำงานนอกโลก Angular โดยธรรมชาติ
- จึงใช้ `NgZone.run(...)` ก่อนอัปเดต state/emit output เพื่อให้ Angular change detection ทำงานแน่นอน

### 6.7.5 Phase E: Destroy/cleanup

ตอน component ถูกทำลาย (`ngOnDestroy`) host เรียก:
- `this.mountedRemote?.unmount()`

เพื่อให้ React root ถูก unmount และไม่ทิ้ง memory/listener ค้าง

### 6.7.6 จุดที่พังบ่อย (และอาการ)

- `reactPropsEntry` ผิด -> script โหลดไม่เข้า (`Failed to load ...`)
- `reactPropsScope` ไม่ตรงกับ remote `name` -> `container not found on window`
- key `./mount` ไม่ตรงใน `exposes` -> `container.get('./mount')` พัง
- remote ไม่คืน `{ update/unmount }` ตาม contract -> ตอน host เรียก update/unmount จะ error
- callback ออกนอก zone แล้วไม่ `NgZone.run` -> ค่าเปลี่ยนแต่ UI Angular ไม่ refresh

## 6.8 Window Event Mode: โหลดเหมือนกันไหม

คำตอบ: เหมือนกันเกือบทั้งหมดในส่วน loading federation แต่ต่างกันที่ contract การสื่อสาร

### 6.8.1 สิ่งที่เหมือนกับ props/callback mode

ทั้งสอง mode ยังต้องผ่านขั้นตอนเดิม:
1. โหลด `remoteEntry.js`
2. อ่าน container จาก `window[scope]`
3. เรียก `container.init(...)` (ถ้ามี)
4. เรียก `container.get('./mount')`
5. เรียก `mount(...)`
6. ตอน destroy เรียก `unmount()`

สรุป: window-event mode ไม่ได้ข้ามขั้นตอน federation loading

### 6.8.2 สิ่งที่ไม่ต้องตั้ง และสิ่งที่ต้องตั้งเพิ่ม

สิ่งที่มักไม่ต้องตั้งใน window-event mode:
- ไม่จำเป็นต้องส่ง `onOutput` callback เข้า `mount(...)`
- ไม่จำเป็นต้องพึ่ง `update(...)` เสมอ (ใช้ event ส่ง input แทนได้)

สิ่งที่ต้องตั้งเพิ่มแทน:
- กำหนดชื่อ event 2 ทางให้ชัด (`host -> remote`, `remote -> host`)
- ผูก `addEventListener` ตอน mount/init
- ทำ `removeEventListener` ตอน unmount/destroy
- วางกติกา namespace/source-filter เพื่อลด event collision

### 6.8.3 Mapping กับโค้ดในโปรเจกต์นี้

- Props/callback:
  - Host: `angular-host/src/app/features/react/react-remote-tab.component.ts`
  - Contract หลัก: `mount(..., { input, onOutput })` + `mountedRemote.update({ input })`
- Window event:
  - Host: `angular-host/src/app/features/react/react-window-tab.component.ts`
  - Contract หลัก: `window.dispatchEvent(...)` + `window.addEventListener(...)`
  - `update(...)` ยังมีได้ แต่ใช้เพื่อกระตุ้น dispatch ต่อให้ remote

## 6.9 Vue MFE Loading Flow (Deep Dive)

หัวข้อนี้อธิบายลำดับการโหลด Vue remote ของโปรเจกต์นี้ (ทั้ง props/callback และ window-event)

### 6.9.1 Phase A: Remote build/expose (ฝั่ง Vue + Vite Federation)

ไฟล์ `vue-mfe/vite.config.ts` (props mode):
- `name: 'vueRemote'`
- `filename: 'remoteEntry.js'`
- `exposes: { './mount': './src/mount.ts' }`

ไฟล์ `vue-mfe/vite.window.config.ts` (window-event mode):
- `name: 'vueWindowRemote'`
- `filename: 'remoteEntry.js'`
- `exposes: { './mount': './src/mountWindow.ts' }`

ทั้งสองแบบ expose `./mount` เหมือนกัน ต่างกันที่ implementation ภายใน `mount.ts` กับ `mountWindow.ts`

### 6.9.2 Phase B: Host runtime config

ไฟล์ `angular-host/src/app/core/runtime-config.ts` ระบุ:
- `vueEntry` สำหรับ props/callback remote
- `vueWindowEntry` สำหรับ window-event remote

Host จะดึงค่าจาก `angular-host/public/environment.json` ตอน startup (ใน `main.ts`) ทำให้สลับ URL runtime ได้โดยไม่ rebuild host

### 6.9.3 Phase C: Mount time (ฝั่ง Angular host component)

Props/callback host: `vue-remote-tab.component.ts`  
Window-event host: `vue-window-tab.component.ts`

ลำดับหลักเหมือนกัน:
1. `ngAfterViewInit()` เรียก `mountRemote()`
2. `mountRemote()` เรียก `loadRemoteContainer()`
3. `loadRemoteContainer()` ทำ dynamic import ของ remoteEntry URL:
   - `const dynamicImport = new Function('u', 'return import(u)')`
   - `const entryModule = await dynamicImport(config.remotes.vueEntry)` หรือ `await dynamicImport(config.remotes.vueWindowEntry)` ตาม component ที่ใช้งาน
4. resolve container จาก `entryModule.default ?? entryModule`
5. ถ้ามี `init` ให้เรียก `container.init({})`
6. `container.get('./mount')` เพื่อเอา factory
7. `factory()` แล้ว resolve รูปแบบ module
8. ใช้ `resolveMountFunction(...)` เพื่อ normalize ให้เหลือฟังก์ชัน `mount`
9. เรียก `mount(hostElement, options)` และเก็บ `mountedRemote`

### 6.9.4 ทำไม Vue ใช้ dynamic import แต่ React ใช้ script inject

ในโปรเจกต์นี้:
- React ใช้การ inject `<script src="remoteEntry.js">` แล้วอ่าน container จาก `window[scope]`
- Vue (Vite federation) ใช้วิธี import remoteEntry แบบ ESM ตรงๆ แล้วได้ module object กลับมา

ดังนั้นโค้ด Vue จะไม่มี `injectRemoteEntryScript(...)` แบบ React แต่ยังต้องผ่าน logic `init/get('./mount')` เหมือนกัน

### 6.9.5 Phase D: Input/Output contract

Props/callback mode (`mount.ts`):
- รับ `input` + `onOutput` ใน options
- `update({ input, onOutput })` ใช้อัปเดต state/callback
- emit กลับ host ผ่าน callback `onOutput(event)`

Window-event mode (`mountWindow.ts`):
- remote ฟัง `mfe:host-to-vue-window`
- remote ส่งกลับ `mfe:vue-window-to-host`
- `update({ input })` ใน remote ถูกใช้เป็นตัวช่วย dispatch event เข้าช่องทางเดิม

ฝั่ง host:
- ต้อง `NgZone.run(...)` ตอนรับ output เพื่อให้ Angular refresh UI
- ต้อง `removeEventListener(...)` ตอน destroy ใน window-event mode

### 6.9.6 จุดที่พังบ่อย (Vue)

- `vueEntry`/`vueWindowEntry` URL ผิด -> import remoteEntry ไม่สำเร็จ
- container ที่ import มาไม่ใช่รูปแบบคาดหวัง -> `Invalid vue federation container`
- key `./mount` ไม่ตรงกับ expose -> `container.get('./mount')` ล้มเหลว
- export shape ต่างกัน (function/object/default) -> ต้อง normalize ด้วย `resolveMountFunction`
- ลืม cleanup listener ใน window-event mode -> event ซ้ำ/memory leak

## 7) Runtime Config (`environment.json`) และเหตุผลที่ใช้

## 7.1 Angular Host (runtime)

ไฟล์: `angular-host/public/environment.json`

- โหลดตอน runtime ผ่าน HTTP (`/environment.json`)
- ไม่ต้อง rebuild ถ้าแค่เปลี่ยน URL remote
- เหมาะกับ deployment จริงที่แต่ละ environment ใช้ endpoint ต่างกัน

## 7.2 React Webpack (build/start time)

ไฟล์: `react-mfe/environment.json`

- webpack config อ่านตอน start/build
- ถ้าแก้ค่า ต้อง restart/build ใหม่
- เหมาะกับการจัดค่าที่ผูกกับ bundler เช่น `publicPath`, `scope`, `port`

## 8) วิธีรันโปรเจกต์

## 8.1 Local dev

จาก root `mfe-workspace`:

```bash
npm run start:all
```

หรือแยก service:

```bash
npm run start:host
npm run start:mfe1
npm run start:mfe2
npm run start:react
npm run start:react-window
npm run start:react-window-collision
npm run start:vue
npm run start:vue-window
```

## 8.2 Build

```bash
npm run build:host
npm run build:mfe1
npm run build:mfe2
npm run build:react
npm run build:react-window
npm run build:react-window-collision
npm run build:vue
npm run build:vue-window
```

## 8.3 Docker (simulate deployment)

```bash
npm run docker:build
npm run docker:up
npm run docker:down
```

รายละเอียด:
- ทุก service serve static ด้วย Nginx
- มี CORS header เปิดไว้สำหรับ cross-origin remote loading
- `docker-compose.yml` map พอร์ตให้ตรงกับ dev convention

## 9) ทำไมต้องมี setup ที่เยอะขึ้นเมื่อข้าม framework

Angular -> Angular:
- framework runtime ใกล้กัน
- load component ได้ตรงกว่า

Angular -> React/Vue:
- ต้อง bridge lifecycle เอง (`mount/update/unmount`)
- ต้องแปลงสัญญาณ event/state ข้ามโลก framework
- ต้องระวัง change detection และ cleanup มากกว่า

นี่คือเหตุผลหลักว่าทำไมโค้ด `loadRemoteContainer` ของ React/Vue ดูยาวกว่า Angular-to-Angular

## 10) แนวทางออกแบบสัญญา (contract) สำหรับทีม

แนะนำให้กำหนดมาตรฐานกลาง:
- ชื่อ `type` แบบ namespace เช่น `cart.item-added`, `auth.token-expired`
- version ของ payload เช่น `meta.version`
- schema validation (zod/io-ts/json-schema)
- มีเอกสาร event catalog กลาง

## 11) Security และความเสี่ยงที่ควรรู้

- Remote script คือ code execution จาก origin อื่น ต้องเชื่อถือแหล่งที่มา
- ควรบังคับ allowlist ของ remote URL
- กำหนด CSP ให้เหมาะสม
- แยกสิทธิ์และข้อมูลสำคัญไม่ให้ remote เข้าถึงเกินจำเป็น

## 12) Troubleshooting

- Host ขึ้นแต่ remote ไม่แสดง:
  - ตรวจว่า remote URL ใน `environment.json` ถูกต้อง
  - เปิด network ดู `remoteEntry`/chunk โหลดสำเร็จไหม
- Remote แสดงแต่ output ไม่กลับ host:
  - ตรวจ event name/contract และ scope
  - ตรวจว่า callback เข้า `NgZone.run(...)` แล้วหรือยัง
- React/Vue เปลี่ยน env แล้วไม่เปลี่ยน:
  - restart dev server หรือ build ใหม่

## 13) Checklist ตอนเพิ่ม remote ใหม่

1. กำหนด scope/name/entry URL ของ remote
2. expose `./mount` และรองรับ `update/unmount`
3. เพิ่มค่าใน `angular-host/public/environment.json`
4. สร้าง tab/route ใน host สำหรับ mount
5. นิยาม input/output contract ให้ชัด
6. ทดสอบทั้ง local และ docker
7. เพิ่ม docs ของ event/contract

## 13.1 ชื่อ selector ที่แนะนำใน Host

แนวทางในโปรเจกต์นี้:
- ใช้ prefix `app-mfe-*` กับ component ที่ “คุยกับ remote โดยตรง” (เช่นมี `loadRemoteModule` หรือ `loadRemoteContainer`)
- ใช้ prefix `app-host-*` กับ component ที่เป็น local wrapper/presenter ใน host

ข้อดี:
- อ่านโค้ดแล้วรู้ทันทีว่าตัวไหนเป็น bridge ข้ามแอป
- ลดความสับสนเรื่อง ownership และจุดที่ต้องดูเวลา debug federation

## 14) สรุปการเลือก pattern

- ถ้า Angular-to-Angular: ใช้ Native Federation + route/component loading
- ถ้าข้าม frameworkและต้องการ contract ชัด: ใช้ `mount(input,onOutput)`
- ถ้าต้องการ broadcast หลาย consumer: ใช้ window events (พร้อม governance)

แนวทางที่แนะนำสำหรับระบบ production:
- ใช้ `mount` เป็น default
- ใช้ window events เฉพาะ event ที่เป็น global จริง
- เก็บ URL/config ใน runtime config ให้แก้ได้โดยไม่ rebuild
