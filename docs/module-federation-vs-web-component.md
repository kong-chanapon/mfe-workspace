# Module Federation vs Web Component (เชิงลึก)

เอกสารนี้อธิบายความต่างของ 2 แนวทางที่ใช้ในโปรเจกต์นี้:

- Module Federation
- Web Component Runtime

พร้อมตัวอย่างจากโค้ดจริงใน repo เพื่อให้เห็นภาพว่าแต่ละแบบเหมาะกับกรณีไหน

## 1) ภาพรวมสั้น

Module Federation คือการแชร์และโหลด "module" ข้ามแอปผ่าน remote entry (ระดับ bundler/runtime)

Web Component คือการแชร์ UI เป็น "custom element" (ระดับ DOM standard)

ทั้งสองแบบ deploy แยกกันได้ แต่จุดต่างหลักไม่ใช่แค่เรื่องแชร์ dependency

## 2) ต่างกันที่ชั้นไหนของระบบ

### 2.1 Module Federation

ทำงานที่ระดับ JavaScript module

- host โหลด `remoteEntry` ก่อน
- host เรียก container (`window[scope]`)
- host ขอ module ที่ expose เช่น `./mount` หรือ `./Component`
- host เรียก API ที่ remote export ออกมา

ผลคือ integration ลึกกว่า เพราะคุยกันเป็นโค้ดระดับ module

### 2.2 Web Component

ทำงานที่ระดับ DOM/Browser standard

- remote ลงทะเบียน `customElements.define('my-tag', Class)`
- host ใช้ `<my-tag>` เหมือนใช้ element ปกติ
- ส่งข้อมูลด้วย property/attribute
- รับ event ด้วย `CustomEvent`

ผลคือ framework-agnostic สูงกว่า

## 3) สัญญาการสื่อสาร (Contract)

### 3.1 Module Federation contract

สัญญา = shape ของ module ที่ export

ตัวอย่างใน repo นี้ (React MF):

- remote expose: `./mount`
- host คาดหวังว่า module มี `mount(container, options)`
- `mount` คืน object ที่มี `update()` และ `unmount()`

ฝั่ง host ดูได้ที่:

- `angular-host/src/app/features/react/react-remote-tab.component.ts`

ฝั่ง remote ดูได้ที่:

- `react-mfe/src/mount.jsx`

### 3.2 Web Component contract

สัญญา = tag name + property/event ที่ตกลงกัน

ตัวอย่าง:

- tag: `ma-demo-web-remote`
- input: property `input`
- output: `CustomEvent('remoteOutput', { detail })`

host จะ bind `[input]` และ `(remoteOutput)` ได้เมื่อ Angular อนุญาต custom element schema

## 4) รูปแบบที่มีในโปรเจกต์นี้

### 4.1 Module Federation tabs

- MFE1, MFE2
- Selector I/O
- React Props
- React Window
- React Window Collision
- Vue
- Vue Window

### 4.2 Web Component tabs

- Web Component (manual script inject)
- Web Component (axLazyElement)
- React (axLazyElement)

หมายเหตุ: `React (axLazyElement)` คือ React remote ที่ถูกห่อเป็น custom element ก่อน แล้ว host โหลดผ่าน `*axLazyElement`

## 5) axLazyElement คืออะไร

`*axLazyElement` ไม่ใช่ Module Federation

มันเป็น Angular directive ที่ช่วย:

- โหลด script ของ custom element แบบ lazy
- แสดง loading/error template
- รอจน element พร้อมก่อน render

ดังนั้น axLazyElement อยู่ฝั่ง "Web Component runtime" เสมอ

## 6) การส่ง input/output

### 6.1 Module Federation

- Input: host ส่งผ่าน `mount(..., { input })` และ `update({ input })`
- Output: remote callback เช่น `onOutput(event)`

ข้อดีคือ type contract ฝั่ง TS คุมได้ดี

### 6.2 Web Component

- Input: host set property เช่น `element.input = {...}` หรือ `[input]="..."`
- Output: remote dispatch `CustomEvent`

ข้อดีคือข้าม framework ง่าย แต่ต้องระวังชื่อ event/property ให้ตรงสัญญา

## 7) Performance: มองอย่างไร

### 7.1 Module Federation มักชนะเมื่อ

- ต้องแชร์ dependency/runtime หนัก ๆ
- มีหลาย remote ใช้ framework เดียวกัน

เพราะลด duplicate JS ได้

### 7.2 Web Component มักชนะเมื่อ

- ต้องการ isolation สูง
- ต้องการข้าม framework โดย integration เบา
- ทีม/วงจร deploy ต่างกันมาก

แต่ถ้าแต่ละ remote bundle framework ของตัวเองซ้ำเยอะ อาจแพ้ในแง่ JS total

## 8) Security และ Governance

ทั้งสองแบบคือการรันโค้ดจากคนละ deploy unit ใน browser เดียวกัน

ต้องคุม:

- แหล่งที่มาของ script/remote entry
- versioning policy
- backward compatibility ของ contract
- rollout strategy และ fallback

## 9) Debug/Operate ใน production

### 9.1 Module Federation

จุดที่ต้องเช็กบ่อย:

- remote entry URL ถูกไหม
- scope/module name ตรงไหม
- shared dependency version conflict

### 9.2 Web Component

จุดที่ต้องเช็กบ่อย:

- script โหลดสำเร็จไหม
- `customElements.define` รันแล้วหรือยัง
- event/property name ตรง contract ไหม

## 10) เลือกใช้อย่างไร (Decision Guide)

เลือก Module Federation ถ้า:

- ต้องการแชร์ dependency เพื่อลด bundle
- ต้องการ integration ระดับ module
- ทีมรับ complexity ของ federation ได้

เลือก Web Component ถ้า:

- ต้องการข้าม framework ง่ายและคงเสถียร
- ต้องการ contract ที่เป็นมาตรฐาน browser
- อยากลด coupling ระหว่าง host กับ remote

เลือกแบบผสม (แนะนำในองค์กรใหญ่):

- ภายใน ecosystem เดียวกันใช้ Module Federation
- ข้าม stack/ทีม ใช้ Web Component boundary

## 11) Mapping ไฟล์สำคัญใน repo นี้

### Module Federation

- `angular-host/src/app/features/angular-remotes/angular-remote-view.component.ts`
- `angular-host/src/app/features/react/react-remote-tab.component.ts`
- `angular-host/src/app/features/vue/vue-remote-tab.component.ts`
- `react-mfe/src/mount.jsx`

### Web Component

- `angular-host/src/app/features/web-components/mfe-web-component-tab.component.ts`
- `angular-host/src/app/features/web-components-ax/mfe-ax-lazy-element-tab.component.ts`
- `angular-host/src/app/features/react/mfe-react-ax-lazy-element-tab.component.ts`
- `react-mfe/src/index.ax.element.jsx`
- `angular-host/public/remotes/ma-demo-web-remote.js`

## 12) สรุป

ความต่างหลักคือ "ชั้นที่ compose" และ "รูปแบบ contract"

- Module Federation = module-level integration + dependency sharing
- Web Component = DOM-level integration + framework-agnostic boundary

ทั้งสองแบบใช้ร่วมกันได้ และในระบบจริงมักได้ผลดีที่สุดเมื่อเลือกใช้ให้ตรงบริบทของแต่ละโดเมน
