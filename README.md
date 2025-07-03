<div dir="rtl">

# 📄 مستندات کامل افزونه `MiniSPA.js`

## 📌 معرفی افزونه

`MiniSPA.js` یک افزونه ساده و قدرتمند بر پایه `jQuery` است که قابلیت‌هایی مانند:

- ارسال درخواست‌های AJAX به صورت خودکار با استفاده از `data-` attributes
- نمایش محتوای دریافت‌شده در popup یا بخش خاصی از صفحه
- مدیریت خودکار تاریخچه مرورگر (Back / Forward)
- پشتیبانی از ارسال فرم، تاییدیه، بارگذاری اسپینر و ...
- اجرای اسکریپت‌های دریافتی در پاسخ
- کنترل لایه‌بندی سمت سرور با هدر `X-Partial`

را فراهم می‌کند، بدون نیاز به استفاده از فریم‌ورک‌های سنگین مانند React یا Vue.

> 🔧 این افزونه مناسب پروژه‌های مبتنی بر ASP.NET Core MVC است که از View-based Rendering استفاده می‌کنند ولی به امکانات تعاملی و dynamic نیاز دارند.

---

## 🎯 نحوه استفاده کلی

### 1. نمایش در پنجره Popup (همراه تغییر آدرس مرورگر)

```html
<a
  href="/news/edit"
  data-xhr="/news/edit"
  data-title="افزودن خبر جدید"
  data-popup="true"
  data-width="800px"
  data-push="true"
>
  افزودن خبر
</a>
```

### 2. نمایش در بخش خاصی از صفحه (بدون Popup، همراه با تغییر آدرس)

```html
<a
  href="/news/list"
  data-xhr="/news/list"
  data-target=".main-content"
  data-push="true"
>
  لیست خبرها
</a>
```

### 3. نمایش فقط در DOM بدون تغییر آدرس (مثلاً در تب یا کارت خاص)

```html
<a href="/news/summary" data-xhr="/news/summary" data-target="#summary-section">
  خلاصه خبر
</a>
```

### 4. ارسال داده فرم و دریافت پاسخ در Popup

```html
<button
  data-xhr="/news/create"
  data-method="POST"
  data-title="ایجاد خبر جدید"
  data-popup="true"
  data-form="true"
>
  ذخیره
</button>
```

---

## 🔖 ویژگی‌ها و ویژگی‌های قابل استفاده (`data-*` attributes)

| ویژگی          | توضیح                                              | مقدار پیش‌فرض  |
| -------------- | -------------------------------------------------- | -------------- |
| `data-xhr`     | آدرس مقصد درخواست                                  | الزامی         |
| `data-method`  | نوع درخواست HTTP                                   | `GET`          |
| `data-target`  | selector ناحیه‌ای که پاسخ در آن درج شود            | -              |
| `data-popup`   | باز کردن پاسخ در Kendo Window                      | `false`        |
| `data-title`   | عنوان پنجره Popup                                  | "جزئیات"       |
| `data-width`   | عرض پنجره                                          | `600px`        |
| `data-form`    | اگر مقدار `true` باشد، فرم پدر را serialize می‌کند | `false`        |
| `data-confirm` | پیام تایید قبل از ارسال درخواست                    | -              |
| `data-spinner` | نمایش spinner حین درخواست (selector)               | `.xhr-loading` |
| `data-refresh` | ری‌لود کردن یک grid یا section پس از پاسخ          | -              |
| `data-onload`  | نام تابع جاوااسکریپت اجراشونده پس از دریافت        | -              |
| `data-push`    | افزودن به تاریخچه مرورگر                           | `false`        |
| `data-payload` | ارسال دیتا به صورت JSON                            | -              |

---

## 🔁 مدیریت History مرورگر

افزونه با استفاده از `history.pushState` و `window.onpopstate`:

- بین صفحات بارگذاری‌شده با دکمه‌های مرورگر جابه‌جا می‌شود
- از سرور مجدداً بارگذاری می‌کند (نه کش)

---

## 🧠 پشتیبانی از اسکریپت‌های داخل PartialView

- اسکریپت‌های داخل پاسخ دریافتی شناسایی شده و به صورت `IIFE` اجرا می‌شوند.
- پس از بستن پنجره popup، این اسکریپت‌ها حذف می‌شوند و در حافظه باقی نمی‌مانند.

---

## ⚙️ سازگاری با ASP.NET Core

در `_ViewStart.cshtml` یا هر ویوی دیگر می‌توان از هدر `X-Partial` استفاده کرد:

```csharp
@{
    var isPartial = Context.Request.Headers["X-Partial"] == "true";
    Layout = isPartial ? null : "~/Views/Shared/_Layout.cshtml";
}
```

---

## 🚫 جلوگیری از Cache مرورگر در بازگشت/جلو

در سرور یک middleware اضافه شده که فقط برای درخواست‌های `X-Partial`:

- Cache را غیرفعال می‌کند
- پاسخ را مجبور به تازه‌سازی از سرور می‌کند

```csharp
    public class PartialNoCacheMiddleware(RequestDelegate next)
    {
        private readonly RequestDelegate _next = next;
        public async Task InvokeAsync(HttpContext context)
        {
            var headers = context.Request.Headers;
            var isPartial = headers.ContainsKey("X-Partial") && headers["X-Partial"] == "true";
            var isAjax = headers.ContainsKey("X-Requested-With") && headers["X-Requested-With"] == "XMLHttpRequest";

            if (isPartial || isAjax)
            {
                var responseHeaders = context.Response.Headers;

                responseHeaders["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
                responseHeaders["Pragma"] = "no-cache";
                responseHeaders["Expires"] = "0";
            }

            await _next(context);
        }
    }
app.UseMiddleware<PartialNoCacheMiddleware>();
```

---

## ⏳ نمایش Spinner سراسری

اگر هیچ `data-spinner` مشخص نشد، به صورت پیش‌فرض `.xhr-loading` نمایش داده می‌شود.

در layout اصلی:

```html
<div
  class="xhr-loading"
  style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.6);z-index:9999;text-align:center;padding-top:20%;"
>
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">در حال بارگذاری...</span>
  </div>
</div>
```

---

## ✅ جمع‌بندی

افزونه `MiniSPA.js` یک راهکار سبک برای پروژه‌های Razor-based است تا بدون نیاز به SPA واقعی، رفتارهای دینامیک حرفه‌ای مانند:

- popupهای Kendo
- تعامل با فرم‌ها
- partial layout
- history state را تجربه کنند.

</div>
