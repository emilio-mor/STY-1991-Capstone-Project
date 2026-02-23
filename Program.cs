@model ExchangeRateApp.Models.ConverterViewModel
@{
    ViewData["Title"] = "Currency Converter";
}

<div class="page-header">
    <div>
        <h1>Currency Converter</h1>
        <p class="page-sub">Convert between any of 59 world currencies</p>
    </div>
</div>

<div class="converter-wrap">
    <div class="card">
        <form asp-action="Convert" method="post" id="converterForm">
            @Html.AntiForgeryToken()

            <div class="converter-grid">
                <div class="conv-side">
                    <label class="conv-label">From</label>
                    <div class="currency-select-wrap">
                        <select name="from" id="fromCurrency" class="currency-select" onchange="this.form.submit()">
                            @foreach (var c in Model.AllCurrencies)
                            {
                                <option value="@c.Code" @(c.Code == Model.FromCurrency ? "selected" : "")>
                                    @c.Flag @c.Code – @c.Name
                                </option>
                            }
                        </select>
                    </div>
                    <input type="number" name="amount" id="amountInput"
                           value="@Model.Amount" step="any" min="0"
                           class="amount-input" placeholder="1.00" />
                </div>

                <div class="conv-swap">
                    <button type="button" class="swap-btn" onclick="swapCurrencies()" title="Swap currencies">⇄</button>
                </div>

                <div class="conv-side">
                    <label class="conv-label">To</label>
                    <div class="currency-select-wrap">
                        <select name="to" id="toCurrency" class="currency-select" onchange="this.form.submit()">
                            @foreach (var c in Model.AllCurrencies)
                            {
                                <option value="@c.Code" @(c.Code == Model.ToCurrency ? "selected" : "")>
                                    @c.Flag @c.Code – @c.Name
                                </option>
                            }
                        </select>
                    </div>
                    <div class="amount-display">
                        @if (Model.Result != null)
                        {
                            <span class="result-number">@Model.Result.Result.ToString("N6")</span>
                        }
                        else
                        {
                            <span class="result-placeholder">—</span>
                        }
                    </div>
                </div>
            </div>

            <button type="submit" class="btn-convert">Convert →</button>
        </form>

        @if (Model.Result != null)
        {
            var r = Model.Result;
            <div class="result-box">
                <div class="result-main">
                    <span class="result-flag">@r.FromFlag</span>
                    <span class="result-from">@r.Amount.ToString("N2") @r.FromCurrency</span>
                    <span class="result-eq">=</span>
                    <span class="result-flag">@r.ToFlag</span>
                    <span class="result-to">@r.Result.ToString("N4") @r.ToCurrency</span>
                </div>
                <div class="result-rates">
                    <div class="rate-item">
                        <span>1 @r.FromCurrency</span>
                        <span>=</span>
                        <span class="rate-val">@r.Rate.ToString("N6") @r.ToCurrency</span>
                    </div>
                    <div class="rate-item">
                        <span>1 @r.ToCurrency</span>
                        <span>=</span>
                        <span class="rate-val">@r.InverseRate.ToString("N6") @r.FromCurrency</span>
                    </div>
                </div>
                <div class="result-timestamp">Updated @r.Timestamp.ToLocalTime().ToString("HH:mm:ss, MMM dd yyyy")</div>
            </div>

            <!-- Quick conversions table -->
            <div class="quick-conv-title">Quick Reference</div>
            <div class="quick-conv-table">
                @foreach (var mult in new[] {1, 5, 10, 25, 50, 100, 500, 1000})
                {
                    <div class="qc-row">
                        <span>@mult @r.FromCurrency</span>
                        <span>→</span>
                        <span>@((mult * r.Rate).ToString("N4")) @r.ToCurrency</span>
                    </div>
                }
            </div>
        }
    </div>

    <!-- Popular pairs quick links -->
    <div class="card mt-20">
        <div class="section-title">Popular Pairs</div>
        <div class="popular-pairs">
            @foreach (var (f, t) in new[] {("USD","EUR"),("USD","GBP"),("USD","JPY"),("USD","CAD"),
                                           ("BRL","HNL"),("EUR","BRL"),("GBP","JPY"),("USD","BRL")})
            {
                <a href="?from=@f&to=@t&amount=1" class="pair-chip @(Model.FromCurrency == f && Model.ToCurrency == t ? "active" : "")">
                    @f / @t
                </a>
            }
        </div>
    </div>
</div>

@section Scripts {
<script>
function swapCurrencies() {
    const from = document.getElementById('fromCurrency');
    const to = document.getElementById('toCurrency');
    const tmp = from.value;
    from.value = to.value;
    to.value = tmp;
    document.getElementById('converterForm').submit();
}

// Auto-convert on Enter
document.getElementById('amountInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('converterForm').submit();
});
</script>
}
