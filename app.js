const webAppUrl = "https://script.google.com/macros/s/AKfycbypsSbSP194UABFRsVsrF0XN8OaeZK7WUj-3triDEUem6gOO2QTqVl8r4-OFGv0bNHm/exec";

let allFetched = [];
let sedeData = [];
let autoridadesData = [];
let currentModalData = [];
let chartA, chartF;
let selectedDateGlobal = "";
let lastNacionalDate = "";
let fp;

document.addEventListener('DOMContentLoaded', () => {
    const savedPin = sessionStorage.getItem('authPin');
    const pinInput = document.getElementById('pin-input');

    if (pinInput) {
        pinInput.addEventListener('keypress', e => { if (e.key === 'Enter') checkAuth(); });
    }

    if (savedPin) {
        init(savedPin).then(() => {
            document.getElementById('auth-overlay').style.display = 'none';
            document.getElementById('app').style.opacity = '1';
        }).catch(() => {
            showAuthOverlay();
        });
    } else {
        showAuthOverlay();
    }
});

function showAuthOverlay() {
    document.getElementById('auth-overlay').style.display = 'flex';
    document.getElementById('app').style.opacity = '0';
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('collapsed');
    document.getElementById('menu-btn').style.display = sb.classList.contains('collapsed') ? 'flex' : (window.innerWidth > 768 ? 'none' : 'flex');
}

function toggleMobileStates() {
    document.getElementById('states-wrapper').classList.toggle('show');
}

function logout() {
    sessionStorage.removeItem('authPin');
    const pinInput = document.getElementById('pin-input');
    if (pinInput) pinInput.value = '';
    
    document.getElementById('app').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('auth-overlay').style.display = 'flex';
    }, 600);
    
    if (window.innerWidth <= 768) {
        const statesWrapper = document.getElementById('states-wrapper');
        if (statesWrapper) statesWrapper.classList.remove('show');
    }
}

function showVerify(state, title, sub) {
    const overlay = document.getElementById('verify-overlay');
    const card = document.getElementById('verify-card');
    const iconI = document.getElementById('verify-icon-i');
    if (!overlay || !card || !iconI) return;
    
    card.className = 'verify-card state-' + state;
    const icons = { pending: 'fa-sync-alt', success: 'fa-check', error: 'fa-times' };
    iconI.className = 'fas ' + icons[state];
    document.getElementById('verify-title').textContent = title;
    document.getElementById('verify-sub').innerHTML = sub;
    overlay.classList.add('active');
}

function hideVerify() { 
    const overlay = document.getElementById('verify-overlay');
    if (overlay) overlay.classList.remove('active'); 
}

async function checkAuth() {
    const pinInput = document.getElementById('pin-input').value;
    if (!pinInput) { alert("Código requerido"); return; }
    showVerify('pending', 'Verificando credenciales', 'Por favor espere...');
    try {
        await init(pinInput);
        sessionStorage.setItem('authPin', pinInput);
        showVerify('success', 'Acceso concedido', 'Bienvenido al sistema');
        setTimeout(() => { hideVerify(); document.getElementById('auth-overlay').style.display = 'none'; document.getElementById('app').style.opacity = '1'; }, 900);
    } catch (error) {
        showVerify('error', 'Acceso denegado', 'Credenciales invalidas');
        setTimeout(() => { hideVerify(); }, 2000);
    }
}

function cleanNum(val) {
    if (!val) return 0;
    let n = parseFloat(String(val).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
    return isNaN(n) ? 0 : n;
}

function getUltimaFecha(dataArr, campoFecha) {
    const fechas = [...new Set(dataArr.map(d => d[campoFecha]))].filter(f => f);
    return fechas.sort((a, b) => {
        const da = a.split('/'); const db = b.split('/');
        return new Date(db[2], db[1]-1, db[0]) - new Date(da[2], da[1]-1, da[0]);
    })[0] || "";
}

async function init(pin) {
    const res = await fetch(`${webAppUrl}?pass=${pin}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    allFetched = data.nacional.filter(d => d['ESTADO'] && !['TOTAL', 'TOTALES'].includes(String(d['ESTADO']).toUpperCase().trim()));
    sedeData = data.sede;
    autoridadesData = data.autoridades || []; 

    const fechasDisponibles = [...new Set(allFetched.map(d => d['FECHA']))].filter(f => f).map(f => { const [d, m, y] = f.split('/'); return new Date(y, m - 1, d); });

    fp = flatpickr("#global-date-filter", {
        locale: "es", dateFormat: "d/m/Y", maxDate: new Date(), enable: fechasDisponibles,
        onChange: function(selectedDates, dateStr) { if (dateStr) handleDateChange(dateStr); }
    });

    lastNacionalDate = getUltimaFecha(allFetched, 'FECHA');
    selectedDateGlobal = lastNacionalDate;
    if (selectedDateGlobal && fp) fp.setDate(selectedDateGlobal);

    renderSidebar();
    resetFilter(document.getElementById('btn-nacional'));
}

function renderSidebar() {
    const list = document.getElementById('sidebar-list');
    
    let html = `
        <div class="nav-main-items">
            <div class="state-item" id="btn-autoridades" onclick="renderAutoridades(this)"><span><i class="fas fa-users-cog"></i> AUTORIDADES</span></div>
            <div class="state-item" id="btn-sede" onclick="renderSedeCentral(this)"><span><i class="fas fa-building"></i> SEDE</span></div>
            <div class="state-item active" id="btn-nacional" onclick="resetFilter(this)"><span><i class="fas fa-globe-americas"></i> NACIONAL</span></div>
            <div class="state-item mobile-states-btn" onclick="toggleMobileStates()"><span><i class="fas fa-list-ul"></i> ESTADOS</span></div>
            <div class="state-item text-danger mobile-logout-btn" onclick="logout()"><span><i class="fas fa-sign-out-alt"></i> SALIR</span></div>
        </div>
        
        <div class="states-wrapper" id="states-wrapper"></div>
        
        <div class="sidebar-footer-btn desktop-logout-btn">
            <div class="state-item text-danger" onclick="logout()"><span><i class="fas fa-sign-out-alt"></i> SALIR</span></div>
        </div>
    `;
    list.innerHTML = html;

    const statesWrapper = document.getElementById('states-wrapper');
    [...new Set(allFetched.map(d => d['ESTADO']))].sort().forEach(s => {
        const btn = document.createElement('div');
        btn.className = 'state-item sub-state';
        btn.dataset.stateName = s; 
        btn.innerHTML = `<span><i class="fas fa-map-marker-alt"></i> ${s}</span>`;
        btn.onclick = () => {
            document.querySelectorAll('.state-item').forEach(i => i.classList.remove('active'));
            btn.classList.add('active');
            restoreNacionalDate();
            updateDashboard(allFetched.filter(r => r['ESTADO'] === s), s, false);
            
            if (window.innerWidth <= 768) {
                statesWrapper.classList.remove('show');
            }

            const mainScroll = document.getElementById('main-scroll');
            if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        statesWrapper.appendChild(btn);
    });
}

function renderAutoridades(el) {
    const mainScroll = document.getElementById('main-scroll');
    if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('.state-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    
    if (window.innerWidth <= 768) document.getElementById('states-wrapper').classList.remove('show');

    document.getElementById('full-nacional-content').style.display = "none";
    document.getElementById('sede-extra-content').style.display = "none";
    document.getElementById('autoridades-content').style.display = "block";
    
    document.getElementById('sec-indicadores').style.display = "none";
    document.getElementById('grid-criticos').style.display = "none";
    
    document.getElementById('cal-box').style.display = 'none';
    document.getElementById('view-title').innerText = "AUTORIDADES";
    document.getElementById('date-info').innerText = "INTENDENCIA DE PROTECCIÓN DE LOS DERECHOS SOCIOECONÓMICOS";

    const container = document.getElementById('autoridades-list');
    container.innerHTML = "";

    const limit = Math.min(autoridadesData.length, 5);
    const fallbackImg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2285%22 height=%22105%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23c8dbf0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 fill=%22%231e3a8a%22 font-family=%22sans-serif%22 font-size=%2214%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EFOTO%3C/text%3E%3C/svg%3E";
    
    for(let i=0; i<limit; i++) {
        const row = autoridadesData[i];
        const keys = Object.keys(row);
        if(keys.length < 2) continue;

        const nombre = row[keys[0]] || "";
        const cargo = row[keys[1]] || "";
        
        let urlFoto = "";
        Object.values(row).forEach(val => {
            if (typeof val === 'string' && (val.includes('drive.google.com') || val.includes('http'))) {
                urlFoto = val;
            }
        });
        
        let finalUrl = urlFoto || fallbackImg;
        const driveMatch = urlFoto.match(/[-\w]{25,}/);
        if(driveMatch) {
            finalUrl = `https://drive.google.com/uc?export=view&id=${driveMatch[0]}`;
        }

        container.innerHTML += `
            <div class="autoridad-card">
                <img src="${finalUrl}" alt="Foto ${nombre}" onerror="this.onerror=null; this.src='${fallbackImg}'" referrerpolicy="no-referrer">
                <div class="autoridad-info">
                    <div class="autoridad-nombre">${nombre}</div>
                    <div class="autoridad-cargo">${cargo}</div>
                </div>
            </div>
        `;
    }
}

function restoreNacionalDate() {
    if (lastNacionalDate && selectedDateGlobal !== lastNacionalDate) {
        selectedDateGlobal = lastNacionalDate;
        if (fp) fp.setDate(selectedDateGlobal, false);
    }
}

function renderSedeCentral(el) {
    const mainScroll = document.getElementById('main-scroll');
    if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('.state-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    
    if (window.innerWidth <= 768) document.getElementById('states-wrapper').classList.remove('show');

    document.getElementById('view-title').innerText = "SEDE CENTRAL";
    document.getElementById('full-nacional-content').style.display = "none";
    document.getElementById('sede-extra-content').style.display = "block";
    document.getElementById('autoridades-content').style.display = "none"; 
    
    document.getElementById('sec-indicadores').style.display = "flex";
    document.getElementById('grid-criticos').style.display = "grid";
    document.getElementById('sec-indicadores').innerText = "Resumen de Gestion Sede";
    document.getElementById('cal-box').style.display = 'none';

    const ultimaSede = getUltimaFecha(sedeData, 'FECHA');
    if (ultimaSede) { selectedDateGlobal = ultimaSede; document.getElementById('date-info').innerText = "CORTE AL: " + selectedDateGlobal; }

    const filteredSede = sedeData.filter(r => r['FECHA'] === selectedDateGlobal);
    const conteoSujetos = {}, conteoTipologia = {};
    filteredSede.forEach(r => {
        const keys = Object.keys(r);
        const s = r[keys[5]]; if (s && s.trim() !== "") conteoSujetos[s] = (conteoSujetos[s] || 0) + 1;
        const t = r[keys[4]]; if (t && t.trim() !== "") conteoTipologia[t] = (conteoTipologia[t] || 0) + 1;
    });

    const tipologySedeCont = document.getElementById('tipology-container-sede');
    tipologySedeCont.innerHTML = "";
    const maxTipos = Math.max(...Object.values(conteoTipologia), 1);
    Object.entries(conteoTipologia).sort((a, b) => b[1] - a[1]).forEach(([nombre, valor]) => {
        tipologySedeCont.innerHTML += `<div class="ranking-item"><div class="ranking-header"><span>${nombre}</span><span>${valor}</span></div><div class="bar-container"><div class="bar-fill" style="width:${(valor / maxTipos) * 100}%"></div></div></div>`;
    });

    let topSujeto = "N/A", maxD = 0;
    for (let s in conteoSujetos) if (conteoSujetos[s] > maxD) { maxD = conteoSujetos[s]; topSujeto = s; }

    const topData = filteredSede.filter(r => r[Object.keys(r)[5]] === topSujeto);
    const countEst = (est) => topData.filter(r => String(r['ESTATUS']).toUpperCase().trim() === est).length;
    const countAll = (est) => filteredSede.filter(r => r['ESTATUS'] && r['ESTATUS'].toUpperCase().trim() === est).length;

    const createCard = (l, v, i, c, status) => `
        <div class="card" onclick="showSedeDetail('${status}')" style="cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:center"><span class="card-label">${l}</span><i class="fas ${i}" style="color:${c}; font-size:1rem;"></i></div>
            <div class="card-val" style="color:${c}">${v.toLocaleString()}</div>
            <div style="font-size:0.6rem; color:var(--muted); text-align:right; margin-top:2px;">Ver detalle casos <i class="fas fa-chevron-right"></i></div>
        </div>`;

    document.getElementById('grid-criticos').innerHTML =
        createCard("Cerrada",    countAll("CERRADA"),    "fa-folder-check", "var(--success)", "CERRADA") +
        createCard("En Proceso", countAll("EN PROCESO"), "fa-spinner",      "var(--accent)",  "EN PROCESO") +
        createCard("Sin Atender",countAll("SIN ATENDER"),"fa-clock",        "var(--danger)",  "SIN ATENDER") +
        createCard("Desestimada",countAll("DESESTIMADA"),"fa-ban",          "var(--muted)",   "DESESTIMADA") +
        `<div class="card" style="grid-column:1/-1; border-left:4px solid var(--purple);">
            <span class="card-label">Sujeto con mayor incidencia</span>
            <div style="font-size:1.05rem; font-weight:800; color:var(--primary); margin:4px 0;">${topSujeto}</div>
            <div style="display:flex; gap:14px; margin-top:4px; flex-wrap:wrap;">
                <div><span class="card-label">Sin Atender</span><div style="font-size:1.15rem;font-weight:800;color:var(--danger)">${countEst('SIN ATENDER')}</div></div>
                <div><span class="card-label">En Proceso</span><div style="font-size:1.15rem;font-weight:800;color:var(--accent)">${countEst('EN PROCESO')}</div></div>
                <div><span class="card-label">Desestimada</span><div style="font-size:1.15rem;font-weight:800;color:var(--muted)">${countEst('DESESTIMADA')}</div></div>
                <div><span class="card-label">Cerrada</span><div style="font-size:1.15rem;font-weight:800;color:var(--success)">${countEst('CERRADA')}</div></div>
                <div style="margin-left:auto;text-align:right;"><span class="card-label">Total</span><div style="font-size:1.15rem;font-weight:800;">${maxD}</div></div>
            </div>
        </div>`;
}

function updateDashboard(data, title, isNational = false) {
    const mainScroll = document.getElementById('main-scroll');
    if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById('full-nacional-content').style.display = "block";
    document.getElementById('sede-extra-content').style.display = "none";
    document.getElementById('autoridades-content').style.display = "none"; 
    
    document.getElementById('sec-indicadores').style.display = "flex";
    document.getElementById('grid-criticos').style.display = "grid";
    document.getElementById('sec-indicadores').innerText = "Indicadores a destacar";
    document.getElementById('cal-box').style.display = 'flex';

    if (!selectedDateGlobal || ![...new Set(data.map(d => d['FECHA']))].includes(selectedDateGlobal)) {
        selectedDateGlobal = getUltimaFecha(data, 'FECHA');
        if (fp) fp.setDate(selectedDateGlobal, false);
    }
    if (isNational) lastNacionalDate = selectedDateGlobal;

    const fData = data.filter(d => d['FECHA'] === selectedDateGlobal);
    let s = {};
    ["REGISTROS RECIBIDOS","ATENDIDAS","POR ATENDER","NUEVO","DENUNCIAS ADMITIDAS","PROCESO CULMINADO","CERRADO","INSPECCIONADO","PROCESO CONCILIATORIO","POR APROBAR FISCALIZACIÓN","POR ASIGNAR FISCAL","CON FISCAL ASIGNADO","ARRENDAMIENTO COMERCIAL","BIENES","CONDOMINIOS COMERCIALES","MATRICULA ESCOLAR","SERVICIOS"]
        .forEach(c => s[c] = fData.reduce((acc, curr) => acc + cleanNum(curr[c]), 0));

    document.getElementById('view-title').innerText = title;
    document.getElementById('date-info').innerText = "CORTE AL: " + selectedDateGlobal;

    const config = (l, d, c) => ({ type: 'doughnut', data: { labels: l, datasets: [{ data: d, backgroundColor: c, borderWidth: 0 }] }, options: { cutout: '72%', plugins: { legend: { position: 'bottom' } } } });
    if (chartA) chartA.destroy(); if (chartF) chartF.destroy();
    chartA = new Chart(document.getElementById('chartAtencion'), config(['Atendidas','Por Atender'], [s["ATENDIDAS"], s["POR ATENDER"]], ['#22c55e','#ef4444']));
    chartF = new Chart(document.getElementById('chartFiscales'), config(['Por Asignar','Asignado'], [s["POR ASIGNAR FISCAL"], s["CON FISCAL ASIGNADO"]], ['#f97316','#059669']));

    document.getElementById('tipology-container').innerHTML = "";
    const rTotal = ["ARRENDAMIENTO COMERCIAL","BIENES","CONDOMINIOS COMERCIALES","MATRICULA ESCOLAR","SERVICIOS"].reduce((acc, r) => acc + (s[r] || 0), 0);
    ["ARRENDAMIENTO COMERCIAL","BIENES","CONDOMINIOS COMERCIALES","MATRICULA ESCOLAR","SERVICIOS"].forEach(r => {
        document.getElementById('tipology-container').innerHTML += `<div class="ranking-item"><div class="ranking-header"><span>${r}</span><span>${(s[r]||0).toLocaleString()}</span></div><div class="bar-container"><div class="bar-fill" style="width:${rTotal>0?((s[r]||0)/rTotal*100):0}%"></div></div></div>`;
    });

    const cC = (l, v, i, c) => `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span class="card-label">${l}</span><i class="fas ${i}" style="color:${c};"></i></div><div class="card-val" style="color:${c}">${Math.floor(v).toLocaleString()}</div></div>`;
    
    document.getElementById('grid-criticos').innerHTML = cC("Recibidos", s["REGISTROS RECIBIDOS"], "fa-inbox", "var(--primary)") + cC("Admitidas", s["DENUNCIAS ADMITIDAS"], "fa-file-signature", "var(--purple)") + cC("Atendidas", s["ATENDIDAS"], "fa-check-circle", "var(--success)") + cC("Por Atender", s["POR ATENDER"], "fa-clock", "var(--warning)");
    document.getElementById('grid-estatus').innerHTML = cC("Nuevas", s["NUEVO"], "fa-certificate", "#3b82f6") + cC("Culminadas", s["PROCESO CULMINADO"], "fa-flag-checkered", "#22c55e") + cC("Cerrado", s["CERRADO"], "fa-archive", "#1e293b");
    document.getElementById('grid-procesos').innerHTML = cC("Inspeccionado", s["INSPECCIONADO"], "fa-search", "#06b6d4") + cC("Conciliacion", s["PROCESO CONCILIATORIO"], "fa-handshake", "#f59e0b") + cC("Por Aprobar Fiscalización", s["POR APROBAR FISCALIZACIÓN"], "fa-clipboard-check", "#ec4899");
    document.getElementById('grid-fiscales').innerHTML = cC("Por Asignar Fiscal", s["POR ASIGNAR FISCAL"], "fa-user-plus", "#f97316") + cC("Fiscal Asignado", s["CON FISCAL ASIGNADO"], "fa-user-tie", "#059669");

    document.getElementById('ranking-section').style.display = isNational ? "block" : "none";
    if (isNational) {
        document.getElementById('ranking-container').innerHTML = [...new Set(fData.map(d => d['ESTADO']))].map(st => { const row = fData.find(r => r['ESTADO'] === st); let p = row && row['ATENCIÓN %'] ? cleanNum(row['ATENCIÓN %']) : 0; if(p > 0 && p < 1) p *= 100; return { st, p }; }).sort((a,b) => b.p - a.p).slice(0,10).map(item => `<div class="ranking-item"><div class="ranking-header"><span>${item.st}</span><span>${item.p.toFixed(1)}%</span></div><div class="bar-container"><div class="bar-fill" style="width:${item.p}%; background: linear-gradient(90deg, #1e3a8a, #8b5cf6);"></div></div></div>`).join('');
    }
}

function resetFilter(el) {
    const mainScroll = document.getElementById('main-scroll');
    if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('.state-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active'); restoreNacionalDate(); updateDashboard(allFetched, "VENEZUELA", true);
    
    if (window.innerWidth <= 768) document.getElementById('states-wrapper').classList.remove('show');
}

function handleDateChange(nuevaFecha) {
    selectedDateGlobal = nuevaFecha; const active = document.querySelector('.state-item.active'); if (!active) return;
    if (active.id !== 'btn-sede' && active.id !== 'btn-autoridades') lastNacionalDate = nuevaFecha;
    if (active.id === 'btn-nacional') updateDashboard(allFetched, "VENEZUELA", true);
    else if (active.id === 'btn-sede') renderSedeCentral(active);
    else if (active.id === 'btn-autoridades') renderAutoridades(active);
    else updateDashboard(allFetched.filter(r => r['ESTADO'] === active.dataset.stateName), active.dataset.stateName, false);
}

function showSedeDetail(estatus) {
    currentModalData = sedeData.filter(r => r['FECHA'] === selectedDateGlobal && r['ESTATUS'] && r['ESTATUS'].toUpperCase().trim() === estatus.toUpperCase());
    document.getElementById('modal-title').innerText = "ESTATUS: " + estatus;
    
    const checklistSujetos = document.getElementById('modal-checklist-sujetos');
    const checklistDenuncias = document.getElementById('modal-checklist-denuncias');
    const body = document.getElementById('modal-body');
    
    checklistSujetos.innerHTML = ""; checklistDenuncias.innerHTML = "";
    body.innerHTML = "<p style='text-align:center;padding:40px 20px;color:var(--muted);font-size:0.85rem;'>Seleccione un sujeto y posteriormente un caso.</p>";

    if (currentModalData.length === 0) {
        body.innerHTML = "<p style='text-align:center;padding:40px 20px;color:var(--muted);font-size:0.85rem;'>No hay registros disponibles para este estatus.</p>";
    } else {
        const sujetosMap = {};
        currentModalData.forEach(item => {
            const sujetoName = item[Object.keys(item)[5]] || "SIN SUJETO DEFINIDO";
            if (!sujetosMap[sujetoName]) sujetosMap[sujetoName] = [];
            sujetosMap[sujetoName].push(item);
        });

        Object.keys(sujetosMap).forEach(sujetoName => {
            const btn = document.createElement('div');
            btn.className = 'check-item';
            btn.innerText = `${sujetoName} (${sujetosMap[sujetoName].length})`;
            btn.onclick = () => {
                document.querySelectorAll('#modal-checklist-sujetos .check-item').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                showDenunciasForSujeto(sujetosMap[sujetoName]);

                if(window.innerWidth <= 768) {
                    setTimeout(() => document.getElementById('col-denuncias').scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                }
            };
            checklistSujetos.appendChild(btn);
        });
    }
    document.getElementById('modal-overlay').style.display = 'flex';
}

function showDenunciasForSujeto(denunciasArray) {
    const checklistDenuncias = document.getElementById('modal-checklist-denuncias');
    const body = document.getElementById('modal-body');
    checklistDenuncias.innerHTML = "";
    body.innerHTML = "<p style='text-align:center;padding:40px 20px;color:var(--muted);font-size:0.85rem;'>Seleccione un caso para ver su detalle en la siguiente sección.</p>";

    denunciasArray.forEach((item, index) => {
        const keys = Object.keys(item);
        let buttonLabel = `Caso #${index + 1}`;
        const posibleColumnaID = keys.find(k => k.toUpperCase().includes('NRO') || k.toUpperCase().includes('CÓDIGO') || k.toUpperCase().includes('DENUNCIA') || k.toUpperCase().includes('RECLAMO') || k.toUpperCase().includes('ID'));
        if (posibleColumnaID && item[posibleColumnaID]) buttonLabel = `${posibleColumnaID}: ${item[posibleColumnaID]}`;

        const btn = document.createElement('div');
        btn.className = 'check-item check-item-alt';
        btn.innerText = buttonLabel;
        btn.onclick = () => {
            document.querySelectorAll('#modal-checklist-denuncias .check-item').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            renderModalRowByVal(item);

            if(window.innerWidth <= 768) {
                setTimeout(() => document.getElementById('col-detalles').scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }
        };
        checklistDenuncias.appendChild(btn);
    });
}

function renderModalRowByVal(item) {
    let html = '<div style="background:#fff; border-radius:12px; padding:20px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.05);"><div class="detail-grid">';
    
    for (let key in item) {
        const uKey = key.toUpperCase().trim();
        if (item[key] && uKey !== 'ITEM' && uKey !== 'FECHA') {
            html += `<div class="detail-item">
                        <div style="font-size:0.62rem; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">${key}</div>
                        <div style="font-size:0.85rem; font-weight:600; color:var(--text);">${item[key]}</div>
                     </div>`;
        }
    }
    
    document.getElementById('modal-body').innerHTML = html + '</div></div>';
}

function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }
