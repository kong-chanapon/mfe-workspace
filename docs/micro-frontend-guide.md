# Micro-Frontend Guide (Angular Host + Angular/React/Vue Remotes)

เอกสารนี้สรุปภาพรวมและวิธีใช้งานโปรเจกต์นี้แบบ end-to-end รวมทั้งการสื่อสาร `input/output`, `webpack`, `window event`, runtime config และการรันทั้งแบบ local และ docker

## 1) โครงสร้างโปรเจกต์

- `angular-host/`:
  - Host หลัก (Angular + Native Federation)
  - มีหน้า demo สำหรับ Angular remote, React remote, Vue remote
- `angular-mfe/`:
  - Angular remotes 2 ตัว (`mfe1`, `mfe2`)
- `react-mfe/`:
  - React remotes 2 แบบในโปรเจกต์เดียว
  - แบบ props/callback (`reactRemote`)
  - แบบ window events (`reactWindowRemote`)
- `vue-mfe/`:
  - Vue remote (Vite + Federation)
- `docker-compose.yml`:
  - ใช้จำลอง deploy หลาย service พร้อมกัน

## 2) รูปแบบการสื่อสาร Host <-> Remote

## 2.1 Angular host <-> Angular remote (Native Federation)

- ฝั่ง host เรียก remote ด้วย `loadRemoteModule(...)` ผ่าน route/component
- remote Angular expose component ผ่าน `federation.config.js`
- เหมาะกับ Angular-to-Angular เพราะ integration ตรงที่สุด

## 2.2 Angular host <-> React remote (props/callback)

- Host โหลด `remoteEntry.js` แล้วเรียก `mount(container, { input, onOutput })`
- `input` = ข้อมูลจาก host ไป remote
- `onOutput` = callback จาก remote กลับ host
- ในโปรเจกต์นี้อยู่ที่หน้า `React Remote Tab`

ข้อดี:
- contract ชัดเจน
- scope ของ event ไม่ global

## 2.3 Angular host <-> React remote (window events)

- Host ส่งผ่าน `window.dispatchEvent(...)`
- Remote ฟังด้วย `window.addEventListener(...)`
- Remote ส่งกลับแบบ event เช่นกัน
- ในโปรเจกต์นี้อยู่ที่หน้า `React Window Event Tab`

ข้อดี:
- ข้าม framework ง่าย

ข้อควรระวัง:
- เป็น global channel ต้องตั้งชื่อ event ให้ชัด
- ต้อง cleanup listener ตอน unmount

## 2.4 Angular host <-> Vue remote

- Host dynamic import remote entry แล้วเรียก `mount(container, { input, onOutput })`
- เหมือน React props/callback pattern
- อยู่ที่หน้า `Vue Remote Tab`

## 3) Input / Output Contract ที่แนะนำ

ใช้ contract กลางแบบเดียวกันทุก remote จะ debug ง่าย:

```ts
// input from host
{
  type: string;
  payload: Record<string, unknown>;
}

// output from remote
{
  type: string;
  payload: unknown;
}
```

ตัวอย่างค่า:

- Input:
  - `type: "set-context"`
  - `payload: { message: "hello", tag: "demo" }`
- Output:
  - `type: "acknowledged"`
  - `payload: { source: "react-remote", ... }`

## 4) Environment/Config ที่ใช้แทนการ hardcode URL

## 4.1 Angular Host: runtime config

ไฟล์: `angular-host/public/environment.json`

```json
{
  "remotes": {
    "mfe1": "http://localhost:4201/remoteEntry.json",
    "mfe2": "http://localhost:4202/remoteEntry.json",
    "reactPropsEntry": "http://localhost:4300/remoteEntry.js",
    "reactPropsScope": "reactRemote",
    "reactWindowEntry": "http://localhost:4301/remoteEntry.js",
    "reactWindowScope": "reactWindowRemote",
    "vueEntry": "http://localhost:4302/assets/remoteEntry.js"
  }
}
```

พฤติกรรม:
- `main.ts` จะ fetch `/environment.json` ก่อน bootstrap
- ถ้าโหลดไม่ได้ จะ fallback ไปค่า default ในโค้ด
- แก้ไฟล์นี้ได้โดยไม่ต้องแก้ source code

## 4.2 React MFE: build/dev config

ไฟล์: `react-mfe/environment.json`

```json
{
  "props": {
    "publicPath": "http://localhost:4300/",
    "port": 4300,
    "scope": "reactRemote",
    "remoteEntryFilename": "remoteEntry.js"
  },
  "window": {
    "publicPath": "http://localhost:4301/",
    "port": 4301,
    "scope": "reactWindowRemote",
    "remoteEntryFilename": "remoteEntry.js"
  }
}
```

พฤติกรรม:
- webpack config จะอ่านไฟล์นี้ตอน `start/build`
- ถ้าแก้ค่า ต้อง start/build ใหม่

## 5) Webpack / Federation สรุป

- React ใช้ Module Federation ผ่าน `webpack.props.config.js` และ `webpack.window.config.js`
- แต่ละ remote มี `name/scope` ของตัวเอง
- export module `./mount` เพื่อให้ host เรียกแบบ programmatic ได้
- ตั้ง CORS ที่ dev server เป็น `Access-Control-Allow-Origin: *` เพื่อเรียกข้าม origin ระหว่าง host/remote

## 6) การรันโปรเจกต์ (Local)

รันจาก root `mfe-workspace`:

```bash
npm run start:all
```

หรือรันแยก:

```bash
npm run start:host
npm run start:mfe1
npm run start:mfe2
npm run start:react
npm run start:react-window
npm run start:vue
```

พอร์ตหลัก:

- Host: `4200`
- Angular MFE1: `4201`
- Angular MFE2: `4202`
- React Props Remote: `4300`
- React Window Remote: `4301`
- Vue Remote: `4302`

## 7) การรันด้วย Docker (simulate deployment)

build + up:

```bash
npm run docker:up
```

build อย่างเดียว:

```bash
npm run docker:build
```

down:

```bash
npm run docker:down
```

หมายเหตุ:
- ใน container ทุก service serve ด้วย Nginx
- compose map port ให้เท่ากับ local dev convention (`4200/4201/4202/4300/4301/4302`)

## 8) Troubleshooting ที่เจอบ่อย

- หน้า host เปิดแล้ว remote ไม่ขึ้น:
  - เช็กว่า remote service/pod ต้นทางขึ้นครบ
  - เช็ก URL ใน `environment.json`
  - เปิด DevTools ดูว่าโหลด `remoteEntry` สำเร็จไหม
- React/Vue remote โหลดได้แต่ UI ไม่อัปเดต host:
  - เช็ก contract `onOutput`/event name ตรงกัน
  - เช็ก cleanup listener ซ้ำซ้อน
- เปลี่ยน config แล้วเหมือนไม่มีผล:
  - Angular host: hard refresh (เพราะ browser cache)
  - React webpack env: restart dev/build

## 9) แนวทางต่อยอด production

- แยก `environment.json` ตาม env (dev/staging/prod)
- ใช้ reverse proxy/domain จริงแทน localhost
- เพิ่ม health checks และ observability (logs/metrics)
- ใส่ versioning ให้ remote contracts (`type`, schema)
