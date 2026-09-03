# ⚙️ BPC Maintenance Report & Tracker (CMMS)
> A centralized digital hub for tracking, assigning, and reporting industrial maintenance tasks.
> ศูนย์กลางติดตาม แจกงานซ่อม และจัดการรายงานการบำรุงรักษาเครื่องจักร (CMMS)

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Chart.js](https://img.shields.io/badge/chart.js-%23FF6384.svg?style=for-the-badge&logo=chartdotjs&logoColor=white)
![Google Apps Script](https://img.shields.io/badge/google%20apps%20script-%234285F4.svg?style=for-the-badge&logo=google&logoColor=white)

---

## 📖 About The Project | เกี่ยวกับโครงการ

**[EN]**
The BPC Maintenance Report System functions as a lightweight Computerized Maintenance Management System (CMMS). It empowers engineering teams to instantly log machine breakdowns, track ongoing repairs, assign tasks to technicians, and update PM (Preventive Maintenance) plans. The system features a real-time analytics dashboard, strict audit trails for data modification, and automated Excel reporting, entirely built on a serverless Google Apps Script infrastructure.

**[TH]**
ระบบจัดการรายงานการซ่อมบำรุง (CMMS) ถูกออกแบบมาเพื่อเป็น "ศูนย์กลางติดตามและแจกงานซ่อม" สำหรับทีมวิศวกรและช่างเทคนิค ระบบช่วยให้การแจ้งซ่อม อัปเดตสถานะงาน และประเมินเวลา Downtime เป็นไปอย่างรวดเร็วและแม่นยำ มาพร้อมกับแดชบอร์ดสถิติแบบ Real-time ระบบบันทึกประวัติการแก้ไข (Audit Trail) และสามารถออกรายงานเป็นไฟล์ Excel ได้ทันที เพื่อใช้ในการวิเคราะห์ข้อมูลเครื่องจักรและวางแผนงานซ่อมบำรุงเชิงป้องกัน (PM) ต่อไป

---

## ✨ Key Features | ฟีเจอร์เด่น

*   📊 **Real-time Analytics Dashboard:** แดชบอร์ดสรุปยอดงานซ่อม, กราฟแท่งแสดงปัญหาแยกตาม Line (Chart.js) และฟีดอัปเดตงานล่าสุดของทีมช่างแบบเรียลไทม์
*   📝 **Advanced Filtering & Pagination:** ระบบคัดกรองข้อมูลเชิงลึก (ตามวันที่, แผนก, Line, กะ, และสถานะ) พร้อมระบบแบ่งหน้าเพจ (Pagination) ที่รองรับการประมวลผลข้อมูลจำนวนมากถึง 200 รายการต่อหน้า
*   ⏱️ **Automated Time Calculation:** ระบบคำนวณระยะเวลาซ่อมและเวลาหยุดเครื่องจักร (Downtime) ให้อัตโนมัติ พร้อมดักจับการกรอกเวลาผิดพลาดและรองรับการคำนวณเวลาข้ามวัน (กะดึก)
*   🔍 **Audit Trail System:** ระบบบันทึกประวัติการแก้ไข บังคับกรอกชื่อและเหตุผลทุกครั้งที่มีการเปลี่ยนแปลงข้อมูลหรือมีการแจกจ่ายงาน เพื่อความโปร่งใสของข้อมูล
*   📸 **Optimized Image Processing:** ระบบบีบอัดรูปภาพหน้าเครื่อง (Client-side Compression) ลดขนาดสูงสุด 1000px ก่อนส่งเข้าเซิร์ฟเวอร์ รองรับการแนบภาพสูงสุดหมวดละ 5 รูป
*   📑 **Excel (.xlsx) Export Engine:** ผสานการทำงานกับ `ExcelJS` ออกรายงาน Excel พร้อมจัดความกว้างคอลัมน์ สีหัวตาราง และฝังรูปภาพลิงก์ลงในเซลล์อัตโนมัติ
*   💾 **Auto-Save Drafts:** ระบบบันทึกแบบร่างอัตโนมัติ (Auto-save) ลงในเบราว์เซอร์ ป้องกันข้อมูลสูญหายกรณีเน็ตหลุดหรือเผลอปิดหน้าต่าง

---

## 🛠️ Tech Stack & Architecture | โครงสร้างสถาปัตยกรรม

*   **Frontend (หน้าบ้าน):** Vanilla JavaScript, HTML5, CSS3
*   **Backend / API (หลังบ้าน):** Google Apps Script (GAS) 
*   **Database (ฐานข้อมูล):** Google Sheets
*   **Libraries:** `Chart.js` (สำหรับแดชบอร์ด), `ExcelJS` (สำหรับส่งออก Excel)
*   **Hosting:** GitHub Pages

### 📂 Project Structure (Separation of Concerns)
ระบบถูกเขียนและจัดระเบียบแบบแยกไฟล์ เพื่อความง่ายในการอ่านและพัฒนาต่อยอด (Maintainability):
```text
├── index.html     # โครงสร้างหน้าเว็บ (UI Layout) - "เสาและคานบ้าน"
├── style.css      # ไฟล์ตกแต่งความสวยงามและการจัดหน้า (CSS) - "สีทาบ้าน"
├── script.js      # ลอจิกการทำงานและเชื่อมต่อ API (JavaScript) - "ระบบไฟฟ้าและสมองกล"
├── README.md      # คู่มือและรายละเอียดโครงการสำหรับผู้พัฒนา
└── /images        # โฟลเดอร์สำหรับเก็บไฟล์รูปภาพ Icon และ Logo
```

---

## 🧠 Core Functions Guide | คู่มือฟังก์ชันการทำงานเชิงลึก

โค้ดในไฟล์ `script.js` ถูกแบ่งการทำงานออกเป็นหมวดหมู่ดังนี้:

### 1. Dashboard & Data Rendering (แดชบอร์ดและการแสดงผล)
*   **`updateDashboardStats(data)`:** คำนวณร้อยละของงานที่เสร็จสมบูรณ์ นับจำนวนงานใหม่ (ภายใน 48 ชั่วโมง) และอัปเดตข้อมูลให้ Chart.js และ Tech Feed
*   **`renderReportTable(pageNumber)`:** รับผิดชอบระบบคัดกรองข้อมูล (Filter) และระบบแบ่งหน้าเพจ (Pagination) เพื่อปั้นข้อมูลออกมาเป็นการ์ดแสดงผล
*   **`openJobDetails(numStr)`:** สร้างหน้าต่าง Modal แสดงรายละเอียดของงานซ่อมนั้นๆ รวมถึงคำนวณ Response Time และ Downtime ทันทีแบบ on-the-fly

### 2. Time & Validation Logic (การคำนวณและดักจับข้อผิดพลาด)
*   **`validateTimes(...)`:** ฟังก์ชันป้องกันความผิดพลาด (Human Error) เช็คว่าเวลาซ่อมเสร็จต้องไม่เร็วกว่าเวลาเริ่มซ่อม พร้อมรองรับการคำนวณเวลาข้ามคืน
*   **`getDiffMinutes(...)` / `formatDuration(...)`:** คำนวณความต่างของเวลาและแปลงให้อยู่ในรูปแบบที่อ่านง่าย เช่น "1 ชั่วโมง 30 นาที"

### 3. File Processing & Caching (การจัดการไฟล์และข้อมูลชั่วคราว)
*   **`compressImageAsync(file)`:** ประมวลผลรูปภาพแบบ Asynchronous ผ่าน HTML5 Canvas เพื่อจำกัดขนาดภาพไม่ให้เกิน 1000px ก่อนแปลงเป็น Base64
*   **`saveDraft()` / `loadDraft()`:** เก็บข้อมูลฟอร์มลง `localStorage` แบบเรียลไทม์ และเคลียร์ข้อมูลทิ้งเมื่อบันทึกสำเร็จหรือเวลาผ่านไปเกิน 6 ชั่วโมง

### 4. Database Mutations (การเขียนและอัปเดตข้อมูล)
*   **`submitForm(e)`:** รวบรวมข้อมูลการแจ้งซ่อมใหม่ทั้งหมด ส่งผ่าน API ไปหา Backend (Google Apps Script)
*   **`submitEditForm(e)`:** วิ่งไปที่ฟังก์ชันอัปเดต พร้อมแนบ Payload บังคับ `editorName` และ `editReason` สำหรับระบบ Audit Trail

### 5. Document Export (การส่งออกรายงาน)
*   **`exportToExcel()`:** ดึงข้อมูลที่ผ่านการคัดกรอง (Filtered Data) มาเรียงลำดับใหม่ สร้าง Workbook ผ่าน ExcelJS จัดการ Style และจัดเรียงลิงก์รูปภาพให้พร้อมใช้งานใน Excel

---

## ⚠️ Troubleshooting | การแก้ไขปัญหาเบื้องต้น

*   **Deployment changes not reflecting (อัปเดตโค้ดใน GitHub แล้วแต่เว็บไม่เปลี่ยน)**
    *   *Cause:* เบราว์เซอร์ทำการแคช (Cache) ไฟล์ `style.css` หรือ `script.js` ตัวเก่าไว้
    *   *Solution:* ในไฟล์ `index.html` เลื่อนไปล่างสุด ให้เปลี่ยนเลขเวอร์ชันที่ดึงไฟล์ เช่น เปลี่ยน `<script src="script.js?v=1.0"></script>` เป็น `?v=1.1`
*   **Time Validation Error (ระบบแจ้งเตือนข้อผิดพลาดเวลา ไม่ยอมให้บันทึก)**
    *   *Cause:* ผู้ใช้อาจกรอกเวลาเริ่มซ่อมก่อนเวลาแจ้ง หรือเวลาซ่อมเสร็จก่อนเริ่มซ่อม
    *   *Solution:* ตรวจสอบตัวเลขเวลาให้สมเหตุสมผล ระบบถูกออกแบบมาให้รองรับการคำนวณข้ามคืน (เช่น เริ่ม 23:00 เสร็จ 02:00) ได้อย่างถูกต้องอยู่แล้ว
*   **"Edit" mode fails to save (อัปเดตข้อมูลแล้วขึ้น Error)**
    *   *Cause:* ไม่ได้กรอกชื่อผู้แก้ไข หรือเหตุผลที่แก้ไข
    *   *Solution:* ฟังก์ชัน `submitEditForm` บังคับการส่งค่า `editorName` และ `editReason` เพื่อตรวจสอบการทำงานย้อนหลัง (Audit Trail)
*   **API Connection Failure (ขึ้นแจ้งเตือนเชื่อมต่อฐานข้อมูลไม่ได้)**
    *   *Solution:* หากแก้ไขโค้ดฝั่ง Google Apps Script ต้องกด `Deploy` -> `New Deployment` ทุกครั้ง และนำ Web App URL อันใหม่มาอัปเดตที่ตัวแปร `const GAS_API_URL` บรรทัดบนสุดในไฟล์ `script.js`

---

## 🤖 AI Prompting Guide | คำแนะนำสำหรับการนำโค้ดไปพัฒนาต่อร่วมกับ AI

หากต้องการนำโค้ดชุดนี้ไปให้ AI (ChatGPT, Gemini, Claude) ช่วยพัฒนาหรือแก้ไขบั๊ก ให้ใช้โครงสร้าง Prompt ดังนี้เพื่อความแม่นยำสูงสุด:

**1. Provide Architecture Context (บรีฟบริบทเบื้องต้น):**
> *"โปรเจกต์นี้คือ CMMS Web App เขียนด้วย Vanilla JS, HTML, CSS แยกไฟล์แบบ SoC (index.html, style.css, script.js) ใช้ Chart.js (แสดงสถิติ) และ ExcelJS (ออกรายงาน) เชื่อมต่อ API แบบ JSON กับ Google Apps Script"*

**2. Isolate the Code (ส่งโค้ดให้ AI ดูเฉพาะส่วน ห้ามส่งรวมกันทั้งหมด):**
*   *แก้หน้าตา/UI:* ส่งแค่ `index.html` + `style.css`
*   *แก้ระบบการคำนวณ/บั๊ก:* ส่งฟังก์ชันที่เกี่ยวข้องใน `script.js` เช่น `getDiffMinutes` หรือ `renderReportTable`

**3. Highly Effective Prompt Examples (ตัวอย่าง Prompt ทรงพลัง):**
*   *เพิ่มฟีเจอร์แดชบอร์ด:* "ใน `script.js` ฟังก์ชัน `updateDashboardStats()` ช่วยเพิ่มตรรกะในการหา 'เวลาเฉลี่ยการซ่อม (MTTR)' ของงานทั้งหมด และแสดงผลผ่าน id `statMTTR` ให้หน่อย"
*   *ปรับแต่งหน้า Excel:* "ในฟังก์ชัน `exportToExcel()` ของ `script.js` ฉันต้องการให้แถว (Row) ที่มีสถานะว่า 'Finished' ถูกไฮไลต์พื้นหลังเป็นสีเขียวอ่อน ช่วยเขียนโค้ด ExcelJS ในส่วนนี้เพิ่มที"

---

### 👨‍💻 Author

**Natthapon Kongthong (Junior / 최준재)**
*Undergraduate Student, Manufacturing System Engineering*
*School of Integrated Innovation and Technology, King Mongkut's Institute of Technology Ladkrabang (KMITL)*

*Developed during a Cooperative Education Engineering Internship at Unilever (Ladkrabang) - 2026.*
* **Tel:** 095-009-8008 
* **Email:** natthapon.kth@gmail.com
