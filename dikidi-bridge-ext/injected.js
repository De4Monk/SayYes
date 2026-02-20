// injected.js
(function () {
    console.log("!!! DIKIDI BRIDGE: Network Interceptor Injected (FUTURE SYNC & AUTO-REFRESH) !!!");

    // --- 1. MAPPING LOGIC (Умный расчет цены + УБИЙЦА ПРИЗРАКОВ) ---
    const mapDikidiToSupabase = (item, masterIdFallback) => {
        const info = item.info || item; 
        const payment = info.payment || {};
        
        let serviceName = "Service";
        if (info.services_title && Array.isArray(info.services_title) && info.services_title.length > 0) {
            serviceName = info.services_title.join(', ');
        } else if (info.services && Array.isArray(info.services) && info.services.length > 0) {
            serviceName = info.services.map(s => s.title || s.name).join(', ');
        }

        let price = parseFloat(payment.cost);
        if (isNaN(price) || price === 0) {
            if (info.services && Array.isArray(info.services)) {
                price = info.services.reduce((sum, s) => sum + parseFloat(s.cost || s.price || 0), 0);
            } else if (info.masters && Array.isArray(info.masters) && info.masters[0]) {
                price = parseFloat(info.masters[0].cost || 0);
            } else {
                price = 0;
            }
        }

        const paidAmount = parseFloat(payment.paid || info.paid || 0);

        let status = 'scheduled'; 
        if (price > 0 && paidAmount >= price) {
            status = 'completed'; 
        }
        if (item.deleted_datetime || info.deleted_datetime) {
            status = 'cancelled';
        }

        const comment = (info.comment || "").toLowerCase();
        const clientName = info.client_name || (info.client && info.client.name) || "";
        
        if (comment.includes('перерыв') || comment.includes('break') || serviceName.toLowerCase().includes('перерыв')) {
             return null; 
        }
        if (!clientName.trim() && price === 0) {
             return null; 
        }

        // 🔥 УБИЙЦА ПРИЗРАКОВ: Если нет услуги и нет цены - это технический блок Dikidi. Скипаем!
        if (serviceName === 'Service' && price === 0) {
            return null;
        }

        const rawTime = item.begin || info.time_start;
        if (!rawTime) return null;

        const extId = String(info.appointment_id || item.appointment_id || info.id || item.id);
        if (!extId || extId === 'undefined' || extId === 'null') return null;

        return {
            external_id: extId,
            client_name: clientName || "Unknown",
            client_phone: info.client_phone || null,
            service_name: serviceName,
            service_price: price,
            status: status,
            appointment_time: new Date(rawTime).toISOString(),
            master_id: String(info.master_id || item.master_id || masterIdFallback)
        };
    };    

    // --- 2. RECURSIVE SCANNER (Универсальный поиск) ---
    const scanForAppointments = (obj, results = [], currentMasterId = null) => {
        if (!obj || typeof obj !== 'object') return results;

        // Проверка: это запись? (есть ID, begin, info)
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

    // --- 3. RESPONSE PROCESSOR (Умная склейка с нормализацией имен) ---
    const processResponse = (url, responseBody) => {
        if (!url.includes('/ajax/journal/api/')) return;

        let data;
        try {
            data = JSON.parse(responseBody);
        } catch (e) {
            return;
        }

        const rawAppointments = scanForAppointments(data);
        if (rawAppointments.length === 0) return;

        const mergedAppointments = {};
        
        rawAppointments.forEach(appt => {
            const dateStr = appt.appointment_time.split('T')[0];
            
            // 🔥 НОРМАЛИЗАЦИЯ ИМЕНИ: "Алеф Александра" -> "александра алеф" (сортировка по алфавиту)
            const normalizedName = appt.client_name
                .trim()
                .toLowerCase()
                .split(/\s+/)  // разбиваем по пробелам
                .sort()        // сортируем слова по алфавиту
                .join('_');    // склеиваем обратно

            // Теперь уникальный ключ не зависит от порядка слов в имени!
            const uniqueKey = `${normalizedName}_${dateStr}`;

            if (!mergedAppointments[uniqueKey]) {
                mergedAppointments[uniqueKey] = { ...appt };
            } else {
                const existing = mergedAppointments[uniqueKey];

                if (appt.service_price > existing.service_price) {
                    existing.service_price = appt.service_price;
                    existing.external_id = appt.external_id;
                }
                if (appt.status === 'completed' || appt.status === 'paid') {
                    existing.status = appt.status;
                }
                if (new Date(appt.appointment_time) < new Date(existing.appointment_time)) {
                    existing.appointment_time = appt.appointment_time;
                }
                if (appt.service_name && appt.service_name !== 'Service' && !existing.service_name.includes(appt.service_name)) {
                    existing.service_name = existing.service_name === 'Service' 
                        ? appt.service_name 
                        : existing.service_name + ' + ' + appt.service_name;
                }
                // На всякий случай сохраняем самый длинный/красивый вариант оригинального имени
                if (appt.client_name.length > existing.client_name.length) {
                    existing.client_name = appt.client_name;
                }
            }
        });

        const foundAppointments = Object.values(mergedAppointments);

        console.log(`Dikidi Bridge: Found ${foundAppointments.length} CLEAN visits. Sending...`);

        foundAppointments.forEach(appt => {
            console.log(`>>> Sending: ${appt.client_name} (${appt.service_price}) [${appt.appointment_time}]`);
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

    // --- 5. АВТОПИЛОТ (Auto-Refresh) ---
    // Каждые 10 минут (600000 мс) тихонько обновляем страницу журнала.
    // Это генерирует новые AJAX-запросы, которые перехватывает наш код.
    setInterval(() => {
        console.log("Dikidi Bridge: Auto-refreshing to fetch latest schedule...");
        if (window.location.href.includes('journal')) {
             window.location.reload();
        }
    }, 600000); 

})();
