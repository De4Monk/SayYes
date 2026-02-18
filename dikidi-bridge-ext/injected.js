// injected.js
(function () {
    console.log("!!! DIKIDI BRIDGE: Network Interceptor Injected (FINAL FIX) !!!");

    // --- 1. MAPPING LOGIC (Исправленные цены, но старые имена полей) ---
    const mapDikidiToSupabase = (item, masterIdFallback) => {
        // Dikidi иногда кладет данные в корень, иногда в info
        const info = item.info || item; 
        const payment = info.payment || {};
        
        // --- ЦЕНА (FIXED) ---
        // Ищем везде, приоритет у payment.cost
        const price = parseFloat(payment.cost || info.cost || item.cost || 0);
        const paidAmount = parseFloat(payment.paid || info.paid || 0);

        // --- СТАТУС (FIXED) ---
        let status = 'scheduled'; 
        
        // Логика: если цена > 0 и оплачено >= цены -> completed (paid)
        if (price > 0 && paidAmount >= price) {
            status = 'completed'; // или 'paid', как у тебя в базе настроено
        }
        // Проверка на отмену
        if (item.deleted_datetime || info.deleted_datetime) {
            status = 'cancelled';
        }

        // --- ИГНОР ПЕРЕРЫВОВ ---
        const comment = (info.comment || "").toLowerCase();
        if (price === 0 || comment.includes('перерыв') || comment.includes('break')) {
             return null; // Просто не отправляем перерывы
        }

        // --- ДАННЫЕ УСЛУГИ ---
        let serviceName = "Service";
        if (info.services_title && Array.isArray(info.services_title)) {
            serviceName = info.services_title.join(', ');
        } else if (info.services && Array.isArray(info.services)) {
            serviceName = info.services.map(s => s.title || s.name).join(', ');
        }

        // --- ВРЕМЯ ---
        // Берем begin из корня или time_start из info
        const rawTime = item.begin || info.time_start;
        if (!rawTime) return null;

        const extId = String(item.id || info.appointment_id);
        if (!extId || extId === 'undefined') return null;

        // ВАЖНО: Возвращаем структуру, которую ждет твой RPC
        return {
            external_id: extId,
            client_name: info.client_name || "Unknown",
            client_phone: info.client_phone || null,
            service_name: serviceName,
            service_price: price,
            status: status,
            
            // !!! ВЕРНУЛ ИМЯ ПОЛЯ КАК БЫЛО У ТЕБЯ !!!
            appointment_time: new Date(rawTime).toISOString(),
            
            // !!! ВЕРНУЛ ИМЯ ПОЛЯ КАК БЫЛО У ТЕБЯ !!!
            master_id: String(info.master_id || item.master_id || masterIdFallback)
        };
    };

    // --- 2. RECURSIVE SCANNER (Универсальный поиск) ---
    const scanForAppointments = (obj, results = [], currentMasterId = null) => {
        if (!obj || typeof obj !== 'object') return results;

        // Если ключом является ID мастера (число > 1000), запоминаем его для вложенных записей
        // (Это эвристика, но для Dikidi работает)
        
        // Проверка: это запись? (есть ID, begin, end)
        if ((obj.id || (obj.info && obj.info.appointment_id)) && (obj.begin || (obj.info && obj.info.time_start))) {
            const mapped = mapDikidiToSupabase(obj, currentMasterId);
            if (mapped) {
                results.push(mapped);
            }
            return results;
        }

        // Идем вглубь
        Object.keys(obj).forEach(key => {
            // Если ключ похож на ID мастера, передаем его дальше
            let nextMasterId = currentMasterId;
            if (!isNaN(Number(key)) && Number(key) > 1000 && key.length < 15) {
                nextMasterId = key;
            }

            // Игнорируем ссылки, чтобы не зациклиться
            if (key !== 'company' && key !== 'master_entity' && key !== 'owner') {
                scanForAppointments(obj[key], results, nextMasterId);
            }
        });

        return results;
    };

    // --- 3. RESPONSE PROCESSOR ---
    const processResponse = (url, responseBody) => {
        if (!url.includes('/ajax/journal/api/')) return;

        console.log("Dikidi Bridge Intercepted:", url);

        let data;
        try {
            data = JSON.parse(responseBody);
        } catch (e) {
            return;
        }

        // Запускаем сканер
        const foundAppointments = scanForAppointments(data);

        if (foundAppointments.length === 0) {
            console.log("Dikidi Bridge: No appointments found (or filtered out).");
            return;
        }

        console.log(`Dikidi Bridge: Found ${foundAppointments.length} appointments. Sending...`);

        // Отправляем
        foundAppointments.forEach(appt => {
            console.log(`>>> Sending: ${appt.client_name} (${appt.service_price})`);
            document.dispatchEvent(new CustomEvent('DIKIDI_SYNC_EVENT', { detail: appt }));
        });
    };

    // --- 4. NETWORK OVERRIDES ---
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;

    XHR.open = function (method, url) {
        this._url = url;
        return open.apply(this, arguments);
    };

    XHR.send = function (postData) {
        this.addEventListener('load', function () {
            processResponse(this._url, this.responseText);
        });
        return send.apply(this, arguments);
    };

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch(...args);
        const clone = response.clone();
        const url = response.url;
        
        clone.text().then(body => {
            processResponse(url, body);
        }).catch(err => console.error("Fetch Error", err));

        return response;
    };

})();
