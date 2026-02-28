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
- `react-mfe/`: React remotes 2 แบบ
- `vue-mfe/`: Vue remote (Vite federation)

Topology พอร์ต (local/dev):
- Host: `http://localhost:4200`
- Angular MFE1: `http://localhost:4201`
- Angular MFE2: `http://localhost:4202`
- React props remote: `http://localhost:4300`
- React window-event remote: `http://localhost:4301`
- Vue remote: `http://localhost:4302`

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

## 5.4 แล้วใช้ `[input] (output)` แบบ Angular ได้ไหม

ได้ “เฉพาะ” ภายใน wrapper Angular component ของ host

ความหมายคือ:
- `<app-mfe2-io-demo [input]="..." (output)="...">` เป็น contract ระหว่าง `app-root` กับ wrapper
- wrapper แปลงเป็น bridge ไป remote จริงอีกชั้น (`mount/update/onOutput`)

สรุป: Angular syntax ใช้ได้ แต่ไม่ได้ทะลุข้าม framework โดยตรง ต้องมี adapter/wrapper เสมอ

## 6) Webpack / Module Federation / Vite Federation

## 6.1 React (Webpack Module Federation)

ฝั่ง React ใช้ 2 config:
- `webpack.props.config.js` (scope `reactRemote`)
- `webpack.window.config.js` (scope `reactWindowRemote`)

ค่าเช่น `publicPath`, `port`, `scope`, `remoteEntryFilename` ถูกอ่านจาก `react-mfe/environment.json`

## 6.2 Angular (Native Federation)

Angular remotes expose ผ่าน `federation.config.js` และ host initialize remotes ใน `main.ts` ก่อน bootstrap

## 6.3 Vue (Vite + Federation plugin)

Vue remote ใช้ `@originjs/vite-plugin-federation` แล้ว expose `./mount`

## 6.4 เรื่อง `init()` และ `get()`

container มาตรฐานมักมี:
- `init(sharedScope)` สำหรับ setup shared libs
- `get('./mount')` เพื่อเอา factory ของ module

host จึงต้อง handle กรณี re-init และรูปแบบ export ที่ต่างกัน (default/function/object)

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
npm run start:vue
```

## 8.2 Build

```bash
npm run build:host
npm run build:mfe1
npm run build:mfe2
npm run build:react
npm run build:react-window
npm run build:vue
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

## 14) สรุปการเลือก pattern

- ถ้า Angular-to-Angular: ใช้ Native Federation + route/component loading
- ถ้าข้าม frameworkและต้องการ contract ชัด: ใช้ `mount(input,onOutput)`
- ถ้าต้องการ broadcast หลาย consumer: ใช้ window events (พร้อม governance)

แนวทางที่แนะนำสำหรับระบบ production:
- ใช้ `mount` เป็น default
- ใช้ window events เฉพาะ event ที่เป็น global จริง
- เก็บ URL/config ใน runtime config ให้แก้ได้โดยไม่ rebuild
