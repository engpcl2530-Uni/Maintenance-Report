// 🔴 ใส่ URL ของคุณตรงนี้
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbygLJABXRzeot0Fu5FxdGN_4GwFJnnPMb2ifm4pvrcsTl6TpdvilGeHqOrNpjJo-MyN9w/exec";

let allReportData = [];
let currentJobData = null; 
let lineChartInstance = null;

let currentPage = 1;
const itemsPerPage = 200; 
let currentFilteredData = [];

function parseTimeStringToPretty(timeStr) {
    if (!timeStr || timeStr === "-") return "-";
    let str = timeStr.toString().trim();
    if (str.includes("ชั่วโมง") || str.includes("นาที")) { return str.replace(" 0 นาที", ""); }
    if (str.includes(":")) {
        let parts = str.split(":"); let h = parseInt(parts[0], 10) || 0; let m = parseInt(parts[1], 10) || 0;
        if (h > 0 && m > 0) return `${h} ชั่วโมง ${m} นาที`;
        if (h > 0 && m === 0) return `${h} ชั่วโมง`; return `${m} นาที`;
    }
    return str;
}

function formatDuration(totalMins) {
    if (isNaN(totalMins) || totalMins < 0) return "-";
    let h = Math.floor(totalMins / 60); let m = totalMins % 60;
    if (h > 0 && m > 0) return `${h} ชั่วโมง ${m} นาที`;
    if (h > 0 && m === 0) return `${h} ชั่วโมง`; return `${m} นาที`;
}

function parseDateSafely(dateStr) {
    if (!dateStr) return new Date(0); 
    let str = dateStr.toString().trim();
    if (str.includes('-')) { let d = new Date(str); if (!isNaN(d.getTime())) return d; }
    if (str.includes('/')) {
        let parts = str.split('/');
        if (parts.length === 3) {
            let p0 = parseInt(parts[0], 10); let p1 = parseInt(parts[1], 10); let p2 = parseInt(parts[2], 10);
            if (p2 < 100) p2 += 2000;
            return new Date(p2, p1 - 1, p0); 
        }
    }
    let fallback = new Date(str); return isNaN(fallback.getTime()) ? new Date(0) : fallback;
}

function toLocalYYYYMMDD(d) {
    let y = d.getFullYear(); let m = (d.getMonth() + 1).toString().padStart(2, '0'); let day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function isNewJob(dateStr) {
    if (!dateStr) return false;
    let jobDate = parseDateSafely(dateStr); let diffHours = (new Date() - jobDate) / (1000 * 60 * 60);
    return (diffHours >= -24 && diffHours <= 48); 
}

function validateTimes(cHH, cMM, sHH, sMM, eHH, eMM) {
    let s = parseInt(sHH)*60 + parseInt(sMM); let e = parseInt(eHH)*60 + parseInt(eMM);
    if (isNaN(s) || isNaN(e)) return null;
    let c = (cHH !== "" && cMM !== "") ? parseInt(cHH)*60 + parseInt(cMM) : null;
    if (c !== null) { if (s < c && c >= 18*60 && s <= 6*60) s += 24*60; }
    if (e < s && s >= 18*60 && e <= 12*60) e += 24*60; 
    if (c !== null && s < c) return "เวลา 'เริ่มซ่อม' เร็วกว่าเวลา 'ที่รับแจ้ง'";
    if (e < s) return "เวลา 'ซ่อมเสร็จ' เร็วกว่าเวลา 'เริ่มซ่อม'";
    return null; 
}

function getDiffMinutes(startHH, startMM, endHH, endMM) {
    let s = parseInt(startHH)*60 + parseInt(startMM); let e = parseInt(endHH)*60 + parseInt(endMM);
    if (e < s) e += 24*60; return e - s;
}

const CACHE_KEY = "cmms_draft_v1";

function saveDraft() {
    let draft = {
        timestamp: new Date().getTime(),
        date: document.getElementById('date').value, shift: document.getElementById('shift').value,
        line: document.getElementById('line').value, lineOther: document.getElementById('lineOther') ? document.getElementById('lineOther').value : '',
        machine: document.getElementById('machine').value,
        callHH: document.getElementById('callHH').value, callMM: document.getElementById('callMM').value,
        startHH: document.getElementById('startHH').value, startMM: document.getElementById('startMM').value,
        endHH: document.getElementById('endHH').value, endMM: document.getElementById('endMM').value,
        breakdown: document.getElementById('breakdown').value, cause: document.getElementById('cause').value,
        solved: document.getElementById('solved').value, result: document.getElementById('result').value,
        isBreakdown: document.getElementById('isBreakdown').value, cost: document.getElementById('cost').value,
        pmUpdate: document.getElementById('pmUpdate').value, pmCompleted: document.getElementById('pmCompleted').value, pmInterval: document.getElementById('pmInterval').value, pmDetail: document.getElementById('pmDetail').value,
        handover: document.getElementById('handover').value, dept: document.getElementById('dept').value, remark: document.getElementById('remark').value
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(draft));
    let t = document.getElementById('toast');
    t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 1500);
}

function loadDraft() {
    let saved = localStorage.getItem(CACHE_KEY);
    if(saved) {
        let data = JSON.parse(saved);
        if(new Date().getTime() - data.timestamp < 6 * 60 * 60 * 1000) { 
            ['date','shift','line','machine','callHH','callMM','startHH','startMM','endHH','endMM','breakdown','cause','solved','result','isBreakdown','cost','pmUpdate','pmCompleted','pmInterval','pmDetail','handover','dept','remark'].forEach(id => {
                if(data[id] && document.getElementById(id)) document.getElementById(id).value = data[id];
            });
            if(data.line === 'อื่นๆ') toggleOther('line', 'lineOtherContainer');
        } else { localStorage.removeItem(CACHE_KEY); }
    }
    if(!document.getElementById('date').value) document.getElementById('date').valueAsDate = new Date();
}

document.getElementById('maintenanceForm').addEventListener('input', saveDraft);
document.getElementById('maintenanceForm').addEventListener('change', saveDraft);

window.onload = async function() {
  loadDraft(); 
  try {
    const res = await callAPI("getDashboard", {});
    if(res.status === "success") { 
      allReportData = res.data; 
      document.getElementById('loadingScreen').style.display = 'none';
      document.getElementById('dashboardView').style.display = 'block';
      renderReportTable(1); 
    } else { alert("Error: " + res.message); }
  } catch(err) { alert("Network Error: " + err.message); }
};

async function callAPI(actionType, dataPayload) {
  if(!GAS_API_URL || GAS_API_URL.includes("ใส่_URL_ของ")) throw new Error("กรุณาใส่ URL ของ Google Apps Script ก่อนครับ");
  const payload = { action: actionType, data: dataPayload };
  const response = await fetch(GAS_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
  return await response.json();
}

function setQuickFilter(type) {
    document.querySelectorAll('.btn-quick').forEach(b => b.classList.remove('active')); event.target.classList.add('active');
    let today = new Date(); let fs = document.getElementById('fStart'); let fe = document.getElementById('fEnd');
    if (type === 'all') { fs.value = ''; fe.value = ''; }
    else if (type === 'month') { let firstDay = new Date(today.getFullYear(), today.getMonth(), 1); fs.value = toLocalYYYYMMDD(firstDay); fe.value = toLocalYYYYMMDD(today); }
    else if (type === 'week') { let first = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1); let firstDay = new Date(today.setDate(first)); fs.value = toLocalYYYYMMDD(firstDay); fe.value = toLocalYYYYMMDD(new Date()); }
    renderReportTable(1);
}

async function exportToExcel() {
    if(!currentFilteredData || currentFilteredData.length === 0) { 
        alert("ไม่พบข้อมูลสำหรับ Export"); 
        return; 
    }
    
    let loadingScreen = document.getElementById('loadingScreen');
    let loadingText = document.querySelector('#loadingScreen p');
    let originalText = loadingText.innerText;
    
    loadingScreen.style.display = 'flex';
    loadingText.innerText = "กำลังสร้างไฟล์ Excel...\nกรุณารอสักครู่";
    
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('CMMS_Report');

        worksheet.columns = [
            { header: 'No.', key: 'num', width: 8 },
            { header: 'วันที่', key: 'date', width: 12 },
            { header: 'แผนก', key: 'dept', width: 8 },
            { header: 'Line', key: 'line', width: 8 },
            { header: 'Machine', key: 'machine', width: 18 },
            { header: 'Breakdown Detail', key: 'breakdown', width: 35 },
            { header: 'Cause', key: 'cause', width: 35 },
            { header: 'Problem solved', key: 'solved', width: 35 },
            { header: 'Repair result', key: 'result', width: 15 },
            { header: 'Calling Time', key: 'callTime', width: 12 },
            { header: 'Start Time', key: 'startTime', width: 12 },
            { header: 'End Time', key: 'endTime', width: 12 },
            { header: 'Repair Time', key: 'repairTime', width: 15 },
            { header: 'Shift', key: 'shift', width: 8 },
            { header: 'Service by', key: 'tech', width: 25 },
            { header: 'หมายเหตุ', key: 'remark', width: 25 },
            { header: 'ผู้รับมอบงาน', key: 'handover', width: 18 },
            { header: 'รูปก่อนซ่อม (Links)', key: 'imgBefore', width: 50 }, 
            { header: 'รูปหลังซ่อม (Links)', key: 'imgAfter', width: 50 },
            { header: 'PM Update', key: 'pmUpdate', width: 12 },
            { header: 'PM Detail', key: 'pmDetail', width: 30 },
            { header: 'PM Interval', key: 'pmInterval', width: 12 },
            { header: 'PM Completed', key: 'pmCompleted', width: 15 },
            { header: 'Cost', key: 'cost', width: 12 },
            { header: 'Is Breakdown', key: 'isBreakdown', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Prompt' };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005EB8' } };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        let exportData = [...currentFilteredData].sort((a, b) => a.displayNum - b.displayNum);

        exportData.forEach(r => {
            let mappedResult = r.result === 'F' || r.result === 'Finished' ? 'Finished' : (r.result === 'O' || r.result === 'Ongoing' ? 'Ongoing' : (r.result === 'U' || r.result === 'Unfinished' ? 'Unfinished' : r.result));
            
            let formatLinks = (imgStr) => {
                if (!imgStr || imgStr.trim() === "") return "-";
                let urls = imgStr.split(',');
                return urls.map((url, idx) => `[รูปที่ ${idx + 1}]: ${url.trim()}`).join('\n');
            };

            worksheet.addRow({
                num: r.displayNum, date: r.date, dept: r.dept, line: r.line, machine: r.machine,
                breakdown: r.breakdown, cause: r.cause, solved: r.solved, result: mappedResult, callTime: r.callTime,
                startTime: r.startTime, endTime: r.endTime, repairTime: r.repairTime, shift: r.shift, tech: r.tech,
                remark: r.remark, handover: r.handover, 
                imgBefore: formatLinks(r.imgBefore), 
                imgAfter: formatLinks(r.imgAfter),   
                pmUpdate: r.pmUpdate, pmDetail: r.pmDetail, pmInterval: r.pmInterval, pmCompleted: r.pmCompleted, 
                cost: r.cost, isBreakdown: r.isBreakdown
            });
        });

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = { 
                    top: { style: 'thin' }, left: { style: 'thin' }, 
                    bottom: { style: 'thin' }, right: { style: 'thin' } 
                };
                if (rowNumber > 1) {
                    cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
                    cell.font = { name: 'Prompt' }; 
                }
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `CMMS_Report_${toLocalYYYYMMDD(new Date())}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
    } catch (error) {
        console.error(error);
        alert("ไม่สามารถสร้างไฟล์ Excel ได้: " + error.message);
    } finally {
        loadingText.innerText = originalText; 
        loadingScreen.style.display = 'none';
    }
}    


function renderReportTable(pageNumber) {
  let fs = document.getElementById('fStart').value; let fe = document.getElementById('fEnd').value;
  let fd = document.getElementById('fDept').value; 
  let fl = document.getElementById('fLine').value; let shift = document.getElementById('fShift').value;
  let statusFilter = document.getElementById('fStatus').value; let textFilter = document.getElementById('fText').value.toLowerCase();

  let fsVal = fs ? parseDateSafely(fs).setHours(0,0,0,0) : null;
  let feVal = fe ? parseDateSafely(fe).setHours(23,59,59,999) : null;

  currentFilteredData = allReportData.filter(r => {
    let jDateObj = parseDateSafely(r.date); let jDate = jDateObj.getTime();
    if (fsVal && jDate < fsVal) return false;
    if (feVal && jDate > feVal) return false;
    
    if (fd && r.dept !== fd) return false;
    
    if (fl && r.line !== fl) return false;
    if (shift && r.shift !== shift) return false;
    let mappedStatus = r.result === 'F' || r.result === 'Finished' ? 'Finished' : (r.result === 'O' || r.result === 'Ongoing' ? 'Ongoing' : (r.result === 'U' || r.result === 'Unfinished' ? 'Unfinished' : r.result));
    if (statusFilter && mappedStatus !== statusFilter) return false;
    if (textFilter && !(r.num.toString().toLowerCase().includes(textFilter) || (r.tech || "").toLowerCase().includes(textFilter) || (r.machine || "").toLowerCase().includes(textFilter) || (r.breakdown || "").toLowerCase().includes(textFilter))) return false;
    return true;
  });

  updateDashboardStats(currentFilteredData, fl);

  currentPage = pageNumber || 1;
  let totalPages = Math.ceil(currentFilteredData.length / itemsPerPage) || 1;
  let startIndex = (currentPage - 1) * itemsPerPage;
  let paginated = currentFilteredData.slice(startIndex, startIndex + itemsPerPage);

  let html = `<p style="font-size:14px; color:var(--text-muted); margin-bottom:15px; font-weight: 500;">พบทั้งหมด <b>${currentFilteredData.length}</b> รายการ (แสดงหน้า ${currentPage}/${totalPages})</p>`;
  
  paginated.forEach(item => {
    let statusFull = item.result === "F" || item.result === "Finished" ? "Finished" : (item.result === "O" || item.result === "Ongoing" ? "Ongoing" : "Unfinished");
    let statusColor = statusFull === "Finished" ? "#38A169" : (statusFull === "Ongoing" ? "#D69E2E" : "#E53E3E");
    let isNew = isNewJob(item.date); 
    let newBadgeHtml = isNew ? `<div class="badge-new"><span class="material-symbols-rounded" style="font-size:12px;">campaign</span> NEW</div>` : "";
    let techDisplay = (item.tech && item.tech.trim() !== "") ? item.tech : '<span style="color:#E53E3E;">ยังไม่ระบุช่าง</span>';
    let callTimeHtml = item.callTime ? `<span class="badge-chip" style="background:#EBF8FF; color:#3182CE;"><span class="material-symbols-rounded" style="font-size:14px;">notifications_active</span> แจ้ง: ${item.callTime}</span>` : "";
    let prettyRepairTime = parseTimeStringToPretty(item.repairTime);
    let repairTimeHtml = (prettyRepairTime && prettyRepairTime !== "-") ? `<span class="badge-chip" style="background:#F0FFF4; color:#38A169;"><span class="material-symbols-rounded" style="font-size:14px;">timer</span> ซ่อม: ${prettyRepairTime}</span>` : "";

    html += `
      <div class="report-card status-${statusFull} ${isNew?'is-new':''}" onclick="openJobDetails('${item.num}')">
        <div class="report-card-head">
          <div class="report-card-title"><span style="color:var(--secondary); margin-right:5px;">#${item.displayNum} [${item.dept}]</span> ${item.machine} <span style="font-weight:400; color:var(--text-muted);">(${item.line})</span> ${newBadgeHtml}</div>
          <div style="font-size:14px; font-weight:700; color:${statusColor};">${statusFull}</div>
        </div>
        <p class="report-detail"><b>อาการ:</b> ${item.breakdown}</p>
        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          <span class="badge-chip"><span class="material-symbols-rounded" style="font-size:14px;">person</span> ${techDisplay}</span>
          <span class="badge-chip"><span class="material-symbols-rounded" style="font-size:14px;">calendar_month</span> ${item.date}</span>
          ${callTimeHtml}
          ${repairTimeHtml}
        </div>
      </div>`;
  }); 

  document.getElementById('reportContent').innerHTML = html;
  
  let pageWrapper = document.getElementById('paginationWrapper');
  if(totalPages > 1) {
      pageWrapper.style.display = "flex";
      document.getElementById('pageIndicator').innerText = `หน้า ${currentPage} / ${totalPages}`;
      document.getElementById('btnPrev').disabled = (currentPage === 1);
      document.getElementById('btnNext').disabled = (currentPage === totalPages);
  } else { pageWrapper.style.display = "none"; }
}

function changePage(step) { renderReportTable(currentPage + step); window.scrollTo(0, document.getElementById('dashboardView').offsetTop); }

function updateDashboardStats(data, selectedLine) {
    let newCount = 0; let doneCount = 0; let lineCounts = {}; let techLatest = {};
    data.forEach(job => {
        let mappedStatus = job.result === 'F' || job.result === 'Finished' ? 'Finished' : (job.result === 'O' || job.result === 'Ongoing' ? 'Ongoing' : 'Unfinished');
        if(mappedStatus === 'Finished') doneCount++;
        if(isNewJob(job.date)) newCount++; 
        if(job.line) { lineCounts[job.line] = (lineCounts[job.line] || 0) + 1; }
        if(job.tech) {
            let techs = job.tech.split(',').map(t => t.trim());
            techs.forEach(t => {
                let jobTime = job.lastUpdateMs || 0;
                if(!techLatest[t] || jobTime > techLatest[t].lastUpdateMs) {
                    techLatest[t] = { num: job.num, displayNum: job.displayNum, machine: job.machine, line: job.line, result: mappedStatus, lastUpdateMs: jobTime };
                }
            });
        }
    });

    document.getElementById('statNewTask').innerText = newCount;
    let p = data.length ? Math.round((doneCount/data.length)*100) : 0;
    document.getElementById('statDone').innerText = p + "%";

    let chartSection = document.getElementById('chartSection');
    if (selectedLine !== "" && selectedLine !== undefined) { chartSection.style.display = 'none'; } else {
        chartSection.style.display = 'block';
        let lineArray = Object.keys(lineCounts).map(k => ({line: k, count: lineCounts[k]}));
        lineArray.sort((a,b) => b.count - a.count); lineArray = lineArray.slice(0, 10); 
        let chartLabels = lineArray.map(i => i.line); let chartData = lineArray.map(i => i.count);

        let ctx = document.getElementById('lineIssueChart').getContext('2d');
        if(lineChartInstance) lineChartInstance.destroy();
        lineChartInstance = new Chart(ctx, { type: 'bar', data: { labels: chartLabels, datasets: [{ label: 'จำนวนปัญหา', data: chartData, backgroundColor: '#00A5D9', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks:{stepSize:1} } } } });
    }

    let techArr = Object.entries(techLatest).map(([tech, info]) => ({tech, ...info}));
    techArr.sort((a, b) => b.lastUpdateMs - a.lastUpdateMs);
    let feedHtml = "";
    techArr.forEach(info => {
        let col = info.result==='Finished'?'#38A169':(info.result==='Ongoing'?'#D69E2E':'#E53E3E');
        feedHtml += `<div class="tech-chip" onclick="openJobDetails('${info.num}')" style="cursor:pointer; border-left: 4px solid ${col};"><div class="tech-chip-name"><span class="material-symbols-rounded" style="font-size:16px;">build</span> ${info.tech}</div><div class="tech-chip-job">#${info.displayNum} ${info.machine}</div></div>`;
    });
    document.getElementById('techFeed').innerHTML = feedHtml || "<span style='font-size:13px; color:#718096;'>ไม่พบข้อมูลช่างในช่วงนี้</span>";
}

async function submitForm(event) {
  event.preventDefault(); 
  var btn = document.getElementById('submitBtn'); btn.innerHTML = '<span class="material-symbols-rounded" style="animation: spin 1s linear infinite;">sync</span> กำลังบันทึก...'; btn.disabled = true;
  
  let cHH = document.getElementById('callHH').value.replace(/[^0-9]/g, ''); let cMM = document.getElementById('callMM').value.replace(/[^0-9]/g, '');
  let sHH = document.getElementById('startHH').value.replace(/[^0-9]/g, ''); let sMM = document.getElementById('startMM').value.replace(/[^0-9]/g, '');
  let eHH = document.getElementById('endHH').value.replace(/[^0-9]/g, ''); let eMM = document.getElementById('endMM').value.replace(/[^0-9]/g, '');
  
  let timeError = validateTimes(cHH, cMM, sHH, sMM, eHH, eMM);
  if(timeError) { alert("⚠️ ข้อผิดพลาดเวลา: " + timeError + "\nกรุณาตรวจสอบการกรอกเวลาอีกครั้ง"); btn.innerHTML='<span class="material-symbols-rounded">cloud_upload</span> บันทึกข้อมูลเข้าระบบ'; btn.disabled = false; return; }

  let repairMins = getDiffMinutes(sHH, sMM, eHH, eMM);
  let calculatedRepairTime = formatDuration(repairMins);

  var techArray = []; document.querySelectorAll('.tech-cb:checked').forEach(cb => techArray.push(cb.value));
  if(document.getElementById('cbOther').checked) techArray.push(document.getElementById('techOther').value);

  try {
    var baseBefore=[], baseAfter=[];
    for(let f of filesBefore) baseBefore.push(await compressImageAsync(f));
    for(let f of filesAfter) baseAfter.push(await compressImageAsync(f));

    var formData = {
      date: document.getElementById('date').value, dept: document.getElementById('dept').value, line: document.getElementById('line').value, lineOther: document.getElementById('lineOther')?document.getElementById('lineOther').value:'', machine: document.getElementById('machine').value, breakdown: document.getElementById('breakdown').value, cause: document.getElementById('cause').value, solved: document.getElementById('solved').value, result: document.getElementById('result').value, callTime: getTimeString('call'), startTime: getTimeString('start'), endTime: getTimeString('end'), shift: document.getElementById('shift').value, serviceBy: techArray.join(', '), handover: document.getElementById('handover').value, remark: document.getElementById('remark').value, imgsBefore: baseBefore, imgsAfter: baseAfter,
      repairTime: calculatedRepairTime, pmUpdate: document.getElementById('pmUpdate').value, pmCompleted: document.getElementById('pmCompleted').value, pmInterval: document.getElementById('pmInterval').value, pmDetail: document.getElementById('pmDetail').value,
      isBreakdown: document.getElementById('isBreakdown').value, cost: document.getElementById('cost').value
    };

    const res = await callAPI("saveReport", formData);
    if(res.status==="success") {
      alert(res.message); document.getElementById('maintenanceForm').reset(); document.getElementById('date').valueAsDate=new Date(); clearFiles('before'); clearFiles('after');
      localStorage.removeItem(CACHE_KEY); toggleMainView(); document.getElementById('loadingScreen').style.display = 'flex';
      const newRes = await callAPI("getDashboard", {});
      if(newRes.status==="success"){ allReportData=newRes.data; renderReportTable(1); }
      document.getElementById('loadingScreen').style.display = 'none';
    } else { alert("เกิดข้อผิดพลาด: "+res.message); }
  } catch(err) { alert("Error: "+err.message); }
  btn.innerHTML='<span class="material-symbols-rounded">cloud_upload</span> บันทึกข้อมูลเข้าระบบ'; btn.disabled=false;
}

function toggleMainView() { const dbView = document.getElementById('dashboardView'); const formView = document.getElementById('formView'); const fabBtn = document.getElementById('fabMainBtn'); const fabIcon = document.getElementById('fabIcon'); if(formView.style.display === 'none') { dbView.style.display = 'none'; formView.style.display = 'block'; fabBtn.classList.add('close-mode'); fabIcon.style.transform = "rotate(45deg)"; document.getElementById('appTitle').innerText = "แจ้งซ่อมใหม่"; document.getElementById('appSub').innerText = "กรอกรายละเอียดปัญหาเครื่องจักร"; } else { formView.style.display = 'none'; dbView.style.display = 'block'; fabBtn.classList.remove('close-mode'); fabIcon.style.transform = "rotate(0deg)"; document.getElementById('appTitle').innerText = "CMMS System"; document.getElementById('appSub').innerText = "ศูนย์กลางติดตามและแจกงานซ่อม"; } window.scrollTo(0,0); }
function toggleOther(selectId, containerId) { var val = document.getElementById(selectId).value; var container = document.getElementById(containerId); var input = container.querySelector('input'); if(val === 'อื่นๆ') { container.style.display = 'block'; input.required = true; } else { container.style.display = 'none'; input.required = false; input.value = ''; } }
function toggleOtherTech(mode) { const prefix = mode === 'edit' ? 'edit_' : ''; const cb = document.getElementById(prefix + 'cbOther'); const container = document.getElementById(prefix + 'techOtherContainer'); const input = document.getElementById(prefix + 'techOther'); if(cb.checked) { container.style.display = 'block'; input.required = true; input.focus(); } else { container.style.display = 'none'; input.required = false; input.value = ''; } }

function openJobDetails(numStr) { 
    let job = allReportData.find(r => r.num.toString() === numStr.toString()); 
    if(!job) return; currentJobData = job; 
    document.getElementById('detailJobNum').innerText = "งานลำดับที่ #" + job.displayNum; 
    
    let statusFull = job.result === 'F' || job.result === 'Finished' ? 'Finished (เสร็จสมบูรณ์)' : (job.result === 'O' || job.result === 'Ongoing' ? 'Ongoing (กำลังดำเนินการ)' : 'Unfinished (ยังไม่เสร็จ)');
    let getImgHtml = (urls) => { if(!urls) return '<span style="color:var(--text-muted); font-size:13px;">ไม่มีรูปภาพแนบ</span>'; return urls.split(',').filter(u=>u).map(u => `<img src="${u.trim()}" onclick="window.open('${u.trim()}','_blank')" style="height:90px; width:90px; object-fit:cover; border-radius:10px; border:1px solid var(--border); box-shadow:var(--shadow-sm); cursor:pointer;">`).join(' '); }; 
    let techDisplay = (job.tech && job.tech.trim() !== "") ? job.tech : '<span style="color:#E53E3E; font-weight:700;">รอจ่ายงาน (คลิกปุ่มด้านล่างเพื่อระบุช่าง)</span>'; 
    
    let downTimeStr = "-"; let repairTimeStr = parseTimeStringToPretty(job.repairTime) || "-"; let responseTimeStr = "-";
    let st = job.startTime ? job.startTime.toString().split(':') : []; let et = job.endTime ? job.endTime.toString().split(':') : [];

    if(st.length===2 && et.length===2) {
        if (repairTimeStr === "-") { let rtMins = getDiffMinutes(st[0], st[1], et[0], et[1]); repairTimeStr = formatDuration(rtMins); }
        if(job.callTime && job.callTime !== "") { let ct = job.callTime.toString().split(':'); if(ct.length===2 && ct[0]!=="") { let dtMins = getDiffMinutes(ct[0], ct[1], et[0], et[1]); downTimeStr = formatDuration(dtMins); let respMins = getDiffMinutes(ct[0], ct[1], st[0], st[1]); responseTimeStr = formatDuration(respMins); } else { downTimeStr = repairTimeStr; } } else { downTimeStr = repairTimeStr; }
    }

    let isBD = job.isBreakdown === 'Yes' || job.isBreakdown === 'Y' || job.isBreakdown === 'YES' ? '✅ ใช่ (Yes)' : '❌ ไม่ (No)';

    let costNum = parseFloat(job.cost);
    let costDisplay = (!isNaN(costNum) && costNum > 0) ? costNum.toLocaleString() + ' บาท' : '0 บาท';

    let html = ` 
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:0px;"> 
        <div class="detail-row"><div class="detail-label">วันที่แจ้งซ่อม</div><div class="detail-value">${job.date}</div></div> 
        <div class="detail-row"><div class="detail-label">แผนก (Dept)</div><div class="detail-value fw-bold" style="color:var(--secondary);">${job.dept}</div></div> 
    </div> 
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;"> 
        <div class="detail-row"><div class="detail-label">สายการผลิต (Line) / กะ</div><div class="detail-value">${job.line} (${job.shift})</div></div> 
        <div class="detail-row"><div class="detail-label">เครื่องจักร (Machine)</div><div class="detail-value fw-bold">${job.machine}</div></div> 
    </div>
    
    <div class="detail-row" style="background:#F8FAFC; padding:12px; border-radius:10px; border:1px solid var(--border);"> 
        <div class="detail-label">สถานะงานซ่อมปัจจุบัน</div><div class="detail-value fw-bold">${statusFull}</div> 
    </div> 
    
    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-top:15px; background:#F8FAFC; padding:12px; border-radius:10px; border:1px solid var(--border); text-align:center;">
        <div><div style="font-size:11px; color:var(--text-muted); font-weight:700;">เวลาแจ้ง</div><div style="font-size:14px; font-weight:600; color:var(--text-main);">${job.callTime || '-'}</div></div>
        <div><div style="font-size:11px; color:var(--text-muted); font-weight:700;">เริ่มซ่อม</div><div style="font-size:14px; font-weight:600; color:var(--text-main);">${job.startTime || '-'}</div></div>
        <div><div style="font-size:11px; color:var(--text-muted); font-weight:700;">ซ่อมเสร็จ</div><div style="font-size:14px; font-weight:600; color:var(--text-main);">${job.endTime || '-'}</div></div>
    </div>

    <div class="metrics-container">
        <div class="metric-box downtime"><div class="metric-label">Downtime</div><div class="metric-val">${downTimeStr}</div></div>
        <div class="metric-box repair"><div class="metric-label">Repair Time</div><div class="metric-val">${repairTimeStr}</div></div>
        <div class="metric-box response"><div class="metric-label">Response</div><div class="metric-val">${responseTimeStr}</div></div>
    </div>

    <div class="detail-row" style="margin-top:15px;"><div class="detail-label">อาการที่พบ (Breakdown Detail)</div><div class="detail-value">${job.breakdown}</div></div> 
    <div class="detail-row"><div class="detail-label">สาเหตุ (Root Cause)</div><div class="detail-value">${job.cause || '-'}</div></div> 
    <div class="detail-row"><div class="detail-label">วิธีแก้ไข (Action Taken)</div><div class="detail-value">${job.solved}</div></div> 

    <div class="detail-row" style="background:#FFF5F5; padding:12px; border-radius:10px; border:1px solid #FC8181; margin-top:15px;">
        <div style="display:flex; justify-content:space-between;">
            <div><div class="detail-label" style="color:#E53E3E;">นับเป็น Breakdown</div><div class="detail-value fw-bold">${isBD}</div></div>
            <div style="text-align: right;"><div class="detail-label" style="color:#E53E3E;">ต้นทุนการซ่อม (Cost)</div><div class="detail-value fw-bold text-danger">${costDisplay}</div></div>
        </div>
    </div>
    
    <div class="detail-row" style="margin-top:15px; background:#F0F7FF; padding:12px; border-radius:10px; border:1px solid var(--secondary);">
       <div class="detail-label" style="color:var(--secondary); font-weight:bold;"><span class="material-symbols-rounded" style="font-size:16px; vertical-align:middle;">assignment_turned_in</span> ข้อมูลเสนอแผน PM</div>
       <div style="font-size:14px; margin-top:8px; line-height:1.6;">
           <b>ต้องแก้ไขแผน PM หรือไม่:</b> ${job.pmUpdate || '-'}<br>
           <b>แก้ไข PM เสร็จแล้วรึยัง:</b> ${job.pmCompleted || '-'}<br>
           <b>รอบ PM (เดือน):</b> ${job.pmInterval ? job.pmInterval + " เดือน" : '-'}<br>
           <b>รายละเอียดที่แก้ไข:</b> ${job.pmDetail || '-'}
       </div>
    </div>

    <div class="detail-row"><div class="detail-label">ผู้รับมอบงาน</div><div class="detail-value">${job.handover || '-'}</div></div> 
    <div class="detail-row"><div class="detail-label">หมายเหตุ</div><div class="detail-value">${job.remark || '-'}</div></div> 

    <div class="detail-row"><div class="detail-label">ทีมช่าง / ผู้ปฏิบัติงาน</div><div class="detail-value">${techDisplay}</div></div> 
    <div style="margin-top: 25px; padding-top:15px; border-top:2px dashed var(--border);"> 
        <div class="detail-label" style="color:var(--primary); font-size:14px; margin-bottom:10px;"><span class="material-symbols-rounded" style="font-size:18px; vertical-align:text-bottom;">image</span> ภาพก่อนซ่อม</div> 
        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px;">${getImgHtml(job.imgBefore)}</div> 
        <div class="detail-label" style="color:var(--primary); font-size:14px; margin-bottom:10px;"><span class="material-symbols-rounded" style="font-size:18px; vertical-align:text-bottom;">imagesmode</span> ภาพหลังซ่อม</div> 
        <div style="display:flex; gap:12px; flex-wrap:wrap;">${getImgHtml(job.imgAfter)}</div> 
    </div> `; 
    document.getElementById('jobDetailsContent').innerHTML = html; document.getElementById('jobDetailsPage').style.display = 'block'; 
}

function openEditMode() { 
    if(!currentJobData) return; 
    document.getElementById('editJobNumLabel').innerText = "ลำดับที่ #" + currentJobData.displayNum; 
    document.getElementById('editJobNum').value = currentJobData.num; 
    
    let dObj = parseDateSafely(currentJobData.date);
    document.getElementById('edit_date').value = toLocalYYYYMMDD(dObj);
    document.getElementById('edit_shift').value = currentJobData.shift;
    document.getElementById('edit_machine').value = currentJobData.machine;
    
    let ct = currentJobData.callTime ? currentJobData.callTime.toString().split(':') : ['',''];
    let st = currentJobData.startTime ? currentJobData.startTime.toString().split(':') : ['',''];
    let et = currentJobData.endTime ? currentJobData.endTime.toString().split(':') : ['',''];
    
    document.getElementById('edit_callHH').value = ct[0]||''; document.getElementById('edit_callMM').value = ct[1]||'';
    document.getElementById('edit_startHH').value = st[0]||''; document.getElementById('edit_startMM').value = st[1]||'';
    document.getElementById('edit_endHH').value = et[0]||''; document.getElementById('edit_endMM').value = et[1]||'';

    document.getElementById('edit_breakdown').value = currentJobData.breakdown; 
    document.getElementById('edit_cause').value = currentJobData.cause || ""; 
    document.getElementById('edit_solved').value = currentJobData.solved; 
    
    let currentRes = currentJobData.result;
    if(currentRes === 'F') currentRes = 'Finished';
    if(currentRes === 'O') currentRes = 'Ongoing';
    if(currentRes === 'U') currentRes = 'Unfinished';
    document.getElementById('edit_result').value = currentRes || "Finished"; 
    
    document.getElementById('edit_pmUpdate').value = currentJobData.pmUpdate || "";
    document.getElementById('edit_pmCompleted').value = currentJobData.pmCompleted || "";
    document.getElementById('edit_pmInterval').value = currentJobData.pmInterval || "";
    document.getElementById('edit_pmDetail').value = currentJobData.pmDetail || "";

    let isBD = currentJobData.isBreakdown;
    if (isBD === 'Y' || isBD === 'Yes' || isBD === 'YES') isBD = 'Yes';
    else if (isBD === 'N' || isBD === 'No' || isBD === 'NO') isBD = 'No';
    else isBD = 'Yes'; 
    document.getElementById('edit_isBreakdown').value = isBD;
    
    let costVal = parseFloat(currentJobData.cost);
    document.getElementById('edit_cost').value = (!isNaN(costVal)) ? costVal : "";

    document.getElementById('edit_handover').value = currentJobData.handover || "";
    document.getElementById('edit_dept').value = currentJobData.dept || "CO";
    document.getElementById('edit_remark').value = currentJobData.remark || "";

    document.getElementById('edit_editorName').value = "";
    document.getElementById('edit_editReason').value = "";

    clearFiles('edit_before'); clearFiles('edit_after'); 
    
    let techString = currentJobData.tech || ""; let checkboxes = document.querySelectorAll('.edit-tech-cb'); let otherNames = []; 
    checkboxes.forEach(cb => cb.checked = false); document.getElementById('edit_cbOther').checked = false; toggleOtherTech('edit'); 
    let techArray = techString.split(',').map(t => t.trim()); 
    techArray.forEach(tech => { let found = false; checkboxes.forEach(cb => { if(cb.value === tech) { cb.checked = true; found = true; }}); if(!found && tech !== "") otherNames.push(tech); }); 
    if(otherNames.length > 0) { document.getElementById('edit_cbOther').checked = true; toggleOtherTech('edit'); document.getElementById('edit_techOther').value = otherNames.join(', '); } 
    document.getElementById('editJobPage').style.display = 'block'; 
}

async function submitEditForm(event) { 
    event.preventDefault(); 
    var btn = document.getElementById('updateBtn'); btn.innerHTML = '<span class="material-symbols-rounded" style="animation: spin 1s linear infinite;">sync</span> กำลังบันทึก...'; btn.disabled = true; 
    
    let cHH = document.getElementById('edit_callHH').value.replace(/[^0-9]/g, ''); let cMM = document.getElementById('edit_callMM').value.replace(/[^0-9]/g, '');
    let sHH = document.getElementById('edit_startHH').value.replace(/[^0-9]/g, ''); let sMM = document.getElementById('edit_startMM').value.replace(/[^0-9]/g, '');
    let eHH = document.getElementById('edit_endHH').value.replace(/[^0-9]/g, ''); let eMM = document.getElementById('edit_endMM').value.replace(/[^0-9]/g, '');
    
    let timeError = validateTimes(cHH, cMM, sHH, sMM, eHH, eMM);
    if(timeError) { alert("⚠️ ข้อผิดพลาดเวลา: " + timeError + "\nกรุณาตรวจสอบการกรอกเวลาอีกครั้ง"); btn.innerHTML='<span class="material-symbols-rounded">save</span> บันทึกการอัปเดต'; btn.disabled = false; return; }

    let repairMins = getDiffMinutes(sHH, sMM, eHH, eMM); let calculatedRepairTime = formatDuration(repairMins);
    var techArray = []; document.querySelectorAll('.edit-tech-cb:checked').forEach(cb => techArray.push(cb.value)); 
    if(document.getElementById('edit_cbOther').checked) techArray.push(document.getElementById('edit_techOther').value); 
    
    try { 
        var baseEditBefore=[], baseEditAfter=[]; 
        for(let f of editFilesBefore) baseEditBefore.push(await compressImageAsync(f)); 
        for(let f of editFilesAfter) baseEditAfter.push(await compressImageAsync(f)); 
        
        var updateData = { 
            num: document.getElementById('editJobNum').value, date: document.getElementById('edit_date').value, shift: document.getElementById('edit_shift').value, machine: document.getElementById('edit_machine').value,
            callTime: getTimeString('edit_call'), startTime: getTimeString('edit_start'), endTime: getTimeString('edit_end'), repairTime: calculatedRepairTime,
            breakdown: document.getElementById('edit_breakdown').value, cause: document.getElementById('edit_cause').value, solved: document.getElementById('edit_solved').value, result: document.getElementById('edit_result').value, 
            pmUpdate: document.getElementById('edit_pmUpdate').value, pmCompleted: document.getElementById('edit_pmCompleted').value, pmInterval: document.getElementById('edit_pmInterval').value, pmDetail: document.getElementById('edit_pmDetail').value,
            isBreakdown: document.getElementById('edit_isBreakdown').value, cost: document.getElementById('edit_cost').value,
            tech: techArray.join(', '), imgsBefore: baseEditBefore, imgsAfter: baseEditAfter, handover: document.getElementById('edit_handover').value, dept: document.getElementById('edit_dept').value, remark: document.getElementById('edit_remark').value,
            editorName: document.getElementById('edit_editorName').value,
            editReason: document.getElementById('edit_editReason').value
        };
        
        const res = await callAPI("updateReport", updateData); 
        if(res.status === "success") { alert(res.message); clearFiles('edit_before'); clearFiles('edit_after'); document.getElementById('editJobPage').style.display = 'none'; document.getElementById('jobDetailsPage').style.display = 'none'; document.getElementById('loadingScreen').style.display = 'flex'; const newRes = await callAPI("getDashboard", {}); if(newRes.status === "success") { allReportData = newRes.data; renderReportTable(currentPage); } document.getElementById('loadingScreen').style.display = 'none'; } else { alert("เกิดข้อผิดพลาด: " + res.message); } 
    } catch(err) { alert("Error: " + err.message); } btn.innerHTML = '<span class="material-symbols-rounded">save</span> บันทึกการอัปเดต'; btn.disabled = false; 
}

function formatTime(input, maxVal) { let val = input.value.replace(/[^0-9]/g, ''); if(val!==""){let num=parseInt(val,10);if(num>maxVal)val=maxVal.toString();} input.value=val; if(val.length===2){let nxt=input.nextElementSibling;if(nxt&&nxt.tagName==='SPAN')nxt=nxt.nextElementSibling;if(nxt&&nxt.tagName==='INPUT')nxt.focus();} }
function getTimeString(p) { let hElem = document.getElementById(p+'HH'); let mElem = document.getElementById(p+'MM'); if (!hElem || !mElem) return ""; let h = hElem.value.replace(/[^0-9]/g, ''); let m = mElem.value.replace(/[^0-9]/g, ''); if (!h && !m) return ""; return h.padStart(2,'0') + ':' + m.padStart(2,'0'); }

let filesBefore = [], filesAfter = []; let editFilesBefore = [], editFilesAfter = [];
function handleFiles(event, type) { const files = event.target.files; if(files.length===0) return; let targetArray; let thumbDiv; let clearBtn; if(type === 'before') { targetArray = filesBefore; thumbDiv = document.getElementById('thumbBefore'); clearBtn = document.getElementById('clearBefore'); } else if(type === 'after') { targetArray = filesAfter; thumbDiv = document.getElementById('thumbAfter'); clearBtn = document.getElementById('clearAfter'); } else if(type === 'edit_before') { targetArray = editFilesBefore; thumbDiv = document.getElementById('thumbEditBefore'); clearBtn = document.getElementById('clearEditBefore'); } else if(type === 'edit_after') { targetArray = editFilesAfter; thumbDiv = document.getElementById('thumbEditAfter'); clearBtn = document.getElementById('clearEditAfter'); } if (targetArray.length + files.length > 5) { alert("แนบรูปได้สูงสุด 5 ภาพต่อส่วนครับ"); return; } for(let i=0; i<files.length; i++) { targetArray.push(files[i]); let reader = new FileReader(); reader.onload = e => { let wrap=document.createElement('div'); wrap.className='thumb-wrap'; wrap.innerHTML=`<img src="${e.target.result}">`; thumbDiv.appendChild(wrap); }; reader.readAsDataURL(files[i]); } clearBtn.style.display="block"; event.target.value=""; }
function clearFiles(type) { if(type==='before'){filesBefore=[];document.getElementById('thumbBefore').innerHTML="";document.getElementById('clearBefore').style.display="none";} else if(type==='after'){filesAfter=[];document.getElementById('thumbAfter').innerHTML="";document.getElementById('clearAfter').style.display="none";} else if(type==='edit_before'){editFilesBefore=[];document.getElementById('thumbEditBefore').innerHTML="";document.getElementById('clearEditBefore').style.display="none";} else if(type==='edit_after'){editFilesAfter=[];document.getElementById('thumbEditAfter').innerHTML="";document.getElementById('clearEditAfter').style.display="none";} }
function compressImageAsync(file) { return new Promise((resolve) => { var reader=new FileReader(); reader.onload=function(e){ var img=new Image(); img.onload=function(){ var canvas=document.createElement('canvas'); var w=img.width,h=img.height; if(w>h){if(w>1000){h*=1000/w;w=1000;}}else{if(h>1000){w*=1000/h;h=1000;}} canvas.width=w;canvas.height=h; var ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h); resolve(canvas.toDataURL('image/jpeg',0.6).split(',')[1]);}; img.src=e.target.result;}; reader.readAsDataURL(file); }); }
