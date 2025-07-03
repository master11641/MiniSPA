(function ($) {
    if (!history.state) {
        history.replaceState({
            xhrUrl: window.location.href,
            method: 'GET',
            target: '.main-content',
            popup: false,
            title: document.title,
            width: '1000px'
        }, '', window.location.href);
    }

    $(document).on('click', '[data-xhr]', async function (e) {
        e.preventDefault();

        const el = $(this);
        const url = el.data('xhr');
        const method = (el.data('method') || 'GET').toUpperCase();
        const target = el.data('target');
        const popup = el.data('popup') === true || el.data('popup') === "true";
        const title = el.data('title') || 'جزئیات';
        const width = el.data('width') || '600px';
        const confirmMsg = el.data('confirm');
        const spinnerSelector = el.data('spinner');
        const onload = el.data('onload');
        const useForm = el.data('form') === true || el.data('form') === "true";
        const refreshSelector = el.data('refresh');
        const shouldPushState = el.data('push') === true || el.data('push') === "true";

        if (!url) return console.warn('data-xhr نیاز به URL دارد.');
        if (confirmMsg && !confirm(confirmMsg)) return;

        if (spinnerSelector) $(spinnerSelector).show();
        else $(".xhr-loading").show();

        try {
            let body = null;
            if (useForm) {
                const form = el.closest('form')[0];
                if (!form) return alert("فرم مرتبط یافت نشد.");
                const formData = new FormData(form);
                body = Object.fromEntries(formData.entries());
            } else {
                const rawPayload = el.data('payload');
                if (rawPayload) {
                    try {
                        body = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
                    } catch (err) {
                        console.error("خطا در تبدیل payload:", err);
                    }
                }
            }

            const fetchOptions = {
                method,
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Partial': 'true'
                }
            };
            if (method !== 'GET') fetchOptions.body = JSON.stringify(body || {});

            const response = await fetch(url, fetchOptions);
            const contentType = response.headers.get("Content-Type") || '';
            let result;

            try {
                result = contentType.includes("application/json")
                    ? await response.json()
                    : await response.text();
            } catch {
                result = await response.text();
            }

            if (!response.ok) {
                console.error("خطا در پاسخ:", result);
                return alert("خطا در ارتباط با سرور.");
            }

            let contentHtml = typeof result === "string"
                ? result.trim() || "<div>هیچ محتوایی وجود ندارد.</div>"
                : "<pre>" + JSON.stringify(result, null, 2) + "</pre>";

            const tempWrapper = $("<div>").append($.parseHTML(contentHtml, document, true));
            const visualContent = tempWrapper.contents().not("script");

            if (popup && window.kendo) {
                const popupContainer = $("<div/>").append(visualContent);
                popupContainer.kendoWindow({
                    title,
                    modal: true,
                    width,
                    close: function () {
                        this.destroy();
                    }
                }).data("kendoWindow").center().open();
            } else if (target) {
                $(target).html(contentHtml);
            }

            tempWrapper.find("script").each(function () {
                const scriptContent = $(this).text();
                try {
                    const wrapped = `(function(){ ${scriptContent} })();`;
                    const scriptTag = document.createElement('script');
                    scriptTag.text = wrapped;
                    document.body.appendChild(scriptTag);
                } catch (e) {
                    console.error("اسکریپت:", e);
                }
            });

            if (refreshSelector) {
                const grid = $(refreshSelector).data("kendoGrid");
                if (grid) grid.dataSource.read();
                else $(refreshSelector).load(location.href + " " + refreshSelector + " > *");
            }

            if (onload && typeof window[onload] === 'function') {
                window[onload](result);
            }

            if (shouldPushState) {
                const newUrl = el.attr('href') || url;
                history.pushState({
                    xhrUrl: url,
                    method,
                    target,
                    popup,
                    title,
                    width
                }, '', newUrl);

                if (title) document.title = title;
            }

        } catch (error) {
            console.error("خطای کلی:", error);
            alert("خطا در ارتباط با سرور.");
        } finally {
            if (spinnerSelector) $(spinnerSelector).hide();
            else $(".xhr-loading").hide();
        }
    });

    window.onpopstate = function (event) {
        const state = event.state;
        if (!state || !state.xhrUrl) return;

        $(".xhr-loading").show();

        setTimeout(() => {
            fetch(state.xhrUrl, {
                method: state.method || 'GET',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Partial': 'true'
                }
            }).then(async res => {
                const contentType = res.headers.get("Content-Type") || '';
                let html = await (contentType.includes("application/json") ? res.json() : res.text());

                let contentHtml = typeof html === "string"
                    ? html.trim() || "<div>هیچ محتوایی وجود ندارد.</div>"
                    : "<pre>" + JSON.stringify(html, null, 2) + "</pre>";

                const tempWrapper = $("<div>").append($.parseHTML(contentHtml, document, true));
                const visualContent = tempWrapper.contents().not("script");

                if (state.popup && window.kendo) {
                    $("<div/>").append(visualContent).kendoWindow({
                        title: state.title || 'جزئیات',
                        modal: true,
                        width: state.width || "600px",
                        close: function () {
                            this.destroy();
                        }
                    }).data("kendoWindow").center().open();
                } else if (state.target) {
                    $(state.target).html(contentHtml);
                }

                tempWrapper.find("script").each(function () {
                    const scriptContent = $(this).text();
                    try {
                        const wrapped = `(function(){ ${scriptContent} })();`;
                        const scriptTag = document.createElement('script');
                        scriptTag.text = wrapped;
                        document.body.appendChild(scriptTag);
                    } catch (e) {
                        console.error("اسکریپت popstate:", e);
                    }
                });

                if (state.title) {
                    document.title = state.title;
                }

            }).catch(err => console.error("popstate error:", err)).finally(() => {
                $(".xhr-loading").hide();
            });
        }, 50);
    };
})(jQuery);
